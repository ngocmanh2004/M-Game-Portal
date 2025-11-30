export interface PlayerResult {
  uid: string;
  displayName: string;
  finishPosition: number;
  money: number;
  isWinner: boolean;
  hand: string[];
  penalties?: number;
  payout?: number;
}

export function getFinishOrder(players: any): PlayerResult[] {
  const arr = Object.values(players) as any[];
  return arr
    .map(p => ({
      uid: p.uid,
      displayName: p.displayName,
      finishPosition: p.finishPosition ?? 99,
      money: p.money ?? 0,
      isWinner: p.finishPosition === 1,
      hand: p.hand || [],
    }))
    .sort((a, b) => a.finishPosition - b.finishPosition);
}

// Tính penalty thối (heo, 3 bích cuối, tứ quý, đôi thông)
export function calcThoiPenalty(hand: string[], bet: number) {
  let penalty = 0;
  // Heo đen (2♠, 2♣): +1x bet, Heo đỏ (2♦, 2♥): +2x bet
  hand.forEach(card => {
    if (card[0] === '2') {
      if (card[1] === 'S' || card[1] === 'C') penalty += bet * 1;
      if (card[1] === 'D' || card[1] === 'H') penalty += bet * 2;
    }
  });
  // 3 bích cuối: +2x bet
  if (hand.includes('3S')) penalty += bet * 2;
  // Tứ quý: +2x bet mỗi bộ
  const valueCount: Record<string, number> = {};
  hand.forEach(card => {
    valueCount[card[0]] = (valueCount[card[0]] || 0) + 1;
  });
  Object.values(valueCount).forEach(cnt => {
    if (cnt === 4) penalty += bet * 2;
  });
  // Đôi thông: +2x bet mỗi bộ 3 đôi thông trở lên (không tính 2)
  const pairs = hand.filter((c, i, arr) =>
    arr.filter(x => x[0] === c[0]).length === 2 && c[0] !== '2'
  );
  // Đếm số bộ đôi thông liên tiếp
  let doubleSeq = 0;
  let seq = 0;
  const order = '3456789TJQKA';
  for (let i = 0; i < order.length - 2; i++) {
    const v1 = order[i], v2 = order[i + 1], v3 = order[i + 2];
    if (
      pairs.some(c => c[0] === v1) &&
      pairs.some(c => c[0] === v2) &&
      pairs.some(c => c[0] === v3)
    ) {
      doubleSeq++;
    }
  }
  penalty += doubleSeq * bet * 2;
  return penalty;
}

// Tính payout Nhất/Nhì/Ba/Bét + thối
export function calculatePayouts(players: any, betAmount: number) {
  const order = getFinishOrder(players);
  const n = order.length;
  const payouts: Record<string, number> = {};
  // Thối penalties
  order.forEach(p => {
    p.penalties = calcThoiPenalty(p.hand, betAmount);
  });

  if (n === 2) {
    payouts[order[0].uid] = betAmount * 2 + (order[1].penalties || 0);
    payouts[order[1].uid] = -betAmount * 2 - (order[1].penalties || 0);
  } else if (n === 3) {
    payouts[order[0].uid] = betAmount * 2 + (order[2].penalties || 0);
    payouts[order[1].uid] = 0;
    payouts[order[2].uid] = -betAmount * 2 - (order[2].penalties || 0);
  } else if (n === 4) {
    payouts[order[0].uid] = betAmount * 12 + (order[3].penalties || 0);
    payouts[order[1].uid] = betAmount * 6 + (order[2].penalties || 0);
    payouts[order[2].uid] = -betAmount * 6 - (order[2].penalties || 0);
    payouts[order[3].uid] = -betAmount * 12 - (order[3].penalties || 0);
  }
  return payouts;
}

// Format tiền
export function formatMoney(money: number) {
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M${Math.floor((money % 1_000_000) / 100_000) || ''}`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K${Math.floor((money % 1_000) / 100) || ''}`;
  return money.toString();
}