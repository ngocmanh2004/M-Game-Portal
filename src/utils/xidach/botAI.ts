import { calculateScore, canHit, getHandStatus } from './gameLogic';

// Bot quyết định Hit hay Stand
export function getBotAction(cards: string[]): 'hit' | 'stand' {
  const score = calculateScore(cards);
  const status = getHandStatus(cards);

  // Đã có kết quả đặc biệt hoặc không thể rút thêm
  if (status !== 'playing') return 'stand';
  if (!canHit(cards)) return 'stand';

  // Theo luật: Non (< 16) → bắt buộc rút. Đủ (16-21) → có thể dừng.
  // Bot dùng ngưỡng 17: rút nếu < 17, dừng nếu >= 17.
  if (score < 17) return 'hit';

  return 'stand';
}

// Bot quyết định đặt cược
export function getBotBet(difficulty: 'easy' | 'medium' | 'hard', minBet: number, balance: number): number {
  const maxBetRatio: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 5,
  };
  const ratio = maxBetRatio[difficulty] || 1;
  const maxBet = Math.min(minBet * ratio, balance);
  // Random trong khoảng [minBet, maxBet]
  const range = maxBet - minBet;
  return minBet + Math.floor(Math.random() * (range + 1));
}
