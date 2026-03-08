import type { CaNguPiecePos, CaNguColor, CaNguPiece, CaNguPlayer, CaNguMoveOption, CaNguTransaction } from '../../types';
import {
  COLOR_START,
  COLOR_GATE,
  SAFE_PATH_INDICES,
  KICK_REWARD_MULTIPLIER,
  KICK_DOUBLE_MULTIPLIER,
  HOME_COL6_REWARD_MULTIPLIER,
  PENALTY_IN_YARD_MULTIPLIER,
  PENALTY_ON_PATH_MULTIPLIER,
} from './boardConfig';

const PATH_LENGTH = 52;

export function rollDice(): [number, number] {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return [d1, d2];
}

export function canExitByDice(d1: number, d2: number): boolean {
  if (d1 === d2) return true;
  const sorted = [d1, d2].sort((a, b) => a - b);
  return sorted[0] === 1 && sorted[1] === 6;
}

export function stepsFromStart(pos: CaNguPiecePos, color: CaNguColor): number {
  if (pos.type === 'home') return -1;
  if (pos.type === 'finished') return PATH_LENGTH + 6;
  if (pos.type === 'homeCol') return PATH_LENGTH + pos.step;
  const start = COLOR_START[color];
  const relative = (pos.index - start + PATH_LENGTH) % PATH_LENGTH;
  return relative;
}

export function computeNewPos(pos: CaNguPiecePos, steps: number, color: CaNguColor): CaNguPiecePos | null {
  if (steps <= 0) return pos;

  if (pos.type === 'home') return null;
  if (pos.type === 'finished') return null;

  if (pos.type === 'homeCol') {
    const newStep = pos.step + steps;
    if (newStep > 6) return null;
    if (newStep === 6) return { type: 'homeCol', step: 6 };
    return { type: 'homeCol', step: newStep };
  }

  const gate = COLOR_GATE[color];
  const start = COLOR_START[color];

  let remaining = steps;
  let currentIndex = pos.index;

  while (remaining > 0) {
    const distToGate = (gate - currentIndex + PATH_LENGTH) % PATH_LENGTH;

    if (distToGate === 0) {
      const newStep = remaining;
      if (newStep > 6) return null;
      if (newStep === 6) return { type: 'homeCol', step: 6 };
      return { type: 'homeCol', step: newStep };
    }

    if (remaining <= distToGate) {
      const newIndex = (currentIndex + remaining) % PATH_LENGTH;
      return { type: 'path', index: newIndex };
    }

    remaining -= distToGate;
    currentIndex = gate;

    if (remaining > 0) {
      const newStep = remaining;
      if (newStep > 6) return null;
      if (newStep === 6) return { type: 'homeCol', step: 6 };
      return { type: 'homeCol', step: newStep };
    }

    return { type: 'path', index: gate };
  }

  return { type: 'path', index: (pos.index + steps) % PATH_LENGTH };
}

export function buildOwnerMap(pieces: Record<string, CaNguPiece[]>): Map<number, string> {
  const map = new Map<number, string>();
  for (const [uid, pList] of Object.entries(pieces)) {
    for (const piece of pList) {
      if (piece.pos.type === 'path') {
        map.set(piece.pos.index, uid);
      }
    }
  }
  return map;
}

export function isCellBlocked(pathIndex: number, allPieces: Record<string, CaNguPiece[]>, ownersByPathIndex: Map<number, string>): boolean {
  const piecesAtCell: { uid: string; piece: CaNguPiece }[] = [];
  for (const [uid, pList] of Object.entries(allPieces)) {
    for (const piece of pList) {
      if (piece.pos.type === 'path' && piece.pos.index === pathIndex) {
        piecesAtCell.push({ uid, piece });
      }
    }
  }
  if (piecesAtCell.length < 2) return false;
  const firstUid = piecesAtCell[0].uid;
  const allSameOwner = piecesAtCell.every(p => p.uid === firstUid);
  return allSameOwner;
}

function posEqual(a: CaNguPiecePos, b: CaNguPiecePos): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'path' && b.type === 'path') return a.index === b.index;
  if (a.type === 'homeCol' && b.type === 'homeCol') return a.step === b.step;
  return true;
}

