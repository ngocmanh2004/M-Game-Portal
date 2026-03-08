import React, { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, onValue, update, get, remove, onDisconnect as fbOnDisconnect } from 'firebase/database';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import { useUserData } from '../../../hooks/useUserData';
import { DealerArea } from './DealerArea';
import { PlayerSeat } from './PlayerSeat';
import { BettingPanel } from './BettingPanel';
import { ResultModal } from './ResultModal';
import {
  calculateScore, isBust, isFiveCards, isXiDach, isXiBang,
  compareWithDealer, calculateDeltaM, formatMoney,
} from '../../../utils/xidach/gameLogic';
import { dealInitialCards, dealerDrawCard } from '../../../utils/xidach/gameCreator';
import { getBotAction, getBotBet } from '../../../utils/xidach/botAI';
import { useGameReactions, GameReactionsOverlay, EmojiPickerButton, ThrowMenu } from '../../shared/GameReactions';
import { useVoiceChat } from '../../../hooks/useVoiceChat';

const TURN_DURATION = 30;
const WARNING_TIME = 5;

interface GameBoardProps {
  user: any;
  gameId: string;
  onBackToLobby: () => void;
}

const db = getDatabase();
const firestore = getFirestore();

function getNextPlayerPos(playerOrder: string[], currentUid: string, players: any): string | null {
  const currentIdx = playerOrder.findIndex(pos => players[pos]?.uid === currentUid);
  for (let i = 1; i <= playerOrder.length; i++) {
    const nextPos = playerOrder[(currentIdx + i) % playerOrder.length];
    const nextPlayer = players[nextPos];
    if (!nextPlayer) continue;
    const st = nextPlayer.status;
    if (st === 'playing') return nextPlayer.uid;
  }
  return null; // all done
}

