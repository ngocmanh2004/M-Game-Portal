import React, { useEffect, useState, useCallback } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { Card } from './Card';
import cn from 'classnames';
import { validatePlay, canBeat } from '../../../utils/tienlen/validatePlay';

// Format tiền: 16231512 => 16M2
function formatMoney(money: number) {
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M${Math.floor((money % 1_000_000) / 100_000) || ''}`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K${Math.floor((money % 1_000) / 100) || ''}`;
  return money.toString();
}

const CARD_WIDTH = 40;
const CARD_HEIGHT = 56;

const sortByValue = (hand: string[]) =>
  [...hand].sort((a, b) => {
    const order = '3456789TJQKA2';
    const suitOrder = 'SCDH';
    const vA = order.indexOf(a[0]);
    const vB = order.indexOf(b[0]);
    if (vA !== vB) return vA - vB;
    return suitOrder.indexOf(a[1]) - suitOrder.indexOf(b[1]);
  });

const sortBySuit = (hand: string[]) =>
  [...hand].sort((a, b) => {
    const suitOrder = 'SCDH';
    const sA = suitOrder.indexOf(a[1]);
    const sB = suitOrder.indexOf(b[1]);
    if (sA !== sB) return sA - sB;
    const order = '3456789TJQKA2';
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

const smartSort = (hand: string[]) => {
  const counts: Record<string, string[]> = {};
  hand.forEach(card => {
    const v = card[0];
    if (!counts[v]) counts[v] = [];
    counts[v].push(card);
  });
  const pairs: string[] = [];
  const rest: string[] = [];
  Object.values(counts).forEach(arr => {
    if (arr.length >= 2) pairs.push(...arr);
    else rest.push(...arr);
  });
  return [...pairs, ...rest].sort((a, b) => {
    const order = '3456789TJQKA2';
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });
};

const getSortFunc = (mode: string) =>
  mode === 'suit' ? sortBySuit : mode === 'smart' ? smartSort : sortByValue;

export const GameBoard: React.FC<{ user: any; gameId: string }> = ({ user, gameId }) => {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<string>(() => localStorage.getItem('tienlen_sort') || 'value');
  const [error, setError] = useState<string>('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Hide header when in game
  useEffect(() => {
    const header = document.querySelector('.app-header');
    if (header) header.classList.add('hidden');
    return () => { if (header) header.classList.remove('hidden'); };
  }, []);

  // Listen to game state (with proper unsubscribe)
  useEffect(() => {
    if (!gameId) return;
    const db = getDatabase();
    const gameRef = ref(db, `tienlen/games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snap) => {
      setGame(snap.val());
      setLoading(false);
      // note: don't forcibly clear selected here to avoid UX jank when other players update game
      // clear errors when game updates
      setError('');
    });
    return () => unsubscribe();
  }, [gameId]);

  const sortHand = useCallback((mode: string) => {
    setSortMode(mode);
    localStorage.setItem('tienlen_sort', mode);
  }, []);

  // Validate 3S requirement (first round must include 3S for 4-player games)
  useEffect(() => {
    if (!game) return;
    const playersArr = Object.values(game.players || {});
    const myPos = playersArr.findIndex((p: any) => p.uid === user.uid);
    const isFirstRound = !game.lastPlay;
    const isMyTurn = game.currentPlayerIndex === myPos;
    const mustInclude3S = isFirstRound && playersArr.length === 4 && isMyTurn;

    if (mustInclude3S && selected.length > 0 && !selected.includes('3S')) {
      setError('Lượt đầu phải đánh kèm 3♠');
    } else if (error === 'Lượt đầu phải đánh kèm 3♠' && (!mustInclude3S || selected.includes('3S'))) {
      setError('');
    }
  }, [game, selected, user.uid, error]);

  if (loading || !game) {
    return <div className="text-white text-center py-8">Đang tải ván bài...</div>;
  }

  // Prepare data
  const playersArr = Object.values(game.players) as Array<{ displayName?: string; money?: number; [key: string]: any }>;
  const myPos = playersArr.findIndex((p: any) => p.uid === user.uid);

  // Rotate players so current user is at bottom (for rendering)
  const rotate = (arr: any[], n: number) => arr.slice(n).concat(arr.slice(0, n));
  const rotatedPlayers = rotate(playersArr, myPos);

  // Determine first player (note: game.currentPlayerIndex is authoritative during play)
  const isFirstRound = !game.lastPlay;
  let firstPlayerIdx = 0;
  if (isFirstRound) {
    if (playersArr.length === 4) {
      const idx = playersArr.findIndex((p: any) => (p.hand || []).includes('3S'));
      firstPlayerIdx = idx !== -1 ? idx : 0;
    } else {
      firstPlayerIdx = 0;
    }
  } else {
    firstPlayerIdx = game.currentPlayerIndex;
  }

  const isMyTurn = game.currentPlayerIndex === myPos;
  const myHand = rotatedPlayers[0]?.hand || [];
  const lastPlay = game.lastPlay;
  const lastPlayCards = lastPlay?.cards || [];
  const sortedHand = getSortFunc(sortMode)(myHand);

  // Passed state and "all others passed"
  const passedArr: boolean[] = playersArr.map((p: any) => !!p.passed);
  const othersPassed = passedArr.filter((v, idx) => idx !== myPos).every(Boolean);

  // Validate selection (combination validity only)
  const validCombo = selected.length > 0 && validatePlay(selected, []).valid;

  // Can play: valid combo AND (new round OR everyone else passed OR beats last play)
  const canPlayCards = validCombo && (
    !lastPlayCards.length || othersPassed || canBeat(selected, lastPlayCards)
  );

  const isStartingRound = isFirstRound && isMyTurn;
  const mustInclude3S = isStartingRound && playersArr.length === 4;

  // Handlers
  const handleCardClick = (card: string) => {
    if (!isMyTurn) return;
    setSelected(prev =>
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    );
  };

  const handlePlay = async () => {
    if (!canPlayCards || (mustInclude3S && !selected.includes('3S'))) return;
    const db = getDatabase();
    const newHand = myHand.filter((c: string) => !selected.includes(c));

    // Determine if this play opens a new round: after this play, all other players will have passed
    // Using current snapshot (othersPassed) to detect opening a new round
    const updates: any = {
      lastPlay: {
        playerIndex: myPos,
        cards: selected,
      },
      [`players/${myPos}/hand`]: newHand,
      [`players/${myPos}/handCount`]: newHand.length,
      [`players/${myPos}/passed`]: false,
      currentPlayerIndex: (game.currentPlayerIndex + 1) % playersArr.length,
    };

    // If this player is the only one who hasn't passed (othersPassed true), reset passed flags for everyone
    if (othersPassed) {
      playersArr.forEach((_, idx) => {
        updates[`players/${idx}/passed`] = false;
      });
    }

    await update(ref(db, `tienlen/games/${gameId}`), updates);
    setSelected([]);
  };

  const handlePass = async () => {
    if (isStartingRound) return; // Không được pass khi mở vòng (first play)
    const db = getDatabase();
    await update(ref(db, `tienlen/games/${gameId}`), {
      [`players/${myPos}/passed`]: true,
      currentPlayerIndex: (game.currentPlayerIndex + 1) % playersArr.length,
    });
    setSelected([]);
  };

  const handleDeselect = () => setSelected([]);

  // Thoát game: xác nhận, trừ tiền, đánh dấu thua, các người còn lại tiếp tục
  const handleExit = async () => {
    setShowExitConfirm(false);
    const db = getDatabase();
    const finishCount = playersArr.filter((p: any) => p.finishPosition).length;
    await update(ref(db, `tienlen/games/${gameId}/players/${myPos}`), {
      finishPosition: playersArr.length - finishCount,
      isPlaying: false,
      hand: [],
      handCount: 0,
    });
    // TODO: Trừ tiền, chuyển về lobby hoặc phòng chờ
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/image/background/bg-gamecards.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 320,
        minWidth: 480,
      }}
    >
      {/* Opponents - bố trí sát mép, bàn rộng */}
      {rotatedPlayers.slice(1).map((p: any, idx: number) => {
        const opponentGlobalIndex = (idx + 1 + myPos) % playersArr.length;
        const isOpponentTurn = game.currentPlayerIndex === opponentGlobalIndex;
        return (
          <div
            key={p.uid}
            className={cn(
              "absolute flex flex-col items-center z-20",
              idx === 0 && "left-2 top-1/2 -translate-y-1/2",
              idx === 1 && "top-2 left-1/2 -translate-x-1/2",
              idx === 2 && "right-2 top-1/2 -translate-y-1/2"
            )}
            style={{ minWidth: 80 }}
          >
            <div className={cn(
              "relative mb-1 rounded-full transition-all",
              isOpponentTurn ? "ring-4 ring-yellow-400" : "ring-2 ring-gray-400"
            )}>
              <img
                src={p.photoURL || '/assets/image/icons/user.png'}
                alt={p.displayName}
                className="w-12 h-12 rounded-full border-2 border-yellow-300 shadow object-cover"
              />
              {isOpponentTurn && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full px-2 py-1 text-xs font-bold shadow animate-bounce border border-yellow-600">
                  Đánh
                </span>
              )}
            </div>
            <div className="text-xs text-yellow-900 font-bold truncate max-w-[80px]">{p.displayName}</div>
            <div className="text-xs text-green-700 font-bold">{formatMoney(p.money || 0)}đ</div>
            <div className="text-xs text-gray-600">{p.handCount || 0} lá</div>
          </div>
        );
      })}

      {/* Play Area - Center, bàn rộng hơn */}
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-[60vw] max-w-[420px] min-w-[220px]">
        <div className="bg-white/90 border-2 border-yellow-400 rounded-xl px-6 py-4 shadow-lg flex flex-col items-center w-full">
          <div className="text-yellow-700 font-bold text-lg mb-1">Bàn chơi</div>
          {lastPlay ? (
            <>
              <div className="flex gap-1 mb-1">
                {lastPlay.cards.map((card: string) => (
                  <Card key={card} card={card} />
                ))}
              </div>
              <div className="text-gray-700 text-xs">
                {playersArr[lastPlay.playerIndex]?.displayName} vừa đánh
              </div>
            </>
          ) : (
            <div className="text-gray-400 italic text-base">Chưa có ai đánh</div>
          )}
        </div>
      </div>

      {/* Player Hand - Bottom */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30 w-full">
        <div
          className="flex flex-row justify-center items-end w-full overflow-x-auto px-2 pb-2"
          style={{ minHeight: CARD_HEIGHT + 10 }}
        >
          {sortedHand.map(card => (
            <div
              key={card}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
              }}
            >
              <Card
                card={card}
                selected={selected.includes(card)}
                onClick={() => handleCardClick(card)}
                disabled={!isMyTurn}
              />
            </div>
          ))}
        </div>
        {/* Sort Controls */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => sortHand('value')}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold shadow border border-yellow-400",
              sortMode === 'value'
                ? 'bg-yellow-400 text-black'
                : 'bg-white text-yellow-700 hover:bg-yellow-200'
            )}
          >
            Giá trị
          </button>
          <button
            onClick={() => sortHand('suit')}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold shadow border border-yellow-400",
              sortMode === 'suit'
                ? 'bg-yellow-400 text-black'
                : 'bg-white text-yellow-700 hover:bg-yellow-200'
            )}
          >
            Chất
          </button>
          <button
            onClick={() => sortHand('smart')}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold shadow border border-yellow-400",
              sortMode === 'smart'
                ? 'bg-yellow-400 text-black'
                : 'bg-white text-yellow-700 hover:bg-yellow-200'
            )}
          >
            Xếp bài
          </button>
        </div>
      </div>

      {/* Game Controls - Fixed at Bottom */}
      <div
        className="control-buttons"
        style={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(255,255,255,0.95)',
          padding: '8px 12px',
          borderRadius: 16,
          border: '2px solid #facc15',
          boxShadow: '0 2px 12px #facc1555',
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          minWidth: 220,
        }}
      >
        {/* Nút Thoát */}
        <button
          className="px-3 py-1 rounded bg-red-500 text-white font-bold shadow border border-red-700 hover:bg-red-600 transition-all text-sm"
          onClick={() => setShowExitConfirm(true)}
        >
          Thoát
        </button>
        {!isMyTurn ? (
          <div className="text-yellow-700 text-base font-semibold px-2">
            Đang chờ {playersArr[game.currentPlayerIndex]?.displayName}...
          </div>
        ) : (
          <>
            {selected.length === 0 ? (
              <>
                {!isStartingRound && (
                  <button
                    className="px-3 py-1 rounded bg-yellow-400 text-black font-semibold shadow border border-yellow-700 hover:bg-yellow-500 transition-all min-h-[36px] text-sm"
                    onClick={handlePass}
                  >
                    Bỏ lượt
                  </button>
                )}
                {isStartingRound && (
                  <div className="text-yellow-700 font-semibold px-2 text-sm">
                    Chọn bài để đánh
                  </div>
                )}
              </>
            ) : (
              <>
                {validCombo && canPlayCards && (!mustInclude3S || selected.includes('3S')) && (
                  <button
                    className="px-5 py-1 rounded bg-green-500 text-white font-bold shadow border border-green-700 hover:bg-green-600 transition-all min-h-[36px] text-base animate-pulse"
                    onClick={handlePlay}
                  >
                    Đánh bài
                  </button>
                )}
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-semibold shadow border border-gray-400 hover:bg-gray-300 transition-all min-h-[36px] text-sm"
                  onClick={handleDeselect}
                >
                  Bỏ chọn
                </button>
                {!isStartingRound && (
                  <button
                    className="px-3 py-1 rounded bg-yellow-400 text-black font-semibold shadow border border-yellow-700 hover:bg-yellow-500 transition-all min-h-[36px] text-sm"
                    onClick={handlePass}
                  >
                    Bỏ lượt
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Tiền bản thân - góc dưới trái */}
      <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2 bg-white/90 border-2 border-yellow-400 rounded-lg px-3 py-1 shadow-lg">
        <img
          src={user.photoURL || '/assets/image/icons/user.png'}
          alt={user.displayName}
          className="w-8 h-8 rounded-full border border-yellow-400"
        />
        <div className="flex flex-col">
          <span className="text-yellow-900 font-bold text-sm">{user.displayName}</span>
          <span className="text-green-700 font-bold text-xs">{formatMoney(playersArr[myPos]?.money || 0)}đ</span>
        </div>
      </div>

      {/* Validation Feedback */}
      <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-50">
        {selected.length > 0 && !validCombo && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-xl shadow font-semibold animate-pulse text-sm">
            ⚠️ Bộ bài không hợp lệ
          </div>
        )}
        {error && (
          <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl shadow font-semibold animate-pulse text-sm">
            {error}
          </div>
        )}
        {selected.length > 0 && validCombo && lastPlay && !canPlayCards && !othersPassed && (
          <div className="bg-orange-500 text-white px-4 py-2 rounded-xl shadow font-semibold animate-pulse text-sm">
            ⚠️ Bộ bài này không đủ lớn để đè
          </div>
        )}
      </div>

      {/* Modal xác nhận Thoát */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl border-2 border-yellow-400 shadow-xl px-6 py-6 min-w-[260px] max-w-[90vw]">
            <div className="text-lg font-bold text-yellow-700 mb-2 text-center">Bạn chắc chắn muốn thoát?</div>
            <div className="text-gray-700 text-center mb-4">Bạn sẽ bị tính thua và trừ tiền theo luật.</div>
            <div className="flex gap-4 justify-center">
              <button
                className="px-4 py-1 rounded bg-red-500 text-white font-bold shadow border border-red-700 hover:bg-red-600 transition-all"
                onClick={handleExit}
              >
                Thoát
              </button>
              <button
                className="px-4 py-1 rounded bg-gray-200 text-gray-800 font-semibold shadow border border-gray-400 hover:bg-gray-300 transition-all"
                onClick={() => setShowExitConfirm(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
