import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useCaCaNguGame } from '../../../hooks/useCaCaNguGame';
import {
  PATH_COORDS,
  HOME_COL_COORDS,
  HOME_YARD_COORDS,
  CENTER_COORD,
  SAFE_PATH_INDICES,
  COLOR_META,
  COLOR_START,
  COLORS,
} from '../../../utils/cacangu/boardConfig';
import { CaNguColor, CaNguPiece, CaNguPiecePos, CaNguMoveOption } from '../../../types';
import {
  useGameReactions,
  GameReactionsOverlay,
  EmojiPickerButton,
  ThrowMenu,
} from '../../shared/GameReactions';
import { useVoiceChat } from '../../../hooks/useVoiceChat';
import { GameOverModal } from './GameOverModal';

interface CellDef {
  type: 'homeYard' | 'path' | 'homeCol' | 'center' | 'dead';
  color?: CaNguColor;
  pathIndex?: number;
  homeColStep?: number;
  isSafe: boolean;
}

interface GameBoardProps {
  user: { uid: string; username: string; email: string; balance: number; avatar?: string };
  gameId: string;
  onBackToLobby: () => void;
}

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const PIECE_COLOR: Record<CaNguColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  green: '#22c55e',
};

const YARD_BG_CSS: Record<CaNguColor, string> = {
  red: 'rgba(185,28,28,0.92)',
  blue: 'rgba(29,78,216,0.92)',
  yellow: 'rgba(161,98,7,0.92)',
  green: 'rgba(21,128,61,0.92)',
};

const COL_BG_CSS: Record<CaNguColor, string> = {
  red: 'rgba(254,202,202,0.88)',
  blue: 'rgba(191,219,254,0.88)',
  yellow: 'rgba(254,240,138,0.88)',
  green: 'rgba(187,247,208,0.88)',
};

const COLOR_TEXT_CSS: Record<CaNguColor, string> = {
  red: '#fca5a5',
  blue: '#93c5fd',
  yellow: '#fde047',
  green: '#86efac',
};

const YARD_BOUNDS: Record<CaNguColor, { rMin: number; rMax: number; cMin: number; cMax: number }> = {
  red:    { rMin: 0, rMax: 5, cMin: 0, cMax: 5 },
  blue:   { rMin: 0, rMax: 5, cMin: 9, cMax: 14 },
  yellow: { rMin: 9, rMax: 14, cMin: 9, cMax: 14 },
  green:  { rMin: 9, rMax: 14, cMin: 0, cMax: 5 },
};

function formatMoney(n: number): string {
  if (!n && n !== 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString('vi-VN');
}

function buildCellMap(): Map<string, CellDef> {
  const map = new Map<string, CellDef>();
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      map.set(`${r},${c}`, { type: 'dead', isSafe: false });
    }
  }
  COLORS.forEach(color => {
    const b = YARD_BOUNDS[color];
    for (let r = b.rMin; r <= b.rMax; r++) {
      for (let c = b.cMin; c <= b.cMax; c++) {
        map.set(`${r},${c}`, { type: 'homeYard', color, isSafe: false });
      }
    }
  });
  PATH_COORDS.forEach(([r, c], index) => {
    map.set(`${r},${c}`, {
      type: 'path',
      pathIndex: index,
      isSafe: SAFE_PATH_INDICES.has(index),
    });
  });
  COLORS.forEach(color => {
    HOME_COL_COORDS[color].forEach(([r, c], step) => {
      map.set(`${r},${c}`, {
        type: 'homeCol',
        color,
        homeColStep: step + 1,
        isSafe: true,
      });
    });
  });
  const [cr, cc] = CENTER_COORD;
  map.set(`${cr},${cc}`, { type: 'center', isSafe: true });
  return map;
}

const CELL_MAP = buildCellMap();

const YARD_SLOT_SET = new Set<string>();
COLORS.forEach(color => {
  HOME_YARD_COORDS[color].forEach(([r, c]) => YARD_SLOT_SET.add(`${r},${c}`));
});