export const GameBoard: React.FC<GameBoardProps> = ({ user, gameId, onBackToLobby }) => {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [betTimeLeft, setBetTimeLeft] = useState(30);
  const [turnTimeLeft, setTurnTimeLeft] = useState(10);
  const [resultCountdown, setResultCountdown] = useState(15);
  const [dealerHitLoading, setDealerHitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const betTimerRef = useRef<any>(null);
  const turnTimerRef = useRef<any>(null);
  const resultTimerRef = useRef<any>(null);
  const revealTimerRef = useRef<any>(null);
  const hostFallbackTimerRef = useRef<any>(null);
  const handledFinishRef = useRef(false);
  const handledDealRef = useRef(false);
  // Track last handled bot turn by unique key to avoid double-execution
  const lastHandledBotTurnRef = useRef('');
  const clockAudioRef = useRef<HTMLAudioElement | null>(null);
  const { userData, updateMoney } = useUserData(user?.uid);
  const { anims: reactionAnims, sendReaction } = useGameReactions('xidach', gameId, user.uid);
  const [throwMenu, setThrowMenu] = useState<{ uid: string; name: string; rect: DOMRect } | null>(null);
  // Voice chat — peerUids tính sau khi game load xong (tránh undefined lúc khởi tạo)
  const peerUids = game ? Object.values(game.players || {}).filter((p: any) => p?.uid && p.uid !== user.uid).map((p: any) => p.uid as string) : [];
  const { isMicOn, toggleMic, speakingUids, peerMicStates } = useVoiceChat('xidach', gameId, user.uid, peerUids);

  const myPos = Number(window.localStorage.getItem('xidach_position'));
  const isHost = game?.hostUid === user.uid;
  const myPlayer = game?.players?.[myPos];
  const isMyTurn = game?.currentTurn === user.uid && game?.status === 'playing';
  // Số lá bài của người đang có lượt — dùng để reset timer và re-trigger bot sau mỗi lần rút
  const currentTurnCardCount = (() => {
    if (!game?.players || !game?.currentTurn) return 0;
    const order: string[] = game.playerOrder || Object.keys(game.players);
    const pos = order.find((p: string) => game.players[p]?.uid === game.currentTurn);
    return pos != null ? (game.players[pos]?.cards?.length || 0) : 0;
  })();
  const revealedCount = game?.players
    ? Object.values(game.players).filter((p: any) => p?.revealedByDealer).length
    : 0;

  // Subscribe game
  useEffect(() => {
    const gameRef = ref(db, `xidach/games/${gameId}`);
    const unsub = onValue(gameRef, snap => {
      setGame(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [gameId]);

  // Init audio
  useEffect(() => {
    clockAudioRef.current = new Audio('/assets/audio/slow-clock.mp3');
    clockAudioRef.current.volume = 0.6;
    return () => { clockAudioRef.current?.pause(); };
  }, []);

  // onDisconnect: khi tab bị đóng, tự động xóa slot của nhà con khỏi game
  useEffect(() => {
    if (!game || isHost) return;
    const playerRef = ref(db, `xidach/games/${gameId}/players/${myPos}`);
    const disconnectOp = fbOnDisconnect(playerRef);
    disconnectOp.remove();
    return () => { disconnectOp.cancel(); };
  }, [gameId, myPos, isHost, game?.status]);

  // ===================== BETTING PHASE =====================
  useEffect(() => {
    if (!game || game.status !== 'betting') return;
    const deadline = game.betDeadline || Date.now() + 30000;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setBetTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(betTimerRef.current);
        // Auto-bet min for non-confirmed players
        if (myPlayer && myPlayer.status === 'betting') {
          handleConfirmBet(game.betAmount);
        }
      }
    };
    updateTimer();
    betTimerRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(betTimerRef.current);
  }, [game?.status, game?.betDeadline]);

  // Bot auto-bet
  useEffect(() => {
    if (!game || game.status !== 'betting' || !isHost) return;
    const players = game.players || {};
    const playerOrder = game.playerOrder || Object.keys(players);
    playerOrder.forEach((pos: string) => {
      const p = players[pos];
      if (!p || !p.isBot || p.status !== 'betting') return;
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        const amount = getBotBet(p.difficulty || 'easy', game.betAmount, p.money || 99999999);
        update(ref(db, `xidach/games/${gameId}/players/${pos}`), {
          bet: amount,
          status: 'playing',
        });
      }, delay);
    });
  }, [game?.status]);

  // Check all bets placed → deal
  useEffect(() => {
    if (!game || game.status !== 'betting' || !isHost || handledDealRef.current) return;
    const players = game.players || {};
    const allBet = Object.values(players).filter(Boolean).every((p: any) => p.status !== 'betting');
    if (allBet && Object.keys(players).length > 0) {
      handledDealRef.current = true;
      setTimeout(async () => {
        try {
          await update(ref(db, `xidach/games/${gameId}`), { status: 'dealing' });
          await dealInitialCards(gameId, game);
        } catch (e) { console.error('Deal error:', e); }
      }, 500);
    }
  }, [game?.players]);

  // ===================== PLAYING PHASE =====================
  // Turn timer - runs on ALL devices, sound at WARNING_TIME, auto-stand only on own turn
  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    clearInterval(turnTimerRef.current);
    clockAudioRef.current?.pause();
    setTurnTimeLeft(TURN_DURATION);
    let t = TURN_DURATION;
    turnTimerRef.current = setInterval(() => {
      t -= 1;
      setTurnTimeLeft(t);
      if (t === WARNING_TIME) {
        clockAudioRef.current?.play().catch(() => { });
      }
      if (t <= 0) {
        clearInterval(turnTimerRef.current);
        clockAudioRef.current?.pause();
        if (game?.currentTurn === user.uid) handleStand();
      }
    }, 1000);
    return () => {
      clearInterval(turnTimerRef.current);
      clockAudioRef.current?.pause();
    };
  }, [game?.currentTurn, game?.status, currentTurnCardCount]);

  // Host fallback timer (13s) — forces stand if player/bot never completes their turn
  useEffect(() => {
    if (!game || game.status !== 'playing' || !isHost) return;
    clearTimeout(hostFallbackTimerRef.current);
    const capturedTurn = game.currentTurn;
    hostFallbackTimerRef.current = setTimeout(async () => {
      try {
        const snap = await get(ref(db, `xidach/games/${gameId}`));
        const g = snap.val();
        if (!g || g.status !== 'playing' || g.currentTurn !== capturedTurn) return;
        const order: string[] = g.playerOrder || Object.keys(g.players);
        const pos = order.find((p: string) => g.players[p]?.uid === capturedTurn);
        if (!pos) return;
        const player = g.players[pos];
        if (!player || player.status !== 'playing') return;
        const updatedPlayers = { ...g.players, [pos]: { ...g.players[pos], status: 'stand' } };
        const nextUid = getNextPlayerPos(order, player.uid, updatedPlayers);
        const updates: any = { [`xidach/games/${gameId}/players/${pos}/status`]: 'stand' };
        if (nextUid) {
          updates[`xidach/games/${gameId}/currentTurn`] = nextUid;
        } else {
          updates[`xidach/games/${gameId}/status`] = 'dealerTurn';
          updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
        }
        await update(ref(db), updates);
      } catch (e) { console.error('Fallback timer error:', e); }
    }, 13000);
    return () => clearTimeout(hostFallbackTimerRef.current);
  }, [game?.currentTurn, game?.status, isHost, currentTurnCardCount]);

  // Bot action - uses turn key to prevent double execution
  useEffect(() => {
    if (!game || game.status !== 'playing' || !isHost) return;
    const currentUid = game.currentTurn;
    if (!currentUid) return;

    // Unique key per (turn + card count) so bot fires again after each hit
    const turnKey = `${gameId}-${game.roundNumber || 1}-${currentUid}-${currentTurnCardCount}`;
    if (lastHandledBotTurnRef.current === turnKey) return;

    const playerOrder = game.playerOrder || Object.keys(game.players || {});
    const botPos = playerOrder.find(
      (pos: string) => game.players[pos]?.uid === currentUid && game.players[pos]?.isBot
    );
    if (!botPos) return;

    // Mark this turn as handled BEFORE scheduling the timeout
    lastHandledBotTurnRef.current = turnKey;
    const botPlayer = game.players[botPos];
    const delay = 1200 + Math.random() * 1000;

    setTimeout(async () => {
      const action = getBotAction(botPlayer.cards || []);
      if (action === 'hit') {
        await executeBotHit(botPos, botPlayer);
      } else {
        await executeBotStand(botPos, botPlayer);
      }
    }, delay);
  }, [game?.currentTurn, game?.status, isHost, currentTurnCardCount]);

  const executeBotHit = async (pos: string, player: any) => {
    const snap = await get(ref(db, `xidach/games/${gameId}`));
    const g = snap.val();
    if (!g || !g.deck || g.deck.length === 0) return;
    const deck = [...g.deck];
    const card = deck.shift()!;
    // Use fresh cards from Firebase to avoid stale closure
    const freshCards = g.players?.[pos]?.cards || player.cards || [];
    const newCards = [...freshCards, card];
    const newScore = calculateScore(newCards);
    let newStatus = 'playing';
    if (isBust(newCards)) newStatus = 'busted';
    else if (isFiveCards(newCards)) newStatus = 'fiveCards';
    else if (calculateScore(newCards) === 21) newStatus = 'stand';
    else if (newCards.length >= 5) newStatus = 'stand';

    const updates: any = {
      [`xidach/games/${gameId}/players/${pos}/cards`]: newCards,
      [`xidach/games/${gameId}/players/${pos}/score`]: newScore,
      [`xidach/games/${gameId}/players/${pos}/status`]: newStatus,
      [`xidach/games/${gameId}/deck`]: deck,
    };

    if (newStatus !== 'playing') {
      const nextUid = getNextPlayerPos(
        g.playerOrder || Object.keys(g.players),
        player.uid,
        { ...g.players, [pos]: { ...g.players[pos], status: newStatus } }
      );
      if (nextUid) {
        updates[`xidach/games/${gameId}/currentTurn`] = nextUid;
      } else {
        updates[`xidach/games/${gameId}/status`] = 'dealerTurn';
        updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
      }
    }
    await update(ref(db), updates);
  };

  const executeBotStand = async (pos: string, player: any) => {
    const snap = await get(ref(db, `xidach/games/${gameId}`));
    const g = snap.val();
    if (!g) return;
    const updates: any = {
      [`xidach/games/${gameId}/players/${pos}/status`]: 'stand',
    };
    const updatedPlayers = { ...g.players, [pos]: { ...g.players[pos], status: 'stand' } };
    const nextUid = getNextPlayerPos(g.playerOrder || Object.keys(g.players), player.uid, updatedPlayers);
    if (nextUid) {
      updates[`xidach/games/${gameId}/currentTurn`] = nextUid;
    } else {
      updates[`xidach/games/${gameId}/status`] = 'dealerTurn';
      updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
    }
    await update(ref(db), updates);
  };

  // ===================== PLAYER ACTIONS =====================
  const handleConfirmBet = async (amount: number) => {
    if (!myPlayer || myPlayer.status !== 'betting') return;
    await update(ref(db, `xidach/games/${gameId}/players/${myPos}`), {
      bet: amount,
      status: 'playing',
    });
  };

  const handleHit = async () => {
    if (!isMyTurn || actionLoading) return;
    setActionLoading(true);
    clearInterval(turnTimerRef.current);
    try {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g || !g.deck || g.deck.length === 0) return;
      const deck = [...g.deck];
      const card = deck.shift()!;
      const newCards = [...(myPlayer.cards || []), card];
      const newScore = calculateScore(newCards);
      let newStatus = 'playing';
      if (isBust(newCards)) newStatus = 'busted';
      else if (isFiveCards(newCards)) newStatus = 'fiveCards';
      else if (calculateScore(newCards) === 21) newStatus = 'stand';
      else if (newCards.length >= 5) newStatus = 'stand';

      const updates: any = {
        [`xidach/games/${gameId}/players/${myPos}/cards`]: newCards,
        [`xidach/games/${gameId}/players/${myPos}/score`]: newScore,
        [`xidach/games/${gameId}/players/${myPos}/status`]: newStatus,
        [`xidach/games/${gameId}/deck`]: deck,
      };

      if (newStatus !== 'playing') {
        const nextUid = getNextPlayerPos(g.playerOrder || Object.keys(g.players), user.uid, { ...g.players, [myPos]: { ...g.players[myPos], status: newStatus } });
        if (nextUid) {
          updates[`xidach/games/${gameId}/currentTurn`] = nextUid;
        } else {
          updates[`xidach/games/${gameId}/status`] = 'dealerTurn';
          updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
        }
      }
      await update(ref(db), updates);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStand = async () => {
    if (!game || actionLoading) return;
    // Validation: nhà con phải có ít nhất 16 điểm để dừng
    const myCards = myPlayer?.cards || [];
    if (calculateScore(myCards) < 16 && !isFiveCards(myCards)) return;
    setActionLoading(true);
    clearInterval(turnTimerRef.current);
    try {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g) return;
      const updates: any = {
        [`xidach/games/${gameId}/players/${myPos}/status`]: 'stand',
      };
      const updatedPlayers = { ...g.players, [myPos]: { ...g.players[myPos], status: 'stand' } };
      const nextUid = getNextPlayerPos(g.playerOrder || Object.keys(g.players), user.uid, updatedPlayers);
      if (nextUid) {
        updates[`xidach/games/${gameId}/currentTurn`] = nextUid;
      } else {
        updates[`xidach/games/${gameId}/status`] = 'dealerTurn';
        updates[`xidach/games/${gameId}/currentTurn`] = 'dealer';
      }
      await update(ref(db), updates);
    } finally {
      setActionLoading(false);
    }
  };

  // ===================== DEALER - XÉT BÀI =====================
  // Nhà cái lật bài từng nhà con, so điểm ngay lúc lật.
  // Khi lật hết tất cả → tự động kết thúc ván.
  const handleRevealPlayer = async (pos: string) => {
    if (!isHost) return;
    try {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g || g.status !== 'dealerTurn') return;

      const player = g.players[pos];
      if (!player || player.revealedByDealer) return;

      const dealerCards = g.dealer.cards || [];
      const result = compareWithDealer(player.cards || [], dealerCards);
      const rawDeltaM = calculateDeltaM(player.bet || 0, result);
      const deltaM = rawDeltaM < 0 ? Math.max(rawDeltaM, -(player.money || 0)) : rawDeltaM;

      const updates: any = {
        [`xidach/games/${gameId}/players/${pos}/revealedByDealer`]: true,
        [`xidach/games/${gameId}/players/${pos}/result`]: result,
        [`xidach/games/${gameId}/players/${pos}/deltaM`]: deltaM,
      };

      // Kiểm tra xem đây có phải nhà con cuối cùng bị lật không
      const playerOrder: string[] = g.playerOrder || Object.keys(g.players);
      const allRevealed = playerOrder.every((p: string) => {
        if (p === pos) return true; // đang lật
        return g.players[p]?.revealedByDealer === true;
      });

      if (allRevealed) {
        // Tất cả đã bị lật → revealing 5s để mọi người quan sát, rồi mới qua kết quả
        updates[`xidach/games/${gameId}/dealer/score`] = calculateScore(dealerCards);
        updates[`xidach/games/${gameId}/status`] = 'revealing';
        await update(ref(db), updates);

        // Cập nhật số dư Firestore ngay khi lật xong (trước khi hiện modal)
        // Tính lại kết quả cho TẤT CẢ player (kể cả xì dách/xì bàng từ lúc chia bài)
        let dealerDeltaM = 0;
        const freshDealerCards = g.dealer.cards || [];
        for (const p of playerOrder) {
          const pl = g.players[p];
          if (!pl) continue;
          const pResult = p === pos ? result : compareWithDealer(pl.cards || [], freshDealerCards);
          const rawPDeltaM = calculateDeltaM(pl.bet || 0, pResult);
          const pDeltaM = rawPDeltaM < 0 ? Math.max(rawPDeltaM, -(pl.money || 0)) : rawPDeltaM;
          dealerDeltaM -= pDeltaM;
          if (!pl.isBot && pDeltaM !== 0) {
            try {
              await updateDoc(doc(firestore, 'users', pl.uid), { money: increment(pDeltaM) });
              if (pl.uid === user.uid && userData) updateMoney(userData.money + pDeltaM);
            } catch (e) { console.error('Balance update error:', pl.uid, e); }
          }
        }
        // Cập nhật số dư nhà cái (chỉ khi nhà cái là người thật)
        if (!g.dealerIsBot && dealerDeltaM !== 0) {
          try {
            await updateDoc(doc(firestore, 'users', g.hostUid), { money: increment(dealerDeltaM) });
            if (g.hostUid === user.uid && userData) updateMoney(userData.money + dealerDeltaM);
          } catch (e) { console.error('Dealer balance update error:', e); }
        }
      } else {
        await update(ref(db), updates);
      }
    } catch (e) {
      console.error('Reveal player error:', e);
    }
  };

  // ===================== DEALER TURN =====================
  const handleDealerHit = async () => {
    if (!isHost || dealerHitLoading) return;
    setDealerHitLoading(true);
    try {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g) return;
      const { newCards, newScore } = await dealerDrawCard(gameId, g.deck, g.dealer.cards);

      let newStatus = 'playing';
      if (isBust(newCards)) newStatus = 'busted';
      else if (isFiveCards(newCards)) newStatus = 'fiveCards';
      else if (calculateScore(newCards) === 21) newStatus = 'stand';
      else if (newCards.length >= 5) newStatus = 'stand';

      await update(ref(db, `xidach/games/${gameId}/dealer`), { status: newStatus, score: newScore });

      // Chỉ auto-kết thúc khi nhà cái BUST; các trường hợp còn lại (21, ngũ linh) nhà cái vẫn lật từng nhà thủ công
      if (newStatus === 'busted') {
        await finishGame(g, newCards, newStatus);
      }
    } finally {
      setDealerHitLoading(false);
    }
  };

  // ===================== FINISH GAME =====================
  const finishGame = async (g: any, dealerCards: string[], dealerFinalStatus: string) => {
    const players = g.players || {};
    const playerOrder = g.playerOrder || Object.keys(players);
    const updates: any = {};

    const dealerScore = calculateScore(dealerCards);
    const finalDealerCards = [...dealerCards];

    for (const pos of playerOrder) {
      const player = players[pos];
      if (!player) continue;
      // Nếu nhà con đã bị nhà cái lật trước đó → kết quả đã chốt, không tính lại
      if (player.revealedByDealer) continue;
      const result = compareWithDealer(player.cards || [], finalDealerCards);
      const rawDeltaM = calculateDeltaM(player.bet || 0, result);
      const deltaM = rawDeltaM < 0 ? Math.max(rawDeltaM, -(player.money || 0)) : rawDeltaM;
      updates[`xidach/games/${gameId}/players/${pos}/result`] = result;
      updates[`xidach/games/${gameId}/players/${pos}/deltaM`] = deltaM;
      updates[`xidach/games/${gameId}/players/${pos}/revealedByDealer`] = true;
    }

    updates[`xidach/games/${gameId}/dealer/score`] = dealerScore;
    updates[`xidach/games/${gameId}/dealer/status`] = dealerFinalStatus;
    // 'revealing': lật hết bài nhà con, đợi 5s trước khi hiện kết quả
    updates[`xidach/games/${gameId}/status`] = 'revealing';

    await update(ref(db), updates);

    // Cập nhật Firestore cho tất cả nhà con (kể cả xì dách/xì bàng đã lật từ đầu)
    let dealerDeltaM = 0;
    for (const pos of playerOrder) {
      const player = players[pos];
      if (!player) continue;
      const result = compareWithDealer(player.cards || [], finalDealerCards);
      const rawPDeltaM = calculateDeltaM(player.bet || 0, result);
      const pDeltaM = rawPDeltaM < 0 ? Math.max(rawPDeltaM, -(player.money || 0)) : rawPDeltaM;
      dealerDeltaM -= pDeltaM;
      if (!player.isBot && pDeltaM !== 0) {
        try {
          await updateDoc(doc(firestore, 'users', player.uid), { money: increment(pDeltaM) });
          if (player.uid === user.uid && userData) updateMoney(userData.money + pDeltaM);
        } catch (e) { console.error('Balance update error:', player.uid, e); }
      }
    }
    // Cập nhật số dư nhà cái (chỉ khi nhà cái là người thật)
    if (!g.dealerIsBot && dealerDeltaM !== 0) {
      try {
        await updateDoc(doc(firestore, 'users', g.hostUid), { money: increment(dealerDeltaM) });
        if (g.hostUid === user.uid && userData) updateMoney(userData.money + dealerDeltaM);
      } catch (e) { console.error('Dealer balance update error:', e); }
    }
  };

  // Reveal full dealer score when dealer turn starts
  useEffect(() => {
    if (!game || game.status !== 'dealerTurn' || !isHost) return;
    const dealer = game.dealer;
    if (!dealer) return;
    if (dealer.status !== 'waiting' && dealer.status !== 'playing') return;

    const fullScore = calculateScore(dealer.cards || []);
    update(ref(db, `xidach/games/${gameId}/dealer`), { status: 'playing', score: fullScore });
  }, [game?.status, isHost]);

  // ===================== BOT DEALER AUTO-PLAY =====================
  // When dealerIsBot, automatically draw cards until score ≥ 15, then auto-reveal takes over
  useEffect(() => {
    if (!game || game.status !== 'dealerTurn' || !isHost || !game.dealerIsBot) return;
    const dealer = game.dealer;
    if (!dealer || dealer.status !== 'playing') return; // wait for score reveal first

    const timer = setTimeout(async () => {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g || g.status !== 'dealerTurn') return;
      const d = g.dealer || {};
      if (d.status !== 'playing') return;
      const freshCards = d.cards || [];
      const freshScore = calculateScore(freshCards);

      if (freshScore >= 15 || freshCards.length >= 5) {
        // Dealer stands — update status and let auto-reveal useEffect handle reveals
        const finalStatus = isFiveCards(freshCards) ? 'fiveCards' : 'stand';
        await update(ref(db, `xidach/games/${gameId}/dealer`), { status: finalStatus, score: freshScore });
      } else {
        // Dealer hits
        const { newCards, newScore } = await dealerDrawCard(gameId, g.deck, freshCards);
        let newStatus = 'playing';
        if (isBust(newCards)) newStatus = 'busted';
        else if (isFiveCards(newCards)) newStatus = 'fiveCards';
        else if (newScore === 21) newStatus = 'stand';
        else if (newCards.length >= 5) newStatus = 'stand';

        await update(ref(db, `xidach/games/${gameId}/dealer`), { status: newStatus, score: newScore });

        if (newStatus === 'busted') {
          // Busted: all players win automatically, no need to reveal one-by-one
          const snap2 = await get(ref(db, `xidach/games/${gameId}`));
          const g2 = snap2.val();
          if (g2) await finishGame(g2, newCards, newStatus);
        }
        // stand/fiveCards: auto-reveal useEffect handles sequential reveal
        // still 'playing': useEffect re-triggers via cards.length change
      }
    }, 1200 + Math.random() * 800);

    return () => clearTimeout(timer);
  }, [game?.status, game?.dealer?.status, game?.dealer?.cards?.length]);

  // ===================== BOT DEALER AUTO-REVEAL =====================
  // After standing, bot reveals players one-by-one: suspicious (more cards) first, busted last
  useEffect(() => {
    if (!game || game.status !== 'dealerTurn' || !isHost || !game.dealerIsBot) return;
    const dealer = game.dealer;
    if (!dealer || (dealer.status !== 'stand' && dealer.status !== 'fiveCards')) return;

    const players = game.players || {};
    const playerOrder: string[] = game.playerOrder || Object.keys(players);

    const unrevealed = playerOrder.filter(
      (pos: string) => players[pos] && !players[pos].revealedByDealer
    );

    if (unrevealed.length === 0) {
      // All already revealed (e.g. everyone had xidach/xibang) — finish immediately
      const timer = setTimeout(async () => {
        const snap = await get(ref(db, `xidach/games/${gameId}`));
        const g = snap.val();
        if (!g || g.status !== 'dealerTurn') return;
        const d = g.dealer || {};
        await finishGame(g, d.cards || [], d.status);
      }, 800);
      return () => clearTimeout(timer);
    }

    // Sort: most cards first (suspicious), busted players last
    const sorted = [...unrevealed].sort((a: string, b: string) => {
      const pa = players[a];
      const pb = players[b];
      const aBusted = pa?.status === 'busted' ? 1 : 0;
      const bBusted = pb?.status === 'busted' ? 1 : 0;
      if (aBusted !== bBusted) return aBusted - bBusted;
      return (pb?.cards?.length || 0) - (pa?.cards?.length || 0);
    });

    const nextPos = sorted[0];
    const timer = setTimeout(() => {
      handleRevealPlayer(nextPos);
    }, 1000 + Math.random() * 1000);

    return () => clearTimeout(timer);
  }, [game?.status, game?.dealer?.status, game?.dealerIsBot, revealedCount]);

  // ===================== HUMAN DEALER AUTO-FINISH (Deadlock: all players already revealed) =====================
  // When all players have xidach/xibang from initial deal, revealedByDealer is already true for all.
  // The manual "Lật bài" button never appears (canXet requires !player.revealedByDealer).
  // This useEffect detects that case and automatically calls finishGame on behalf of the human dealer.
  useEffect(() => {
    if (!game || game.status !== 'dealerTurn' || !isHost || game.dealerIsBot) return;
    const players = game.players || {};
    const playerOrder: string[] = game.playerOrder || Object.keys(players);
    if (playerOrder.length === 0) return;
    const allAlreadyRevealed = playerOrder.every((pos: string) => players[pos]?.revealedByDealer === true);
    if (!allAlreadyRevealed) return;

    const timer = setTimeout(async () => {
      const snap = await get(ref(db, `xidach/games/${gameId}`));
      const g = snap.val();
      if (!g || g.status !== 'dealerTurn') return;
      const d = g.dealer || {};
      const dCards = d.cards || [];
      let dealerFinalStatus = 'stand';
      if (isXiBang(dCards)) dealerFinalStatus = 'xibang';
      else if (isXiDach(dCards)) dealerFinalStatus = 'xidach';
      else if (isBust(dCards)) dealerFinalStatus = 'busted';
      else if (isFiveCards(dCards)) dealerFinalStatus = 'fiveCards';
      await finishGame(g, dCards, dealerFinalStatus);
    }, 2000);

    return () => clearTimeout(timer);
  }, [game?.status, revealedCount]);

  // ===================== RESULT PHASE =====================
  useEffect(() => {
    if (!game || game.status !== 'revealing' || !isHost) return;
    clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(async () => {
      await update(ref(db, `xidach/games/${gameId}`), { status: 'finished' });
    }, 5000);
    return () => clearTimeout(revealTimerRef.current);
  }, [game?.status, isHost]);

  useEffect(() => {
    if (!game || game.status !== 'finished') {
      handledFinishRef.current = false;
      return;
    }
    setResultCountdown(15);
    let c = 15;
    resultTimerRef.current = setInterval(() => {
      c -= 1;
      setResultCountdown(c);
      if (c <= 0) {
        clearInterval(resultTimerRef.current);
        if (isHost) handleNextRound();
      }
    }, 1000);
    return () => clearInterval(resultTimerRef.current);
  }, [game?.status]);

  const handleNextRound = async () => {
    clearInterval(resultTimerRef.current);
    if (!isHost) return;
    handledDealRef.current = false;
    lastHandledBotTurnRef.current = '';
    const players = game.players || {};
    const updates: any = {
      [`xidach/games/${gameId}/status`]: 'betting',
      [`xidach/games/${gameId}/betDeadline`]: Date.now() + 30000,
      [`xidach/games/${gameId}/currentTurn`]: null,
      [`xidach/games/${gameId}/deck`]: [],
      [`xidach/games/${gameId}/dealer`]: { cards: [], score: 0, status: 'waiting' },
      [`xidach/games/${gameId}/roundNumber`]: (game.roundNumber || 1) + 1,
    };

    const playerOrder = game.playerOrder || Object.keys(players);
    for (const pos of playerOrder) {
      const p = players[pos];
      if (!p) continue;
      const newMoney = (p.money || 0) + (p.deltaM || 0);
      updates[`xidach/games/${gameId}/players/${pos}/cards`] = [];
      updates[`xidach/games/${gameId}/players/${pos}/score`] = 0;
      updates[`xidach/games/${gameId}/players/${pos}/bet`] = 0;
      updates[`xidach/games/${gameId}/players/${pos}/status`] = 'betting';
      updates[`xidach/games/${gameId}/players/${pos}/result`] = null;
      updates[`xidach/games/${gameId}/players/${pos}/deltaM`] = 0;
      updates[`xidach/games/${gameId}/players/${pos}/revealedByDealer`] = false;
      if (!p.isBot) updates[`xidach/games/${gameId}/players/${pos}/money`] = newMoney;
    }
    await update(ref(db), updates);
  };

  // ===================== LEAVE MID-GAME =====================
  const handleLeaveGame = async () => {
    try {
      // Nếu đang trong ván (có cược), trừ tiền đặt cược trước khi thoát
      if (game?.status !== 'finished' && !isHost && myPlayer) {
        const bet = myPlayer.bet || 0;
        const playerMoney = myPlayer.money ?? userData?.money ?? 0;
        const deduction = Math.min(bet, playerMoney);
        if (deduction > 0) {
          await updateDoc(doc(firestore, 'users', user.uid), { money: increment(-deduction) });
        }
        // Xóa slot player khỏi RTDB để người khác không còn thấy
        await remove(ref(db, `xidach/games/${gameId}/players/${myPos}`));
      }
    } catch (e) {
      console.error('Leave game error:', e);
    }
    onBackToLobby();
  };

  if (loading || !game) {
    return (
      <div className="w-screen h-screen bg-[#0B3D0B] flex items-center justify-center">
        <div className="text-white text-sm">Đang tải game...</div>
      </div>
    );
  }

  const players = game.players || {};
  const playerOrder = game.playerOrder || Object.keys(players);
  // Dealer score exposed for xét bài eligibility check
  const dealerScore = game.dealer?.score || 0;
  const dealerSt = game.dealer?.status || 'waiting';
  // Nhà cái được lật bài khi: đủ 15 điểm, hoặc đang có Ngũ Linh (5 lá ≤21); không áp dụng khi nhà cái là bot
  const canDealerXetBai = isHost && game.status === 'dealerTurn' && (dealerScore >= 15 || dealerSt === 'fiveCards') && !game.dealerIsBot;

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-between overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at center, #145214 0%, #0a300a 60%, #061806 100%)',
        backgroundImage: `radial-gradient(ellipse at center, #145214 0%, #0a300a 60%, #061806 100%)`,
      }}
    >
      {/* Felt table pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px)" }} />

      {/* Header bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-black/50 border-b border-white/10 z-10 flex-shrink-0">
        <button onClick={handleLeaveGame} className="text-[#FFD54F] text-[11px] font-bold bg-[#3E2723] px-2.5 py-1 rounded-lg border border-[#5D4037] active:scale-95">← Rời</button>
        <div className="text-[#FFD54F] font-bold text-[11px] uppercase tracking-wide">
          Xì Dách · #{game.roomCode} · Ván {game.roundNumber || 1}
        </div>
        {/* Show nhà con's own money; hide for host (shown in dealer area instead) */}
        {!isHost && (
          <div className="flex items-center gap-1.5">
            <div className="text-[#FFD54F] text-[11px] font-mono font-bold bg-black/50 px-2 py-0.5 rounded-lg border border-yellow-700/40">
              {formatMoney(myPlayer?.money ?? userData?.money ?? user.balance ?? 0)}
            </div>
          </div>
        )}
        {isHost && (
          <div className="flex items-center gap-1.5">
            <div className="w-5" />
          </div>
        )}
      </div>

      {/* Dealer Area */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-3 pb-1 z-10 w-full">
        <DealerArea
          dealer={game.dealer}
          isHost={isHost}
          gameStatus={game.status}
          onHit={handleDealerHit}
          hitLoading={dealerHitLoading}
          hostName={game.hostName || 'Nhà Cái'}
          hostPhoto={game.hostPhoto || ''}
          dealerIsBot={game.dealerIsBot || false}
          hostMoney={isHost && !game.dealerIsBot ? (userData?.money ?? user.balance ?? 0) : undefined}
        />
      </div>

      {/* Phase indicators — compact, non-blocking */}
      <div className="z-10 flex-shrink-0 text-center py-1">
        {game.status === 'betting' && (
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-yellow-700/40 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-[10px] font-bold animate-pulse">⏱ Đặt cược</span>
            <span className="text-yellow-300 text-[10px] font-mono font-bold">{betTimeLeft}s</span>
            <span className="text-gray-500 text-[9px]">· tối thiểu {formatMoney(game.betAmount)}</span>
          </div>
        )}
        {game.status === 'dealing' && (
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/20 rounded-full px-3 py-1">
            <span className="text-white text-[10px] font-bold animate-pulse">🃏 Đang chia bài...</span>
          </div>
        )}
        {game.status === 'dealerTurn' && !isHost && (
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full px-3 py-1">
            <span className="text-gray-400 text-[10px]">Chờ nhà cái...</span>
          </div>
        )}
        {game.status === 'revealing' && (
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full px-3 py-1 animate-pulse">
            <span className="text-gray-300 text-[10px] font-bold">Lật bài xong · chờ kết quả...</span>
          </div>
        )}
      </div>

      {/* Players Row — horizontal scroll on mobile */}
      <div className="w-full flex-1 flex items-end pb-3 z-10 overflow-x-auto overflow-y-hidden">
        <div className="flex justify-center items-end gap-2 px-2 mx-auto min-w-max">
          {playerOrder.map((pos: string) => {
            const player = players[pos];
            if (!player) return null;
            const isMe = player.uid === user.uid;
            const isTurn = game.currentTurn === player.uid;
            const showBetting = game.status === 'betting' && isMe && player.status === 'betting';
            // Each player only sees their own cards; during finished/revealing or when dealer reveals → show all
            const revealCards = player.revealedByDealer === true || game.status === 'finished' || game.status === 'revealing';
            const canXet = canDealerXetBai && !player.revealedByDealer;

            return (
              <div
                key={pos}
                className="relative flex flex-col items-center flex-shrink-0"
                data-player-uid={player.uid}
                onClick={!isMe ? (e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setThrowMenu({ uid: player.uid, name: player.displayName || 'Player', rect });
                } : undefined}
                style={!isMe ? { cursor: 'pointer' } : undefined}
              >
                {showBetting && (
                  <div className="absolute bottom-full mb-1 z-20">
                    <BettingPanel
                      player={player}
                      minBet={game.betAmount}
                      timeLeft={betTimeLeft}
                      onConfirmBet={handleConfirmBet}
                      hasConfirmed={player.status !== 'betting'}
                    />
                  </div>
                )}
                {canXet && (
                  <button
                    onClick={() => handleRevealPlayer(pos)}
                    className="mb-1 px-3 py-0.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[9px] font-bold rounded-full border border-orange-400/50 shadow-md shadow-orange-900/40 active:scale-95 transition-all z-20"
                  >
                    Lật bài
                  </button>
                )}
                <PlayerSeat
                  player={player}
                  isMyTurn={isTurn && isMe}
                  isTurn={isTurn}
                  isMe={isMe}
                  gameStatus={game.status}
                  betAmount={game.betAmount}
                  timeLeft={isTurn ? turnTimeLeft : undefined}
                  revealCards={revealCards}
                  isMicOn={isMe ? isMicOn : peerMicStates[player.uid] !== false}
                  isSpeaking={speakingUids.includes(player.uid)}
                  onToggleMic={isMe ? toggleMic : undefined}
                  onSendEmoji={isMe ? (e: string) => sendReaction('emoji', e) : undefined}
                  onHit={handleHit}
                  onStand={handleStand}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Modal */}
      {game.status === 'finished' && (
        <ResultModal
          game={game}
          myUid={user.uid}
          onNextRound={handleNextRound}
          onLeave={onBackToLobby}
          isHost={isHost}
          countdown={resultCountdown}
        />
      )}

      {/* Reaction animations */}
      <GameReactionsOverlay anims={reactionAnims} />

      {/* Throw menu (shown when clicking another player's avatar) */}
      {throwMenu && (
        <ThrowMenu
          targetUid={throwMenu.uid}
          targetName={throwMenu.name}
          anchorRect={throwMenu.rect}
          onThrow={item => sendReaction('throw', item, throwMenu.uid)}
          onClose={() => setThrowMenu(null)}
        />
      )}
    </div>
  );
};
