import React, { useEffect, useState, useCallback, useRef } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import { doc, updateDoc, increment, getFirestore } from "firebase/firestore";
import { Card } from "./Card";
import cn from "classnames";
import { validatePlay, canBeat } from "../../../utils/tienlen/validatePlay";
import { useUserData } from "../../../hooks/useUserData";
import { useTienLenLobby } from "../../../hooks/useTienLenLobby";
import { pickBotMove } from '../../../utils/tienlen/botAI';
import { useGameReactions, GameReactionsOverlay, EmojiPickerButton, ThrowMenu } from '../../shared/GameReactions';
import { useVoiceChat } from '../../../hooks/useVoiceChat';

// --- CẤU HÌNH ---
const TURN_DURATION = 20;
const WARNING_TIME = 8;
const DEALING_DURATION = 3000;
const CARD_WIDTH = 60;

/** Trả về chỉ số người chơi tiếp theo chưa hết bài (bỏ qua người có finishPosition > 0) */
function getNextActiveIndex(players: any[], currentIndex: number): number {
  const N = players.length;
  for (let i = 1; i < N; i++) {
    const next = (currentIndex + i) % N;
    if (!players[next]?.finishPosition) return next;
  }
  return currentIndex; // fallback (game should have ended before reaching here)
}
const CARD_HEIGHT = 84;
const dbFirestore = getFirestore();

// --- UTILS ---
function formatMoney(money: number) {
  if (!money && money !== 0) return "0";
  if (money >= 1_000_000_000) return `${(money / 1_000_000_000).toFixed(1)}B`;
  if (money >= 1_000_000) return `${(money / 1_000_000).toFixed(1)}M`;
  if (money >= 1_000) return `${(money / 1_000).toFixed(0)}K`;
  return money.toLocaleString();
}

const getRank = (c: string) =>
  "3456789TJQKA2".indexOf(c.length === 3 ? "T" : c[0]);
const getSuit = (c: string) => "SCDH".indexOf(c[c.length - 1]);
const sortByValue = (hand: string[]) =>
  [...hand].sort((a, b) => {
    const vA = getRank(a),
      vB = getRank(b);
    if (vA !== vB) return vA - vB;
    return getSuit(a) - getSuit(b);
  });
const sortBySuit = (hand: string[]) =>
  [...hand].sort((a, b) => {
    const sA = getSuit(a),
      sB = getSuit(b);
    if (sA !== sB) return sA - sB;
    return getRank(a) - getRank(b);
  });
const smartSort = (hand: string[]) => {
  const counts: Record<string, string[]> = {};
  hand.forEach((card) => {
    const v = card.length === 3 ? "T" : card[0];
    if (!counts[v]) counts[v] = [];
    counts[v].push(card);
  });
  const pairs: string[] = [];
  const rest: string[] = [];
  Object.values(counts).forEach((arr) => {
    if (arr.length >= 2) pairs.push(...arr);
    else rest.push(...arr);
  });
  return [...pairs, ...rest].sort((a, b) => getRank(a) - getRank(b));
};
const getSortFunc = (mode: string) =>
  mode === "suit" ? sortBySuit : mode === "smart" ? smartSort : sortByValue;
