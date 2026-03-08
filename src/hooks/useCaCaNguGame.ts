import { useEffect, useState, useCallback } from 'react';
import { getDatabase, ref, update, onValue, off } from 'firebase/database';
import {
  CaNguGameState,
  CaNguMoveOption,
  CaNguColor,
  CaNguPiecePos,
  CaNguPiece,
  CaNguTransaction,
} from '../types';
import {
  rollDice,
  getValidMoves,
  applyMove,
  checkWinner,
  computeEndGamePenalties,
  applyTransactions,
  canExitByDice,
} from '../utils/cacangu/gameLogic';
import {
  COLOR_START,
  COLORS,
  KICK_REWARD_MULTIPLIER,
  KICK_DOUBLE_MULTIPLIER,
  HOME_COL6_REWARD_MULTIPLIER,
} from '../utils/cacangu/boardConfig';

const db = getDatabase();

void COLOR_START;
void COLORS;

interface UseCaNguGameResult {
  gameState: CaNguGameState | null;
  loading: boolean;
  isMyTurn: boolean;
  canRoll: boolean;
  handleRoll: () => Promise<void>;
  handleSelectPiece: (pieceId: number) => void;
  handleMove: (option: CaNguMoveOption) => Promise<void>;
}

function serializePieces(
  pieces: Record<string, CaNguPiece[]>
): Record<string, { id: number; posJson: string }[]> {
  const out: Record<string, { id: number; posJson: string }[]> = {};
  for (const [uid, list] of Object.entries(pieces)) {
    out[uid] = list.map(p => ({ id: p.id, posJson: JSON.stringify(p.pos) }));
  }
  return out;
}

function deserializePieces(raw: any): Record<string, CaNguPiece[]> {
  const out: Record<string, CaNguPiece[]> = {};
  if (!raw) return out;
  for (const [uid, pList] of Object.entries(raw)) {
    const list: any[] = Array.isArray(pList)
      ? (pList as any[])
      : Object.values(pList as any);
    out[uid] = list.map((p: any) => ({
      id: Number(p.id),
      pos: p.posJson
        ? (JSON.parse(p.posJson) as CaNguPiecePos)
        : (p.pos as CaNguPiecePos),
    }));
  }
  return out;
}

function parseGameState(raw: any): CaNguGameState {
  const pieces = deserializePieces(raw.pieces ?? {});

  const dice: [number, number] | null = raw.dice
    ? [
        Number(Array.isArray(raw.dice) ? raw.dice[0] : raw.dice['0']),
        Number(Array.isArray(raw.dice) ? raw.dice[1] : raw.dice['1']),
      ]
    : null;

  const rawMoves = raw.pendingMoves;
  const pendingMoves: CaNguMoveOption[] | null = rawMoves
    ? (Array.isArray(rawMoves)
        ? (rawMoves as any[])
        : Object.values(rawMoves)
      ).map(
        (m: any) =>
          ({
            pieceId: Number(m.pieceId),
            diceValues: Array.isArray(m.diceValues)
              ? (m.diceValues as any[]).map(Number)
              : Object.values(m.diceValues ?? {}).map(Number),
            targetPos: m.targetPos as CaNguPiecePos,
            kicksUid: m.kicksUid ?? undefined,
            isDouble: Boolean(m.isDouble),
          } as CaNguMoveOption)
      )
    : null;

  const rawTxs = raw.transactions;
  const transactions: CaNguTransaction[] = rawTxs
    ? Array.isArray(rawTxs)
      ? (rawTxs as CaNguTransaction[])
      : (Object.values(rawTxs) as CaNguTransaction[])
    : [];

  return {
    ...raw,
    pieces,
    dice,
    pendingMoves,
    transactions,
    winner: raw.winner ?? null,
    highlightPieceId: raw.highlightPieceId ?? null,
    lastAction: raw.lastAction ?? null,
    extraTurn: raw.extraTurn ?? false,
  } as CaNguGameState;
}

function getNextTurnUid(
  currentUid: string,
  playerOrder: string[],
  pieces: Record<string, CaNguPiece[]>
): string {
  const n = playerOrder.length;
  const idx = playerOrder.indexOf(currentUid);
  for (let i = 1; i < n; i++) {
    const nextUid = playerOrder[(idx + i) % n];
    const pList = pieces[nextUid] ?? [];
    if (!pList.every(p => p.pos.type === 'finished')) {
      return nextUid;
    }
  }
  return currentUid;
}