function isPathBlocked(
  startPos: CaNguPiecePos,
  targetPos: CaNguPiecePos,
  steps: number,
  color: CaNguColor,
  allPieces: Record<string, CaNguPiece[]>,
  myUid: string,
): boolean {
  if (startPos.type !== 'path') return false;

  const gate = COLOR_GATE[color];

  for (let s = 1; s < steps; s++) {
    const intermediate = computeNewPos(startPos, s, color);
    if (!intermediate) continue;
    if (intermediate.type !== 'path') continue;

    const idx = intermediate.index;
    const piecesHere: { uid: string }[] = [];
    for (const [uid, pList] of Object.entries(allPieces)) {
      for (const piece of pList) {
        if (piece.pos.type === 'path' && piece.pos.index === idx) {
          piecesHere.push({ uid });
        }
      }
    }
    if (piecesHere.length >= 2) {
      const firstUid = piecesHere[0].uid;
      const allSame = piecesHere.every(p => p.uid === firstUid);
      if (allSame && firstUid !== myUid) return true;
    }
  }
  return false;
}

export function getValidMoves(
  myUid: string,
  myColor: CaNguColor,
  pieces: Record<string, CaNguPiece[]>,
  dice: [number, number],
): CaNguMoveOption[] {
  const [d1, d2] = dice;
  const myPieces = pieces[myUid] ?? [];
  const isDouble = d1 === d2;
  const options: CaNguMoveOption[] = [];
  const seen = new Set<string>();

  function addOption(opt: CaNguMoveOption) {
    const key = `${opt.pieceId}:${JSON.stringify(opt.targetPos)}:${opt.diceValues.slice().sort().join(',')}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push(opt);
    }
  }

  function tryMove(piece: CaNguPiece, steps: number, diceValues: number[]) {
    if (piece.pos.type === 'finished') return;

    if (piece.pos.type === 'home') {
      if (!canExitByDice(diceValues[0], diceValues[1] ?? diceValues[0])) return;
      if (diceValues.length < 2) return;
      const targetPos: CaNguPiecePos = { type: 'path', index: COLOR_START[myColor] };
      const piecesAtStart = (pieces[myUid] ?? []).filter(
        p => p.pos.type === 'path' && p.pos.index === COLOR_START[myColor]
      );
      if (piecesAtStart.length >= 2) return;

      let kicksUid: string | undefined;
      for (const [uid, pList] of Object.entries(pieces)) {
        if (uid === myUid) continue;
        for (const p of pList) {
          if (p.pos.type === 'path' && p.pos.index === COLOR_START[myColor]) {
            if (!SAFE_PATH_INDICES.has(COLOR_START[myColor])) {
              kicksUid = uid;
            }
          }
        }
      }
      addOption({ pieceId: piece.id, diceValues, targetPos, kicksUid, isDouble });
      return;
    }

    const targetPos = computeNewPos(piece.pos, steps, myColor);
    if (!targetPos) return;

    if (isPathBlocked(piece.pos, targetPos, steps, myColor, pieces, myUid)) return;

    if (targetPos.type === 'path') {
      const idx = targetPos.index;
      const ownPiecesAtTarget = (pieces[myUid] ?? []).filter(
        p => p.id !== piece.id && p.pos.type === 'path' && p.pos.index === idx
      );
      if (ownPiecesAtTarget.length >= 2) return;

      let kicksUid: string | undefined;
      for (const [uid, pList] of Object.entries(pieces)) {
        if (uid === myUid) continue;
        for (const p of pList) {
          if (p.pos.type === 'path' && p.pos.index === idx) {
            if (!SAFE_PATH_INDICES.has(idx)) {
              kicksUid = uid;
            }
          }
        }
      }
      addOption({ pieceId: piece.id, diceValues, targetPos, kicksUid, isDouble });
    } else if (targetPos.type === 'homeCol' || targetPos.type === 'finished') {
      addOption({ pieceId: piece.id, diceValues, targetPos, isDouble });
    }
  }

  const sum = d1 + d2;
  for (const piece of myPieces) {
    if (piece.pos.type === 'home') {
      tryMove(piece, 0, [d1, d2]);
    } else {
      tryMove(piece, sum, [d1, d2]);
    }
  }

  if (d1 !== d2) {
    for (const piece of myPieces) {
      if (piece.pos.type === 'home') continue;
      tryMove(piece, d1, [d1]);
    }
    for (const piece of myPieces) {
      if (piece.pos.type === 'home') continue;
      tryMove(piece, d2, [d2]);
    }
  }

  return options;
}

export function applyMove(
  option: CaNguMoveOption,
  myUid: string,
  myColor: CaNguColor,
  pieces: Record<string, CaNguPiece[]>,
  players: Record<string, CaNguPlayer>,
): { pieces: Record<string, CaNguPiece[]>; kickedUid: string | null } {
  const newPieces: Record<string, CaNguPiece[]> = {};
  for (const [uid, pList] of Object.entries(pieces)) {
    newPieces[uid] = pList.map(p => ({ ...p, pos: { ...p.pos } as CaNguPiecePos }));
  }

  const myList = newPieces[myUid] ?? [];
  const pieceIndex = myList.findIndex(p => p.id === option.pieceId);
  if (pieceIndex === -1) return { pieces: newPieces, kickedUid: null };

  const targetPos = option.targetPos;
  let finalTarget = targetPos;

  if (targetPos.type === 'homeCol' && targetPos.step === 6) {
    finalTarget = { type: 'finished' };
  }

  myList[pieceIndex] = { ...myList[pieceIndex], pos: finalTarget };
  newPieces[myUid] = myList;

  let kickedUid: string | null = null;

  if (targetPos.type === 'path' && option.kicksUid) {
    const victimUid = option.kicksUid;
    const victimList = newPieces[victimUid] ?? [];
    const idx = targetPos.index;
    const kickedList = victimList.map(p => {
      if (p.pos.type === 'path' && p.pos.index === idx) {
        return { ...p, pos: { type: 'home' } as CaNguPiecePos };
      }
      return p;
    });
    newPieces[victimUid] = kickedList;
    kickedUid = victimUid;
  }

  return { pieces: newPieces, kickedUid };
}

export function computeEndGamePenalties(
  winnerUid: string,
  pieces: Record<string, CaNguPiece[]>,
  players: Record<string, CaNguPlayer>,
  betAmount: number,
): CaNguTransaction[] {
  const transactions: CaNguTransaction[] = [];
  const now = Date.now();

  for (const [uid, pList] of Object.entries(pieces)) {
    if (uid === winnerUid) continue;
    for (const piece of pList) {
      const pos = piece.pos;
      let penalty = 0;
      if (pos.type === 'home') {
        penalty = betAmount * PENALTY_IN_YARD_MULTIPLIER;
      } else if (pos.type === 'path') {
        penalty = betAmount * PENALTY_ON_PATH_MULTIPLIER;
      } else if (pos.type === 'homeCol') {
        if (pos.step >= 1 && pos.step <= 3) {
          penalty = betAmount * PENALTY_ON_PATH_MULTIPLIER;
        } else {
          penalty = 0;
        }
      } else if (pos.type === 'finished') {
        penalty = 0;
      }
      if (penalty > 0) {
        transactions.push({
          ts: now,
          fromUid: uid,
          toUid: winnerUid,
          amount: penalty,
          reason: 'endPenalty',
        });
      }
    }
  }

  return transactions;
}

export function checkWinner(uid: string, pieces: Record<string, CaNguPiece[]>): boolean {
  const pList = pieces[uid] ?? [];
  return pList.length === 4 && pList.every(p => p.pos.type === 'finished');
}

export function applyTransactions(
  balances: Record<string, number>,
  transactions: CaNguTransaction[],
): Record<string, number> {
  const result: Record<string, number> = { ...balances };
  for (const tx of transactions) {
    result[tx.fromUid] = (result[tx.fromUid] ?? 0) - tx.amount;
    result[tx.toUid] = (result[tx.toUid] ?? 0) + tx.amount;
  }
  return result;
}