const dealNewDeck = (numPlayers: number) => {
  const suits = ["S", "C", "D", "H"];
  const ranks = [
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
    "2",
  ];
  let deck = [];
  for (let r of ranks) {
    for (let s of suits) {
      deck.push(r === "10" ? "10" + s : r + s);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const hands: string[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < 13 * numPlayers; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return hands.map((h) => sortByValue(h));
};

const calculatePenalty = (hand: string[], bet: number) => {
  let penalty = 0;
  hand.forEach((card) => {
    const rank = card.length === 3 ? "10" : card[0];
    const suit = card[card.length - 1];
    if (rank === "2") penalty += suit === "S" || suit === "C" ? bet : bet * 2;
  });
  const counts: Record<string, number> = {};
  hand.forEach((card) => {
    const rank = card.length === 3 ? "10" : card[0];
    counts[rank] = (counts[rank] || 0) + 1;
  });
  Object.values(counts).forEach((c) => {
    if (c === 4) penalty += bet * 2;
  });
  return penalty;
};

const DealingAnimation = ({
  numPlayers,
  onComplete,
}: {
  numPlayers: number;
  onComplete: () => void;
}) => {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const audio = new Audio("/assets/audio/card.mp3");
    audio.playbackRate = 2.0;
    const interval = setInterval(() => {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(interval);
      onCompleteRef.current();
    }, DEALING_DURATION);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const totalCards = 13 * numPlayers;
  const cards = Array.from({ length: totalCards }).map((_, i) => i);

  const getTargetPosition = (index: number) => {
    const playerIndex = index % numPlayers;
    if (numPlayers === 2) {
      return playerIndex === 0 ? "translate(0, 350px)" : "translate(0, -350px)";
    }
    if (numPlayers === 4) {
      if (playerIndex === 0) return "translate(0, 350px)";
      if (playerIndex === 1) return "translate(350px, 0)";
      if (playerIndex === 2) return "translate(0, -350px)";
      return "translate(-350px, 0)";
    }
    if (playerIndex === 0) return "translate(0, 350px)";
    if (playerIndex === 1) return "translate(350px, -100px)";
    return "translate(-350px, -100px)";
  };

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {cards.map((i) => (
        <div
          key={i}
          className="absolute w-[40px] h-[55px] bg-cover rounded shadow border border-gray-400"
          style={{
            backgroundImage: "url('/assets/image/cards/cardback.png')",
            animation: `dealFly_${i} 0.5s ease-out ${i * 0.05}s forwards`,
            opacity: 0,
          }}
        >
          <style>{`
                        @keyframes dealFly_${i} { 
                            0% { transform: scale(0.2); opacity: 0; } 
                            10% { opacity: 1; } 
                            100% { transform: ${getTargetPosition(
            i
          )} scale(0.5); opacity: 0; } 
                        }
                    `}</style>
        </div>
      ))}
    </div>
  );
};

const playSound = (type: "card" | "clock" | "win") => {
  const audio = new Audio(
    type === "card"
      ? "/assets/audio/card.mp3"
      : type === "clock"
        ? "/assets/audio/slow-clock.mp3"
        : "/assets/audio/win.mp3"
  );
  audio.volume = type === "clock" ? 0.5 : 1.0;
  audio.play().catch(() => { });
};
interface GameBoardProps {
  user: any;
  gameId: string;
  onBackToLobby: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  user,
  gameId,
  onBackToLobby,
}) => {
  const { userData, updateMoney } = useUserData(user?.uid);
  const { syncMoneyToLobby } = useTienLenLobby();
  const { anims: reactionAnims, sendReaction } = useGameReactions('tienlen', gameId, user.uid);
  const [throwMenu, setThrowMenu] = useState<{ uid: string; name: string; rect: DOMRect } | null>(null);

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<string>(
    () => localStorage.getItem("tienlen_sort") || "value"
  );
  const [error, setError] = useState<string>("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isDealing, setIsDealing] = useState(true);
  const [moneyChanges, setMoneyChanges] = useState<Record<number, number>>({});
  const clockAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastHandledBotTurnRef = useRef('');
  // Danh sách UIDs của người chơi khác (dùng cho voice chat)
  const peerUids = game ? Object.values(game.players || {}).filter((p: any) => p?.uid && p.uid !== user.uid).map((p: any) => p.uid as string) : [];
  const { isMicOn, toggleMic, speakingUids, peerMicStates } = useVoiceChat('tienlen', gameId, user.uid, peerUids);

  useEffect(() => {
    clockAudioRef.current = new Audio("/assets/audio/slow-clock.mp3");
    clockAudioRef.current.volume = 0.5;
    const bgMusic = document.getElementById("bg-music") as HTMLAudioElement;
    if (bgMusic) bgMusic.volume = 0.2;
    return () => {
      if (bgMusic) bgMusic.volume = 1.0;
    };
  }, []);

  useEffect(() => {
    if (user?.uid && gameId) {
      const unsub = syncMoneyToLobby(gameId, user.uid);
      return () => unsub();
    }
  }, [user?.uid, gameId]);

  useEffect(() => {
    if (!gameId) return;
    const db = getDatabase();
    const gameRef = ref(db, `tienlen/games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snap) => {
      const data = snap.val();
      if (!data) {
        onBackToLobby();
        return;
      }
      setGame((prev: any) => {
        if (
          (!prev || prev.status === "finished") &&
          data.status === "playing" &&
          !data.lastPlay
        ) {
          setIsDealing(true);
        }
        return data;
      });
      setLoading(false);
      setError("");
    });
    return () => unsubscribe();
  }, [gameId, onBackToLobby]);

  useEffect(() => {
    if (!game || game.status === "finished" || isDealing) {
      clockAudioRef.current?.pause();
      return;
    }
    setTimeLeft(TURN_DURATION);
    if (clockAudioRef.current) {
      clockAudioRef.current.pause();
      clockAudioRef.current.currentTime = 0;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        if (prev === WARNING_TIME + 1)
          clockAudioRef.current?.play().catch(() => { });
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      clockAudioRef.current?.pause();
    };
  }, [game?.currentPlayerIndex, game?.status, isDealing]);

  useEffect(() => {
    if (timeLeft === 0 && game && game.status !== "finished" && !isDealing) {
      const playersArr = Object.values(game.players || {}) as any[];
      const myPos = playersArr.findIndex((p: any) => p.uid === user.uid);
      if (game.currentPlayerIndex === myPos) {
        if (!game.lastPlay) {
          const myHand = playersArr[myPos].hand || [];
          const sorted = sortByValue(myHand);
          if (sorted.length > 0) executePlay([sorted[0]]);
        } else {
          handlePass();
        }
      }
    }
  }, [timeLeft]);

  // Bot auto-play — only fires on the host device
  useEffect(() => {
    if (!game || game.status === 'finished' || isDealing) return;
    const isHost = game.hostUid === user.uid;
    if (!isHost) return;
    const currentIdx = game.currentPlayerIndex;
    if (currentIdx === undefined || currentIdx === -1) return;
    const pArr = Object.values(game.players || {}) as any[];
    const currentPlayer = pArr[currentIdx];
    if (!currentPlayer?.isBot) return;

    // Unique key per turn: index + lastPlay change prevents double execution
    const lastPlayKey = (game.lastPlay?.cards || []).join(',');
    const turnKey = `${gameId}-${currentIdx}-${lastPlayKey}`;
    if (lastHandledBotTurnRef.current === turnKey) return;
    lastHandledBotTurnRef.current = turnKey;

    const timer = setTimeout(async () => {
      const botHand = currentPlayer.hand || [];
      if (botHand.length === 0) return;
      const difficulty = currentPlayer.difficulty || 'medium';
      const othersPassed = pArr
        .filter((_, idx) => idx !== currentIdx)
        .every((p: any) => !!p.passed);
      const effectiveLastPlay = (game.lastPlay?.cards?.length > 0 && !othersPassed) ? game.lastPlay.cards : null;
      const move = pickBotMove(botHand, effectiveLastPlay, difficulty, pArr, game);
      if (move && move.length > 0) {
        await executeBotPlay(move, currentIdx);
      } else {
        await executeBotPass(currentIdx);
      }
    }, 1000 + Math.random() * 600);

    return () => clearTimeout(timer);
  }, [game?.currentPlayerIndex, game?.status, isDealing, game?.lastPlay?.cards?.length]);

  useEffect(() => {
    if (game?.status === "finished") {
      let timer = 5;
      setCountdown(timer);
      const interval = setInterval(() => {
        timer--;
        setCountdown(timer);
        if (timer <= 0) {
          clearInterval(interval);
          const playersArr = Object.values(game.players || {}) as any[];
          if (playersArr.findIndex((p: any) => p.uid === user.uid) === 0)
            startNewGame();
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [game?.status]);

  const startNewGame = async () => {
    const db = getDatabase();
    const playersArr = Object.values(game.players || {}) as any[];
    const newHands = dealNewDeck(playersArr.length);
    const updates: any = {
      status: "playing",
      lastPlay: null,
      currentPlayerIndex: 0,
    };
    const winnerIndex = playersArr.findIndex(
      (p: any) => p.finishPosition === 1
    );
    if (winnerIndex !== -1) updates.currentPlayerIndex = winnerIndex;
    playersArr.forEach((p: any, idx: number) => {
      updates[`players/${idx}/hand`] = newHands[idx];
      updates[`players/${idx}/handCount`] = 13;
      updates[`players/${idx}/passed`] = false;
      updates[`players/${idx}/finishPosition`] = null;
      updates[`players/${idx}/deltaM`] = null; // Reset delta
    });
    setMoneyChanges({}); // Reset local state
    await update(ref(db, `tienlen/games/${gameId}`), updates);
  };

  const sortHand = useCallback((mode: string) => {
    setSortMode(mode);
    localStorage.setItem("tienlen_sort", mode);
  }, []);
  useEffect(() => {
    if (!game) return;
    const playersArr = Object.values(game.players || {}) as any[];
    const myPos = playersArr.findIndex((p: any) => p.uid === user.uid);
    const isFirstRound = !game.lastPlay;
    const isMyTurn = game.currentPlayerIndex === myPos;
    const mustInclude3S =
      isFirstRound && playersArr.length === 4 && isMyTurn && !game.status;
    if (mustInclude3S && selected.length > 0 && !selected.includes("3S"))
      setError("Phải đánh 3♠");
    else if (
      error === "Phải đánh 3♠" &&
      (!mustInclude3S || selected.includes("3S"))
    )
      setError("");
  }, [game, selected, user.uid, error]);

  // --- SỬA: Xoay UI ngược chiều kim đồng hồ, mapping đúng vị trí ---
  // Tính toán các mảng và hàm mapping vị trí
  let playersArr: Array<any> = [];
  let myPos = 0;
  let totalPlayers = 0;
  let rotatedPlayers: Array<any> = [];
  let getRealIndex = (displayIndex: number) => 0;

  if (game && game.players) {
    playersArr = Object.values(game.players) as Array<any>;
    myPos = playersArr.findIndex((p: any) => p && p.uid === user.uid);
    if (myPos === -1) myPos = 0; // Prevent negative indices if user has left
    totalPlayers = playersArr.length;
    // Xoay ngược chiều kim đồng hồ: bottom (user) → right → top → left
    const ccwIndexes = Array.from({ length: totalPlayers }, (_, i) =>
      (myPos + i) % totalPlayers
    );
    rotatedPlayers = ccwIndexes.map(idx => playersArr[idx]);
    getRealIndex = (displayIndex: number) =>
      (myPos + displayIndex) % totalPlayers;
  }

  const isFirstRound = !game?.lastPlay;
  const isMyTurn = game?.currentPlayerIndex === myPos;
  const myHand = playersArr[myPos]?.hand || [];
  const lastPlay = game?.lastPlay;
  const sortedHand = getSortFunc(sortMode)(myHand);
  const passedArr: boolean[] = playersArr.map((p: any) => !!p.passed);
  const othersPassed = passedArr
    .filter((v, idx) => idx !== myPos)
    .every(Boolean);
  const validCombo = selected.length > 0 && validatePlay(selected, []).valid;
  const canPlayCards =
    validCombo &&
    (!lastPlay || othersPassed || canBeat(selected, lastPlay.cards));
  const isStartingRound = isFirstRound && isMyTurn;
  const mustInclude3S =
    isStartingRound && playersArr.length === 4 && !game?.status;

  const handleCardClick = (card: string) => {
    if (!isMyTurn || game.status === "finished") return;
    setSelected((prev) =>
      prev.includes(card) ? prev.filter((c) => c !== card) : [...prev, card]
    );
  };
  const handleDeselect = () => setSelected([]);

  const updateUserBalance = async (uid: string, amount: number) => {
    try {
      const userRef = doc(dbFirestore, "users", uid);
      await updateDoc(userRef, { money: increment(amount) });
    } catch (err) { }
  };

  const calculateEndGameResult = (updates: any) => {
    const bet = game.betAmount || 0;

    // Cập nhật local finishPosition trước
    const localPlayers = playersArr.map((p, idx) => ({
      ...p,
      finishPosition:
        updates[`players/${idx}/finishPosition`] || p.finishPosition || 0,
    }));

    // Sắp xếp theo finishPosition
    const results = localPlayers
      .map((p, idx) => ({ ...p, idx }))
      .sort((a, b) => a.finishPosition - b.finishPosition || 0);

    const deltaMoney: Record<number, number> = {};
    localPlayers.forEach((_, i) => (deltaMoney[i] = 0));

    // Tính deltaMoney dựa trên bet
    if (totalPlayers === 4) {
      deltaMoney[results[0].idx] = bet * 12;
      deltaMoney[results[1].idx] = bet * 6;
      deltaMoney[results[2].idx] = -bet * 6;
      deltaMoney[results[3].idx] = -bet * 12;
    } else if (totalPlayers === 3) {
      deltaMoney[results[0].idx] = bet * 9;
      deltaMoney[results[1].idx] = bet * 3;
      deltaMoney[results[2].idx] = -bet * 12;
    } else if (totalPlayers === 2) {
      deltaMoney[results[0].idx] = bet * 12;
      deltaMoney[results[1].idx] = -bet * 12;
    }

    // Phạt thối/chặt
    const payerIdx = results[results.length - 1].idx;
    const receiverIdx = results[results.length - 2].idx;
    const handLeft =
      updates[`players/${payerIdx}/hand`] || localPlayers[payerIdx].hand || [];
    if (handLeft.length > 0) {
      const penalty = calculatePenalty(handLeft, bet);
      if (penalty > 0) {
        deltaMoney[payerIdx] -= penalty;
        deltaMoney[receiverIdx] += penalty;
      }
    }

    // Cập nhật moneyChanges để UI render kịp
    setMoneyChanges(deltaMoney);

    // Cập nhật vào updates và DB
    Object.keys(deltaMoney).forEach((idxStr) => {
      const i = Number(idxStr);
      const amount = deltaMoney[i];
      // Chỉ update tiền cho user thật (không phải bot)
      if (amount !== 0 && !playersArr[i].isBot) {
        updates[`players/${i}/money`] =
          (localPlayers[i].money || 0) + amount;
        updates[`players/${i}/deltaM`] = amount;
        updateUserBalance(playersArr[i].uid, amount);
      }
    });

    // Cập nhật local user
    if (userData && deltaMoney[myPos]) {
      updateMoney(userData.money + deltaMoney[myPos]);
    }
  };


  const executePlay = async (cardsToPlay: string[]) => {
    if (!canPlayCards && !cardsToPlay) return;
    playSound("card");
    const db = getDatabase();
    const newHand = myHand.filter((c: string) => !cardsToPlay.includes(c));
    const isPlayerFinished = newHand.length === 0;
    const currentFinishers = playersArr.filter(
      (p: any) => p.finishPosition > 0
    ).length;

    const updates: any = {
      lastPlay: { playerIndex: myPos, cards: cardsToPlay },
      [`players/${myPos}/hand`]: newHand,
      [`players/${myPos}/handCount`]: newHand.length,
      [`players/${myPos}/passed`]: false,
      currentPlayerIndex: getNextActiveIndex(playersArr, game.currentPlayerIndex),
    };

    if (isPlayerFinished) {
      playSound("win");
      updates[`players/${myPos}/finishPosition`] = currentFinishers + 1;
      const totalFinished = currentFinishers + 1;

      if (totalPlayers - totalFinished <= 1) {
        const loserPos = playersArr.findIndex(
          (p: any, idx) => !p.finishPosition && idx !== myPos
        );
        if (loserPos !== -1)
          updates[`players/${loserPos}/finishPosition`] = totalPlayers;

        // Fix: tính deltaMoney sau khi finishPosition đã được local update
        calculateEndGameResult(updates);
        updates["status"] = "finished";
        updates["currentPlayerIndex"] = -1;
      }
    }

    if (othersPassed)
      playersArr.forEach((_, idx) => {
        updates[`players/${idx}/passed`] = false;
      });

    await update(ref(db, `tienlen/games/${gameId}`), updates);
    setSelected([]);
  };

  const executeBotPlay = async (cardsToPlay: string[], botIndex: number) => {
    const db = getDatabase();
    const playersArr = Object.values(game.players || {}) as any[];
    const botHand = playersArr[botIndex].hand || [];
    const newHand = botHand.filter((c: string) => !cardsToPlay.includes(c));
    const isBotFinished = newHand.length === 0;
    const currentFinishers = playersArr.filter((p: any) => p.finishPosition > 0).length;

    const updates: any = {
      lastPlay: { playerIndex: botIndex, cards: cardsToPlay },
      [`players/${botIndex}/hand`]: newHand,
      [`players/${botIndex}/handCount`]: newHand.length,
      [`players/${botIndex}/passed`]: false,
      currentPlayerIndex: getNextActiveIndex(playersArr, game.currentPlayerIndex),
    };

    if (isBotFinished) {
      updates[`players/${botIndex}/finishPosition`] = currentFinishers + 1;
      const totalFinished = currentFinishers + 1;
      if (playersArr.length - totalFinished <= 1) {
        const loserPos = playersArr.findIndex((p: any, idx) => !p.finishPosition && idx !== botIndex);
        if (loserPos !== -1)
          updates[`players/${loserPos}/finishPosition`] = playersArr.length;
        calculateEndGameResult(updates);
        updates["status"] = "finished";
        updates["currentPlayerIndex"] = -1;
      }
    }
    if (playersArr.every((p: any, idx) => idx === botIndex || p.passed)) {
      playersArr.forEach((_, idx) => {
        updates[`players/${idx}/passed`] = false;
      });
    }
    await update(ref(db, `tienlen/games/${gameId}`), updates);
  };

  const executeBotPass = async (botIndex: number) => {
    const db = getDatabase();
    await update(ref(db, `tienlen/games/${gameId}`), {
      [`players/${botIndex}/passed`]: true,
      currentPlayerIndex: getNextActiveIndex(Object.values(game.players) as any[], game.currentPlayerIndex),
    });
  };


  const handlePlay = async () => {
    if (!canPlayCards || (mustInclude3S && !selected.includes("3S"))) return;
    await executePlay(selected);
  };
  const handlePass = async () => {
    const db = getDatabase();
    await update(ref(db, `tienlen/games/${gameId}`), {
      [`players/${myPos}/passed`]: true,
      currentPlayerIndex: getNextActiveIndex(playersArr, game.currentPlayerIndex),
    });
    setSelected([]);
  };
  const handleExit = async () => {
    setShowExitConfirm(false);
    const db = getDatabase();
    if (onBackToLobby) {
      await remove(ref(db, `tienlen/games/${gameId}/players/${myPos}`));
      const penalty = (game.betAmount || 0) * 4;
      updateUserBalance(user.uid, -penalty);
      if (userData) updateMoney(userData.money - penalty);
      onBackToLobby();
    }
  };

  const renderPlayerAvatar = ({
    player,
    index,
    isCurrentTurn,
    position,
  }: {
    player: any;
    index: number;
    isCurrentTurn: boolean;
    position: string;
  }) => {
    if (!player) return null;
    const deltaM = moneyChanges[index] || player.deltaM || 0;
    const showDelta = game.status === "finished" && deltaM !== 0;
    const isMe = player.uid === user.uid;
    const isSpeaking = speakingUids.includes(player.uid);
    const peerMicOn = isMe ? isMicOn : peerMicStates[player.uid] !== false;

    return (
      <div
        className="relative"
        data-player-uid={player.uid}
        onClick={player.uid !== user.uid ? (e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setThrowMenu({ uid: player.uid, name: player.displayName || 'Player', rect });
        } : undefined}
        style={player.uid !== user.uid ? { cursor: 'pointer' } : undefined}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 shadow-xl transition-all relative z-20",
            isCurrentTurn ? "scale-110 ring-2 ring-yellow-400 bg-black/60" : ""
          )}
        >
          <div className="relative">
            <img
              src={player.photoURL || "/assets/image/icons/user.png"}
              alt="avt"
              className="w-9 h-9 lg:w-11 lg:h-11 rounded-full object-cover border border-yellow-600"
            />
            {isCurrentTurn && game.status !== "finished" && (
              <div className="absolute -inset-1.5 pointer-events-none">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="#333"
                    strokeWidth="3"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke={timeLeft <= WARNING_TIME ? "#EF4444" : "#EAB308"}
                    strokeWidth="3"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (timeLeft / TURN_DURATION) * 100}
                    pathLength="100"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-gray-500">
                  {timeLeft}s
                </div>
              </div>
            )}
            {player.finishPosition && (
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg border z-20",
                  player.finishPosition === 1 ? "bg-yellow-500" : "bg-gray-600"
                )}
              >
                {player.finishPosition}
              </div>
            )}

            {/* Speaking Glow */}
            {isSpeaking && (
              <div className="absolute -inset-1.5 rounded-full border border-green-400 bg-green-500/20 animate-pulse pointer-events-none z-10" />
            )}

            {/* Remote Mute Indicator */}
            {!isMe && !peerMicOn && (
              <div className="absolute -top-1 -left-1 bg-red-600/90 text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white/40 shadow-sm z-30" title="Tắt mic">
                🔇
              </div>
            )}
          </div>

          <div className="text-center w-20 mt-1 z-20">
            <div className="text-[9px] text-white font-bold truncate">
              {player.displayName}
            </div>
            <div className="text-[8px] text-yellow-400 font-mono bg-black/50 px-1 rounded-full">
              {player.uid === user.uid && userData
                ? formatMoney(userData.money)
                : formatMoney(player.money || 0)}
            </div>

            {showDelta && (
              <div
                className={cn(
                  "text-[11px] font-black mt-0.5 px-1.5 py-0.5 rounded-full inline-block",
                  deltaM > 0
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/50"
                    : "bg-red-500/20 text-red-300 border border-red-400/50"
                )}
                style={{
                  textShadow:
                    deltaM > 0
                      ? "0 0 10px #fbbf24, 0 0 20px #f59e0b"
                      : "0 0 10px #f87171, 0 0 20px #ef4444",
                  animation: "moneyPulse 1.5s ease-in-out infinite",
                }}
              >
                {deltaM > 0 ? "+" : ""}
                {formatMoney(Math.abs(deltaM))}
              </div>
            )}

            <div className="text-[8px] text-gray-300">
              {player.handCount} lá
            </div>
          </div>

          {/* Local Player Settings (Mic & Emoji) */}
          {isMe && (
            <div className="flex gap-2 justify-center mt-1 z-20">
              <EmojiPickerButton onSend={(e: string) => sendReaction('emoji', e)} />
              <button
                onClick={(e) => { e.stopPropagation(); toggleMic(); }}
                title={isMicOn ? 'Tắt mic' : 'Bật mic'}
                className={cn(
                  "text-base rounded-full w-7 h-7 flex items-center justify-center border hover:bg-black/80 hover:border-white/40 active:scale-90 transition-all shadow-lg",
                  isMicOn ? "bg-green-600/80 border-green-400" : "bg-red-600/80 border-red-400"
                )}
              >
                {isMicOn ? '🎙️' : '🔇'}
              </button>
            </div>
          )}
        </div>

        {position !== "bottom" && player.handCount > 0 && (
          <div
            className={cn(
              "absolute flex items-center justify-center z-10 drop-shadow-xl",
              position === "left"
                ? "-right-8 top-1/2 -translate-y-1/2"
                : position === "right"
                  ? "-left-8 top-1/2 -translate-y-1/2"
                  : "-right-8 top-1/2 -translate-y-1/2"
            )}
          >
            <div className="relative w-8 h-11">
              <img
                src="/assets/image/cards/cardback.png"
                alt="back"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-black text-xs stroke-black drop-shadow-md">
                  {player.handCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center h-full w-full text-white text-lg">
        Đang tải dữ liệu ván chơi...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#1a0f0a]">
      {isDealing && (
        <DealingAnimation
          onComplete={() => setIsDealing(false)}
          numPlayers={totalPlayers}
        />
      )}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #3E2723 0%, #000 100%)",
        }}
      ></div>
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-1.5 bg-red-600 rounded-lg shadow-md border border-red-400 active:scale-95 text-white text-xs px-3"
        >
          Rời
        </button>
      </div>

      <div className="relative w-[95vw] h-[75vh] lg:w-[70vw] lg:h-[70vh] bg-[#0E4D28] rounded-[60px] border-[6px] border-[#5D4037] shadow-[0_0_30px_rgba(0,0,0,0.8)_inset] flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-[50px] border border-[#ffffff10]"
          style={{
            background: "radial-gradient(circle, #1a7a3e 0%, #083318 100%)",
          }}
        ></div>
        <div className="absolute opacity-5 font-bold text-4xl text-yellow-400 rotate-12 pointer-events-none select-none">
          TLMN
        </div>

        {rotatedPlayers[3] && (
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 z-20">
            {renderPlayerAvatar({
              player: rotatedPlayers[3],
              index: getRealIndex(3),
              isCurrentTurn: game.currentPlayerIndex === getRealIndex(3),
              position: "left"
            })}
          </div>
        )}
        {rotatedPlayers[1] && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
            {renderPlayerAvatar({
              player: rotatedPlayers[1],
              index: getRealIndex(1),
              isCurrentTurn: game.currentPlayerIndex === getRealIndex(1),
              position: "top"
            })}
          </div>
        )}
        {rotatedPlayers[2] && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 z-20">
            {renderPlayerAvatar({
              player: rotatedPlayers[2],
              index: getRealIndex(2),
              isCurrentTurn: game.currentPlayerIndex === getRealIndex(2),
              position: "right"
            })}
          </div>
        )}
        {rotatedPlayers[0] && (
          <div className="absolute -bottom-12 left-2 z-[50]">
            {renderPlayerAvatar({
              player: rotatedPlayers[0],
              index: getRealIndex(0),
              isCurrentTurn: isMyTurn,
              position: "bottom"
            })}
          </div>
        )}

        <div className="absolute z-10 flex items-center justify-center">
          {lastPlay ? (
            <div className="relative animate-scale-in">
              <div className="flex gap-0.5">
                {lastPlay.cards.map((card: string) => (
                  <Card key={card} card={card} isPlayerCard={false} />
                ))}
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/90 text-black text-[8px] px-2 py-0.5 rounded-full shadow whitespace-nowrap border border-gray-300">
                {playersArr[lastPlay.playerIndex]?.displayName}
              </div>
            </div>
          ) : (
            <div className="text-white/20 font-bold text-xs tracking-widest uppercase">
              Sẵn sàng
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-full pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto mb-1 scale-90 origin-bottom transition-all",
            isDealing ? "opacity-0" : "opacity-100 duration-500"
          )}
        >
          <div
            className="flex justify-center items-end"
            style={{ height: CARD_HEIGHT + 10 }}
          >
            {sortedHand.map((card, idx) => (
              <div
                key={card}
                style={{
                  width: CARD_WIDTH,
                  marginLeft: idx === 0 ? 0 : -30,
                  transform: selected.includes(card)
                    ? "translateY(-20px)"
                    : "translateY(0)",
                  transition: "transform 0.2s",
                  zIndex: idx,
                }}
              >
                <Card
                  card={card}
                  selected={selected.includes(card)}
                  onClick={() => handleCardClick(card)}
                  isPlayerCard={true}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-3 pb-1">
          <div className="flex gap-0.5 bg-black/60 p-0.5 rounded backdrop-blur-sm">
            <button
              onClick={() => sortHand("value")}
              className={cn(
                "px-2 py-1 text-[8px] rounded text-white hover:bg-white/20",
                sortMode === "value" && "bg-yellow-600"
              )}
            >
              Giá trị
            </button>
            <button
              onClick={() => sortHand("suit")}
              className={cn(
                "px-2 py-1 text-[8px] rounded text-white hover:bg-white/20",
                sortMode === "suit" && "bg-yellow-600"
              )}
            >
              Chất
            </button>
            <button
              onClick={() => sortHand("smart")}
              className={cn(
                "px-2 py-1 text-[8px] rounded text-white hover:bg-white/20",
                sortMode === "smart" && "bg-yellow-600"
              )}
            >
              Thông minh
            </button>
          </div>
          {isMyTurn && game.status !== "finished" && (
            <div className="flex gap-2">
              {selected.length > 0 ? (
                <button
                  onClick={handleDeselect}
                  className="px-4 py-1.5 rounded-full font-bold text-[10px] text-white bg-gray-600 border border-gray-400 shadow active:scale-95"
                >
                  Bỏ chọn
                </button>
              ) : (
                !isStartingRound && (
                  <button
                    onClick={handlePass}
                    className="px-4 py-1.5 rounded-full font-bold text-[10px] text-white bg-red-600 border border-red-400 shadow active:scale-95"
                  >
                    Bỏ lượt
                  </button>
                )
              )}
              <button
                onClick={handlePlay}
                disabled={selected.length === 0 || !validCombo || !canPlayCards}
                className={cn(
                  "px-6 py-1.5 rounded-full font-bold text-[10px] text-white shadow border transition-all active:scale-95",
                  selected.length > 0 && validCombo && canPlayCards
                    ? "bg-yellow-500 border-yellow-300 text-black animate-pulse"
                    : "bg-gray-700 border-gray-600 opacity-50"
                )}
              >
                Đánh
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {error && (
          <div className="bg-black/80 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500 shadow-lg text-xs font-bold animate-bounce">
            {error}
          </div>
        )}
        {game.status === "finished" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="bg-red-600 text-white px-6 py-2 rounded-xl border-2 border-yellow-400 shadow-2xl text-lg font-black mb-2">
              VÁN ĐẤU KẾT THÚC
            </div>
            {countdown !== null && (
              <div className="text-yellow-300 text-xs font-bold bg-black/60 px-2 py-1 rounded">
                Ván mới sau: {countdown}s
              </div>
            )}
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#3E2723] p-4 rounded-xl border-2 border-[#D7CCC8] shadow-2xl text-center w-64">
            <h3 className="text-sm font-bold text-[#FFD54F] mb-2">
              Rời bàn chơi?
            </h3>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleExit}
                className="px-4 py-1 bg-red-600 text-white rounded font-bold text-xs border border-red-400"
              >
                Rời ngay
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-1 bg-green-600 text-white rounded font-bold text-xs border border-green-400"
              >
                Ở lại
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Reaction animations overlay */}
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

      <style>{`
    @keyframes moneyPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.95; }
    }
    @keyframes animate-scale-in {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes animate-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-scale-in {
      animation: animate-scale-in 0.3s ease-out;
    }
    .animate-fade-in {
      animation: animate-fade-in 0.5s ease-out;
    }
  `}</style>
    </div>
  );
};

function getAllCombosWith3S(hand: string[]): string[][] {
  const combos: string[][] = [];
  const valueCount: Record<string, string[]> = {};
  hand.forEach(card => {
    const v = card.length === 3 ? 'T' : card[0];
    if (!valueCount[v]) valueCount[v] = [];
    valueCount[v].push(card);
  });
  // Single 3S
  if (hand.includes("3S")) combos.push(["3S"]);
  // Pair chứa 3S
  Object.values(valueCount).forEach(arr => {
    if (arr.length >= 2 && arr.includes("3S")) combos.push(arr.slice(0, 2));
  });
  // Trio chứa 3S
  Object.values(valueCount).forEach(arr => {
    if (arr.length >= 3 && arr.includes("3S")) combos.push(arr.slice(0, 3));
  });
  // Four chứa 3S
  Object.values(valueCount).forEach(arr => {
    if (arr.length === 4 && arr.includes("3S")) combos.push(arr.slice(0, 4));
  });
  return combos;
}