function getCellKeyForPiece(
  pos: CaNguPiecePos,
  color: CaNguColor,
  pieceId: number,
): string | null {
  if (pos.type === 'home') {
    const slots = HOME_YARD_COORDS[color];
    const [r, c] = slots[Math.min(pieceId, 3)];
    return `${r},${c}`;
  }
  if (pos.type === 'path') {
    const coord = PATH_COORDS[pos.index];
    if (!coord) return null;
    return `${coord[0]},${coord[1]}`;
  }
  if (pos.type === 'homeCol') {
    const arr = HOME_COL_COORDS[color];
    const coord = arr[Math.min(pos.step - 1, 5)];
    if (!coord) return null;
    return `${coord[0]},${coord[1]}`;
  }
  const [r, c] = CENTER_COORD;
  return `${r},${c}`;
}

function getCellKeyForTarget(targetPos: CaNguPiecePos, color: CaNguColor): string | null {
  return getCellKeyForPiece(targetPos, color, 0);
}

let _boardAnimsInjected = false;
function injectBoardAnims() {
  if (_boardAnimsInjected || typeof document === 'undefined') return;
  _boardAnimsInjected = true;
  const s = document.createElement('style');
  s.id = 'cacangu-board-anims';
  s.textContent = `
    @keyframes boardRipple {
      0%   { box-shadow: 0 0 0 0px rgba(255,215,0,0.85); }
      60%  { box-shadow: 0 0 0 9px rgba(255,215,0,0.15); }
      100% { box-shadow: 0 0 0 12px rgba(255,215,0,0); }
    }
    @keyframes pieceMove {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.55); }
      100% { transform: scale(1); }
    }
    @keyframes homeColGlow {
      0%,100% { filter: brightness(1); }
      50%     { filter: brightness(1.7) drop-shadow(0 0 4px white); }
    }
    @keyframes validPulse {
      0%,100% { box-shadow: 0 0 0 2px rgba(74,222,128,0.55), inset 0 0 6px rgba(74,222,128,0.2); }
      50%     { box-shadow: 0 0 0 5px rgba(74,222,128,0.85), inset 0 0 10px rgba(74,222,128,0.4); }
    }
    @keyframes piecePulse {
      0%,100% { box-shadow: 0 0 3px 1px rgba(255,255,255,0.25); }
      50%     { box-shadow: 0 0 9px 4px rgba(255,255,255,0.6); }
    }
    @keyframes diceRollAnim {
      0%   { transform: scale(1)    rotate(0deg);   }
      20%  { transform: scale(1.35) rotate(-22deg); }
      40%  { transform: scale(1.7)  rotate(18deg);  }
      60%  { transform: scale(1.85) rotate(-12deg); }
      80%  { transform: scale(1.45) rotate(6deg);   }
      100% { transform: scale(1)    rotate(0deg);   }
    }
    @keyframes doiBadgePop {
      0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
      70%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
      100% { transform: scale(1)   rotate(0deg); opacity: 1; }
    }
    @keyframes turnArrow {
      0%,100% { transform: translateX(0); }
      50%     { transform: translateX(5px); }
    }
    @keyframes avatarShake {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      15%     { transform: translate(-6px,2px) rotate(-4deg); }
      30%     { transform: translate(6px,-2px) rotate(4deg); }
      45%     { transform: translate(-5px,2px) rotate(-3deg); }
      60%     { transform: translate(5px,1px) rotate(3deg); }
      75%     { transform: translate(-3px,-1px) rotate(-1deg); }
      90%     { transform: translate(2px,0) rotate(0deg); }
    }
    @keyframes confettiDropCell {
      0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
      100% { transform: translateY(30px) rotate(360deg); opacity: 0; }
    }
    @keyframes rollBtnPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(250,204,21,0.5); }
      50%     { box-shadow: 0 0 0 10px rgba(250,204,21,0); }
    }
  `;
  document.head.appendChild(s);
}

interface PieceCellEntry {
  uid: string;
  piece: CaNguPiece;
  color: CaNguColor;
}