export function useCaCaNguGame(
  gameId: string,
  myUid: string,
  myColor: CaNguColor
): UseCaNguGameResult {
  const [gameState, setGameState] = useState<CaNguGameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    const gameRef = ref(db, `cacangu/games/${gameId}`);
    onValue(gameRef, snap => {
      const raw = snap.val();
      if (!raw) {
        setGameState(null);
        setLoading(false);
        return;
      }
      setGameState(parseGameState(raw));
      setLoading(false);
    });
    return () => off(gameRef);
  }, [gameId]);

  const isMyTurn = gameState?.currentTurnUid === myUid;
  const canRoll = !!(
    isMyTurn &&
    gameState?.status === 'rolling' &&
    !gameState?.dice
  );

  const applyMoveAndWrite = useCallback(
    async (
      option: CaNguMoveOption,
      state: CaNguGameState,
      extraTurn: boolean
    ) => {
      const gameRef = ref(db, `cacangu/games/${gameId}`);
      const { pieces: newPieces } = applyMove(
        option,
        myUid,
        myColor,
        state.pieces,
        state.players
      );

      const ts = Date.now();
      const otherUids = state.playerOrder.filter(u => u !== myUid);
      const newTransactions: CaNguTransaction[] = [];

      if (option.kicksUid) {
        newTransactions.push({
          ts,
          fromUid: option.kicksUid,
          toUid: myUid,
          amount:
            state.betAmount *
            (option.isDouble ? KICK_DOUBLE_MULTIPLIER : KICK_REWARD_MULTIPLIER),
          reason: option.isDouble ? 'kickDouble' : 'kick',
        });
      }

      const tp = option.targetPos;
      let isHomeCol6 = false;
      if (tp.type === 'homeCol') {
        isHomeCol6 = tp.step === 6;
      } else if (tp.type === 'finished') {
        isHomeCol6 = true;
      }

      if (isHomeCol6) {
        otherUids.forEach(uid => {
          newTransactions.push({
            ts,
            fromUid: uid,
            toUid: myUid,
            amount: state.betAmount * HOME_COL6_REWARD_MULTIPLIER,
            reason: 'homeCol6',
          });
        });
      }

      const allTransactions = [
        ...(state.transactions ?? []),
        ...newTransactions,
      ];
      let newBalances = applyTransactions(state.balances, newTransactions);

      const isWinner = checkWinner(myUid, newPieces);
      let updates: Record<string, any>;

      if (isWinner) {
        const endPenalties = computeEndGamePenalties(
          myUid,
          newPieces,
          state.players,
          state.betAmount
        );
        newBalances = applyTransactions(newBalances, endPenalties);
        updates = {
          pieces: serializePieces(newPieces),
          transactions: [...allTransactions, ...endPenalties],
          balances: newBalances,
          status: 'finished',
          winner: myUid,
          dice: null,
          extraTurn: false,
          pendingMoves: null,
          highlightPieceId: null,
          currentTurnUid: myUid,
          lastAction: `${myUid}:won`,
        };
      } else if (extraTurn) {
        updates = {
          pieces: serializePieces(newPieces),
          transactions: allTransactions,
          balances: newBalances,
          dice: null,
          status: 'rolling',
          extraTurn: true,
          pendingMoves: null,
          highlightPieceId: null,
          currentTurnUid: myUid,
          lastAction: `${myUid}:move:${option.pieceId}:extra`,
        };
      } else {
        const nextTurnUid = getNextTurnUid(
          myUid,
          state.playerOrder,
          newPieces
        );
        updates = {
          pieces: serializePieces(newPieces),
          transactions: allTransactions,
          balances: newBalances,
          dice: null,
          status: 'rolling',
          extraTurn: false,
          pendingMoves: null,
          highlightPieceId: null,
          currentTurnUid: nextTurnUid,
          lastAction: `${myUid}:move:${option.pieceId}`,
        };
      }

      await update(gameRef, updates);
    },
    [gameId, myUid, myColor]
  );

  const handleRoll = useCallback(async () => {
    if (!canRoll || !gameState) return;

    const [d1, d2] = rollDice();
    const extraTurn = d1 === d2;
    const exitAllowed = canExitByDice(d1, d2);
    const validMoves = getValidMoves(myUid, myColor, gameState.pieces, [
      d1,
      d2,
    ]);
    const gameRef = ref(db, `cacangu/games/${gameId}`);

    if (validMoves.length === 0) {
      const nextTurnUid = getNextTurnUid(
        myUid,
        gameState.playerOrder,
        gameState.pieces
      );
      await update(gameRef, {
        dice: null,
        status: 'rolling',
        pendingMoves: null,
        extraTurn: false,
        currentTurnUid: nextTurnUid,
        highlightPieceId: null,
        lastAction: `${myUid}:roll:${d1}+${d2}:nomoves:exit=${exitAllowed}`,
      });
    } else if (validMoves.length === 1) {
      await applyMoveAndWrite(validMoves[0], gameState, extraTurn);
    } else {
      await update(gameRef, {
        dice: [d1, d2],
        status: 'choosing',
        pendingMoves: validMoves,
        extraTurn,
        highlightPieceId: null,
        lastAction: `${myUid}:roll:${d1}+${d2}`,
      });
    }
  }, [canRoll, gameState, myUid, myColor, gameId, applyMoveAndWrite]);

  const handleSelectPiece = useCallback(
    (pieceId: number) => {
      if (!gameState || gameState.status !== 'choosing' || !isMyTurn) return;
      const gameRef = ref(db, `cacangu/games/${gameId}`);
      update(gameRef, { highlightPieceId: pieceId });
    },
    [gameId, gameState, isMyTurn]
  );

  const handleMove = useCallback(
    async (option: CaNguMoveOption) => {
      if (!gameState || gameState.status !== 'choosing' || !isMyTurn) return;
      await applyMoveAndWrite(option, gameState, gameState.extraTurn);
    },
    [gameState, isMyTurn, applyMoveAndWrite]
  );

  return {
    gameState,
    loading,
    isMyTurn: !!isMyTurn,
    canRoll,
    handleRoll,
    handleSelectPiece,
    handleMove,
  };
}
