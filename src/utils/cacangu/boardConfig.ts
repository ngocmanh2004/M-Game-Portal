import type { CaNguPiecePos, CaNguColor } from '../../types';

export type { CaNguColor };

export const COLORS: CaNguColor[] = ['red', 'blue', 'yellow', 'green'];

export const PATH_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
  [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

export const COLOR_START: Record<CaNguColor, number> = { red: 0, blue: 13, yellow: 26, green: 39 };

export const COLOR_GATE: Record<CaNguColor, number> = { red: 50, blue: 11, yellow: 24, green: 37 };

export const HOME_COL_COORDS: Record<CaNguColor, [number, number][]> = {
  red:    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  blue:   [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  green:  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

export const CENTER_COORD: [number, number] = [7, 7];

export const HOME_YARD_COORDS: Record<CaNguColor, [number, number][]> = {
  red:    [[1, 1], [1, 4], [4, 1], [4, 4]],
  blue:   [[1, 10], [1, 13], [4, 10], [4, 13]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  green:  [[10, 1], [10, 4], [13, 1], [13, 4]],
};

export const SAFE_PATH_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const COLOR_META: Record<CaNguColor, { label: string; bg: string; border: string; text: string; homeBg: string; colBg: string }> = {
  red:    { label: 'Đỏ',      bg: 'bg-red-600',    border: 'border-red-500',    text: 'text-red-400',    homeBg: 'bg-red-900/60',    colBg: 'bg-red-400/70' },
  blue:   { label: 'Xanh',    bg: 'bg-blue-600',   border: 'border-blue-500',   text: 'text-blue-400',   homeBg: 'bg-blue-900/60',   colBg: 'bg-blue-400/70' },
  yellow: { label: 'Vàng',    bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-400', homeBg: 'bg-yellow-900/60', colBg: 'bg-yellow-400/70' },
  green:  { label: 'Xanh Lá', bg: 'bg-green-600',  border: 'border-green-500',  text: 'text-green-400',  homeBg: 'bg-green-900/60',  colBg: 'bg-green-400/70' },
};

export const BET_LEVELS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

export const KICK_REWARD_MULTIPLIER = 1;
export const KICK_DOUBLE_MULTIPLIER = 2;
export const HOME_COL6_REWARD_MULTIPLIER = 5;
export const PENALTY_IN_YARD_MULTIPLIER = 2;
export const PENALTY_ON_PATH_MULTIPLIER = 1;

export function getCoordsForPos(pos: CaNguPiecePos, color: CaNguColor): [number, number] | null {
  if (pos.type === 'finished') return null;
  if (pos.type === 'home') return null;
  if (pos.type === 'path') return PATH_COORDS[pos.index] ?? null;
  if (pos.type === 'homeCol') {
    const cols = HOME_COL_COORDS[color];
    const idx = pos.step - 1;
    return cols[idx] ?? null;
  }
  return null;
}