export const GameBoard: React.FC<GameBoardProps> = ({ user, gameId, onBackToLobby }) => {
  const [myColor, setMyColor] = useState<CaNguColor>('red');

  const { gameState, loading, isMyTurn, canRoll, handleRoll, handleSelectPiece, handleMove } =
    useCaCaNguGame(gameId, user.uid, myColor);

  useEffect(() => {
    const c = gameState?.players?.[user.uid]?.color;
    if (c && c !== myColor) setMyColor(c);
  }, [gameState, user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const { anims: reactionAnims, sendReaction } = useGameReactions('cacangu', gameId, user.uid);
  const [throwMenu, setThrowMenu] = useState<{
    uid: string;
    name: string;
    rect: DOMRect;
  } | null>(null);

  const peerUids = useMemo(
    () => (gameState?.playerOrder ?? []).filter(uid => uid !== user.uid),
    [gameState?.playerOrder, user.uid],
  );
  const { isMicOn, toggleMic } = useVoiceChat('cacangu', gameId, user.uid, peerUids);

  const [displayDice, setDisplayDice] = useState<[number, number] | null>(null);
  const [diceAnimating, setDiceAnimating] = useState(false);
  const prevDiceKeyRef = useRef('');
  const diceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const key = JSON.stringify(gameState?.dice ?? null);
    if (key === prevDiceKeyRef.current) return;
    prevDiceKeyRef.current = key;
    if (diceIntervalRef.current) clearInterval(diceIntervalRef.current);
    if (gameState?.dice) {
      setDiceAnimating(true);
      let count = 0;
      const frozen = gameState.dice;
      diceIntervalRef.current = setInterval(() => {
        setDisplayDice([
          (1 + Math.floor(Math.random() * 6)) as 1,
          (1 + Math.floor(Math.random() * 6)) as 1,
        ]);
        count++;
        if (count >= 10) {
          clearInterval(diceIntervalRef.current!);
          diceIntervalRef.current = null;
          setDisplayDice(frozen);
          setDiceAnimating(false);
        }
      }, 65);
    } else {
      setDisplayDice(null);
      setDiceAnimating(false);
    }
    return () => {
      if (diceIntervalRef.current) clearInterval(diceIntervalRef.current);
    };
  }, [gameState?.dice]); // eslint-disable-line react-hooks/exhaustive-deps

  const piecesMap = useMemo<Map<string, PieceCellEntry[]>>(() => {
    const map = new Map<string, PieceCellEntry[]>();
    if (!gameState) return map;
    for (const [uid, pieces] of Object.entries(gameState.pieces)) {
      const color = gameState.players[uid]?.color;
      if (!color) continue;
      for (const piece of pieces) {
        const key = getCellKeyForPiece(piece.pos, color, piece.id);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ uid, piece, color });
      }
    }
    return map;
  }, [gameState]);

  const validTargetKeys = useMemo<Set<string>>(() => {
    if (
      !gameState?.pendingMoves ||
      gameState.highlightPieceId === null ||
      gameState.highlightPieceId === undefined
    )
      return new Set();
    const set = new Set<string>();
    gameState.pendingMoves
      .filter(m => m.pieceId === gameState.highlightPieceId)
      .forEach(m => {
        const k = getCellKeyForTarget(m.targetPos, myColor);
        if (k) set.add(k);
      });
    return set;
  }, [gameState?.pendingMoves, gameState?.highlightPieceId, myColor]);

  const movablePieceIds = useMemo<Set<number>>(() => {
    if (!isMyTurn || gameState?.status !== 'choosing') return new Set();
    return new Set((gameState.pendingMoves ?? []).map(m => m.pieceId));
  }, [isMyTurn, gameState?.status, gameState?.pendingMoves]);

  const handleCellClick = useCallback(
    (cellKey: string) => {
      if (!gameState || !isMyTurn) return;
      if (gameState.status === 'choosing') {
        if (
          validTargetKeys.has(cellKey) &&
          gameState.highlightPieceId !== null &&
          gameState.highlightPieceId !== undefined
        ) {
          const option = (gameState.pendingMoves ?? []).find(m => {
            if (m.pieceId !== gameState.highlightPieceId) return false;
            return getCellKeyForTarget(m.targetPos, myColor) === cellKey;
          });
          if (option) {
            handleMove(option as CaNguMoveOption);
            return;
          }
        }
        const piecesHere = piecesMap.get(cellKey) ?? [];
        const mine = piecesHere.find(
          p => p.uid === user.uid && movablePieceIds.has(p.piece.id),
        );
        if (mine) handleSelectPiece(mine.piece.id);
      }
    },
    [
      gameState,
      isMyTurn,
      validTargetKeys,
      myColor,
      piecesMap,
      movablePieceIds,
      handleMove,
      handleSelectPiece,
      user.uid,
    ],
  );

  const [boardPx, setBoardPx] = useState(300);
  useEffect(() => {
    const update = () => {
      const h = window.innerHeight - 44;
      const w = window.innerWidth * 0.62;
      setBoardPx(Math.max(180, Math.floor(Math.min(h, w))));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    injectBoardAnims();
  }, []);

  const [showGameOver, setShowGameOver] = useState(false);
  useEffect(() => {
    if (gameState?.status === 'finished') {
      const t = setTimeout(() => setShowGameOver(true), 900);
      return () => clearTimeout(t);
    }
    setShowGameOver(false);
  }, [gameState?.status]);

  const cellPx = boardPx / 15;

  const getCellStyle = useCallback(
    (cellDef: CellDef, cellKey: string): React.CSSProperties => {
      const isValidTarget = validTargetKeys.has(cellKey);
      if (isValidTarget) {
        return {
          background: 'rgba(74,222,128,0.25)',
          animation: 'validPulse 1s ease-in-out infinite',
          cursor: 'pointer',
        };
      }
      switch (cellDef.type) {
        case 'homeYard':
          return { background: YARD_BG_CSS[cellDef.color!] };
        case 'path':
          return cellDef.isSafe
            ? { background: 'rgba(254,243,199,0.95)' }
            : { background: 'rgba(248,250,252,0.92)' };
        case 'homeCol':
          return {
            background: COL_BG_CSS[cellDef.color!],
            animation: 'homeColGlow 3s ease-in-out infinite',
          };
        case 'center':
          return {
            background:
              'conic-gradient(#ef4444 0deg 90deg,#3b82f6 90deg 180deg,#eab308 180deg 270deg,#22c55e 270deg 360deg)',
          };
        default:
          return { background: '#111827' };
      }
    },
    [validTargetKeys],
  );

  const renderCellContent = useCallback(
    (cellDef: CellDef, cellKey: string): React.ReactNode => {
      const pieces = piecesMap.get(cellKey) ?? [];
      const isYardSlot = YARD_SLOT_SET.has(cellKey);
      const isValidTarget = validTargetKeys.has(cellKey);

      let icon: React.ReactNode = null;
      if (cellDef.type === 'path' && cellDef.isSafe && pieces.length === 0) {
        icon = (
          <span
            style={{
              position: 'absolute',
              fontSize: cellPx * 0.4,
              opacity: 0.65,
              userSelect: 'none',
              lineHeight: 1,
              color: '#f59e0b',
            }}
          >
            ★
          </span>
        );
      }
      if (cellDef.type === 'center') {
        icon = (
          <span
            style={{
              position: 'absolute',
              fontSize: cellPx * 0.58,
              filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.7))',
              userSelect: 'none',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            🏠
          </span>
        );
      }
      if (cellDef.type === 'homeYard' && isYardSlot && pieces.length === 0) {
        icon = (
          <div
            style={{
              width: cellPx * 0.68,
              height: cellPx * 0.68,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.28)',
              background: 'rgba(0,0,0,0.22)',
            }}
          />
        );
      }
      if (isValidTarget && pieces.length === 0) {
        icon = (
          <div
            style={{
              width: cellPx * 0.52,
              height: cellPx * 0.52,
              borderRadius: '50%',
              background: 'rgba(74,222,128,0.45)',
              border: '2px solid #4ade80',
            }}
          />
        );
      }

      if (pieces.length === 0) return icon;

      const pieceNodes = pieces.slice(0, 4).map((entry, idx) => {
        const isHighlighted =
          entry.uid === user.uid &&
          gameState?.highlightPieceId === entry.piece.id;
        const isMovable =
          entry.uid === user.uid && movablePieceIds.has(entry.piece.id);

        const count = pieces.length;
        const sz =
          count === 1
            ? cellPx * 0.75
            : count === 2
            ? cellPx * 0.45
            : cellPx * 0.36;

        return (
          <div
            key={`${entry.uid}-${entry.piece.id}`}
            onClick={e => {
              e.stopPropagation();
              if (isMovable) handleSelectPiece(entry.piece.id);
            }}
            style={{
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${PIECE_COLOR[entry.color]}cc, ${PIECE_COLOR[entry.color]})`,
              border: isHighlighted
                ? `2px solid #fff`
                : `1.5px solid rgba(255,255,255,0.75)`,
              cursor: isMovable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: sz * 0.38,
              fontWeight: 'bold',
              color: 'white',
              flexShrink: 0,
              animation: isHighlighted
                ? 'pieceMove 0.35s ease, piecePulse 1s ease-in-out infinite 0.35s'
                : isMovable
                ? 'piecePulse 1.1s ease-in-out infinite'
                : undefined,
              boxShadow: isHighlighted
                ? `0 0 0 2px ${PIECE_COLOR[entry.color]}, 0 0 10px ${PIECE_COLOR[entry.color]}`
                : undefined,
              zIndex: isHighlighted ? 3 : 2,
            }}
          >
            {count > 2 && idx === 0 ? count : ''}
          </div>
        );
      });

      return (
        <>
          {icon}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: pieces.length > 1 ? '1px' : 0,
              padding: pieces.length > 1 ? '2px' : '1px',
              zIndex: 2,
            }}
          >
            {pieceNodes}
          </div>
        </>
      );
    },
    [
      piecesMap,
      validTargetKeys,
      cellPx,
      user.uid,
      gameState?.highlightPieceId,
      movablePieceIds,
      handleSelectPiece,
    ],
  );

  const isDoubles = displayDice && displayDice[0] === displayDice[1];
  const winnerPlayer = gameState?.winner ? gameState.players[gameState.winner] : null;

  if (loading) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center"
        style={{ background: '#1a0a00' }}
      >
        <div className="text-white text-base">Đang tải ván chơi…</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div
        className="w-screen h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#1a0a00' }}
      >
        <div className="text-white text-sm">Không tìm thấy ván chơi</div>
        <button
          onClick={onBackToLobby}
          className="px-5 py-2 rounded-lg font-bold text-white text-sm active:scale-95 transition-all"
          style={{ background: '#8B6914', border: '1px solid #fbbf24' }}
        >
          Về Sảnh
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden select-none"
      style={{ background: '#1a0a00' }}
    >
      <div
        className="h-11 shrink-0 flex items-center justify-between px-3 z-10"
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,215,0,0.14)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black text-sm">🐴</span>
          <span className="text-yellow-300 font-bold text-xs hidden sm:inline">Cờ Cá Ngựa</span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#6b7280' }}
          >
            {gameId.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {gameState.status === 'rolling' && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(250,204,21,0.13)',
                color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              {gameState.currentTurnUid === user.uid
                ? '🎲 Lượt bạn!'
                : `⏳ ${gameState.players[gameState.currentTurnUid]?.name ?? '…'}`}
            </span>
          )}
          {gameState.status === 'choosing' && isMyTurn && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(74,222,128,0.13)',
                color: '#4ade80',
                border: '1px solid rgba(74,222,128,0.35)',
              }}
            >
              🎯 Chọn quân!
            </span>
          )}
          {gameState.extraTurn && isMyTurn && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(168,85,247,0.18)',
                color: '#c084fc',
                border: '1px solid rgba(168,85,247,0.4)',
              }}
            >
              ✨ Thêm lượt
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-xs">
            💰 {formatMoney(gameState.betAmount)}
          </span>
          <button
            onClick={onBackToLobby}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-all active:scale-95"
            style={{
              background: 'rgba(239,68,68,0.65)',
              border: '1px solid rgba(239,68,68,0.5)',
            }}
          >
            Rời
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex items-center justify-center p-1 relative overflow-hidden">
          <div
            style={{
              width: boardPx,
              height: boardPx,
              display: 'grid',
              gridTemplateColumns: `repeat(15, ${cellPx}px)`,
              gridTemplateRows: `repeat(15, ${cellPx}px)`,
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px solid rgba(255,215,0,0.18)',
              boxShadow: '0 0 32px rgba(0,0,0,0.85)',
              position: 'relative',
            }}
          >
            {Array.from({ length: 15 }, (_, r) =>
              Array.from({ length: 15 }, (_, c) => {
                const key = `${r},${c}`;
                const cellDef = CELL_MAP.get(key) ?? { type: 'dead' as const, isSafe: false };
                const isStartCell =
                  cellDef.type === 'path' &&
                  COLORS.some(col => (cellDef.pathIndex ?? -1) === COLOR_START[col]);

                return (
                  <div
                    key={key}
                    onClick={() => handleCellClick(key)}
                    style={{
                      width: cellPx,
                      height: cellPx,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      border:
                        cellDef.type === 'dead'
                          ? '0.5px solid rgba(255,255,255,0.04)'
                          : cellDef.type === 'homeYard'
                          ? '0.5px solid rgba(0,0,0,0.28)'
                          : '0.5px solid rgba(0,0,0,0.14)',
                      animation: isStartCell ? 'boardRipple 2.8s ease-out infinite' : undefined,
                      ...getCellStyle(cellDef, key),
                    }}
                  >
                    {renderCellContent(cellDef, key)}
                  </div>
                );
              }),
            )}
          </div>

          <GameReactionsOverlay anims={reactionAnims} />
        </div>

        <div
          className="shrink-0 flex flex-col overflow-y-auto overflow-x-hidden"
          style={{
            width: 'clamp(155px, 21vw, 235px)',
            background: 'rgba(0,0,0,0.48)',
            borderLeft: '1px solid rgba(255,215,0,0.09)',
          }}
        >
          <div
            className="flex flex-col items-center py-3 px-2 gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="relative flex items-center gap-2 mt-0.5">
              {displayDice ? (
                <>
                  <span
                    style={{
                      fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)',
                      lineHeight: 1,
                      display: 'inline-block',
                      animation: diceAnimating ? 'diceRollAnim 0.65s ease-in-out' : undefined,
                      filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65))',
                    }}
                  >
                    {DICE_FACES[displayDice[0]] ?? '⚀'}
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)',
                      lineHeight: 1,
                      display: 'inline-block',
                      animation: diceAnimating
                        ? 'diceRollAnim 0.65s 0.06s ease-in-out'
                        : undefined,
                      filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65))',
                    }}
                  >
                    {DICE_FACES[displayDice[1]] ?? '⚀'}
                  </span>
                  {isDoubles && !diceAnimating && (
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                        animation: 'doiBadgePop 0.45s cubic-bezier(.2,.8,.4,1.2) both',
                      }}
                    >
                      ĐÔI!
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-1.5 opacity-25">
                  <span style={{ fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)', lineHeight: 1 }}>
                    ⚀
                  </span>
                  <span style={{ fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)', lineHeight: 1 }}>
                    ⚀
                  </span>
                </div>
              )}
            </div>

            {gameState.status === 'rolling' && (
              <button
                disabled={!canRoll}
                onClick={() => canRoll && handleRoll()}
                className="w-full py-2 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  canRoll
                    ? {
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: '#1a0a00',
                        border: '1px solid #fbbf24',
                        animation: 'rollBtnPulse 1.3s ease-in-out infinite',
                      }
                    : {
                        background: 'rgba(255,255,255,0.06)',
                        color: '#6b7280',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }
                }
              >
                🎲 Lắc Xúc Xắc
              </button>
            )}

            {gameState.status === 'choosing' && isMyTurn && (
              <div
                className="w-full py-1.5 rounded-xl text-center text-[11px] font-bold"
                style={{
                  background: 'rgba(74,222,128,0.1)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.28)',
                }}
              >
                Chọn quân để di chuyển
              </div>
            )}

            {gameState.status === 'moving' && (
              <div
                className="w-full py-1.5 rounded-xl text-center text-[11px] font-bold"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.28)',
                }}
              >
                Đang di chuyển…
              </div>
            )}

            {gameState.status === 'finished' && (
              <div
                className="w-full py-1.5 rounded-xl text-center text-[11px] font-bold"
                style={{
                  background: 'rgba(250,204,21,0.12)',
                  color: '#fbbf24',
                  border: '1px solid rgba(250,204,21,0.3)',
                }}
              >
                🏆 Ván kết thúc
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 px-2 pt-2 pb-1">
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Người Chơi
            </div>

            {(gameState.playerOrder ?? []).map(uid => {
              const player = gameState.players[uid];
              if (!player) return null;
              const isCurrentTurn = gameState.currentTurnUid === uid;
              const netBalance = gameState.balances[uid] ?? 0;
              const isMe = uid === user.uid;
              const finishedCount = (gameState.pieces[uid] ?? []).filter(
                p => p.pos.type === 'finished',
              ).length;

              return (
                <div
                  key={uid}
                  data-player-uid={uid}
                  onClick={
                    !isMe
                      ? e => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setThrowMenu({ uid, name: player.name, rect });
                        }
                      : undefined
                  }
                  style={{
                    cursor: !isMe ? 'pointer' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 5px',
                    borderRadius: 9,
                    background: isCurrentTurn
                      ? `${PIECE_COLOR[player.color]}1a`
                      : 'rgba(255,255,255,0.04)',
                    border: isCurrentTurn
                      ? `1px solid ${PIECE_COLOR[player.color]}44`
                      : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                    marginBottom: 2,
                  }}
                >
                  <div className="relative shrink-0">
                    <img
                      src={player.avatar || '/assets/image/icons/user.png'}
                      alt={player.name}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${PIECE_COLOR[player.color]}`,
                      }}
                    />
                    {isCurrentTurn && gameState.status !== 'finished' && (
                      <div
                        style={{
                          position: 'absolute',
                          right: -3,
                          bottom: -3,
                          fontSize: 8,
                          lineHeight: 1,
                          animation: 'turnArrow 0.7s ease-in-out infinite',
                          color: PIECE_COLOR[player.color],
                        }}
                      >
                        ▶
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-bold truncate leading-tight"
                      style={{
                        color: isCurrentTurn ? COLOR_TEXT_CSS[player.color] : '#e5e7eb',
                      }}
                    >
                      {player.name}
                      {isMe && (
                        <span className="ml-1 text-[8px] text-gray-500 font-normal">(bạn)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="text-[8px] font-bold px-1 rounded leading-none"
                        style={{
                          background: `${PIECE_COLOR[player.color]}28`,
                          color: COLOR_TEXT_CSS[player.color],
                          padding: '1px 4px',
                        }}
                      >
                        {COLOR_META[player.color].label}
                      </span>
                      {netBalance !== 0 && (
                        <span
                          className="text-[8px] font-bold leading-none"
                          style={{ color: netBalance > 0 ? '#4ade80' : '#f87171' }}
                        >
                          {netBalance > 0 ? '+' : ''}
                          {formatMoney(netBalance)}
                        </span>
                      )}
                    </div>
                  </div>

                  {finishedCount > 0 && (
                    <div
                      className="shrink-0 text-[10px] font-black tabular-nums"
                      style={{ color: '#fde047' }}
                    >
                      {finishedCount}/4
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {gameState.lastAction && (
            <div className="px-2 pb-1">
              <div
                className="text-[8px] px-2 py-1 rounded-lg text-center truncate"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#4b5563',
                  fontFamily: 'monospace',
                }}
              >
                {gameState.lastAction}
              </div>
            </div>
          )}

          <div
            className="mt-auto px-2 py-2 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <EmojiPickerButton onSend={e => sendReaction('emoji', e)} />
            <button
              onClick={toggleMic}
              title={isMicOn ? 'Tắt mic' : 'Bật mic'}
              className="rounded-full flex items-center justify-center transition-all active:scale-90 text-base"
              style={{
                width: 28,
                height: 28,
                background: isMicOn ? 'rgba(34,197,94,0.22)' : 'rgba(0,0,0,0.4)',
                border: isMicOn
                  ? '1px solid rgba(34,197,94,0.55)'
                  : '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {isMicOn ? '🎙️' : '🔇'}
            </button>
          </div>
        </div>
      </div>

      {showGameOver && winnerPlayer && gameState.winner && (
        <GameOverModal
          winner={gameState.winner}
          winnerName={winnerPlayer.name}
          winnerColor={winnerPlayer.color}
          balances={gameState.balances}
          players={gameState.players}
          transactions={gameState.transactions}
          betAmount={gameState.betAmount}
          onClose={() => setShowGameOver(false)}
          onLeave={onBackToLobby}
        />
      )}

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
