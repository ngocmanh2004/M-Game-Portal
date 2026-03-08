// ========================
// XÌ DÁCH - GAME LOGIC
// ========================

// Tính điểm bài
// Theo luật Xì Dách Việt Nam: A có thể tính là 1, 10, hoặc 11
// Thuật toán: ưu tiên A=11 → giảm dần sang A=10 → A=1 để không bị quắc
export function calculateScore(cards: string[]): number {
  let sum = 0;
  let aces11 = 0; // số A đang tính là 11

  for (const card of cards) {
    const rank = card.slice(0, -1); // bỏ suit (S/C/D/H)
    if (rank === 'A') {
      sum += 11;
      aces11++;
    } else if (['J', 'Q', 'K'].includes(rank)) {
      sum += 10;
    } else {
      sum += parseInt(rank, 10);
    }
  }

  // Giảm A: trước tiên 11→10 (giảm 1), nếu vẫn > 21 thì tiếp tục 10→1 (giảm 9 nữa)
  let aces10 = 0; // số A đang tính là 10
  while (sum > 21) {
    if (aces11 > 0) {
      sum -= 1; // 11 → 10
      aces11--;
      aces10++;
    } else if (aces10 > 0) {
      sum -= 9; // 10 → 1
      aces10--;
    } else {
      break; // không còn A nào để giảm
    }
  }

  return sum;
}

// Kiểm tra Xì Dách: 2 lá đầu, A + 10/J/Q/K (điểm = 21 từ 2 lá)
export function isXiDach(cards: string[]): boolean {
  if (cards.length !== 2) return false;
  const ranks = cards.map(c => c.slice(0, -1));
  const hasAce = ranks.includes('A');
  const hasTen = ranks.some(r => ['10', 'J', 'Q', 'K'].includes(r));
  return hasAce && hasTen;
}

// Kiểm tra Xì Bàng: 2 lá đầu, A + A
export function isXiBang(cards: string[]): boolean {
  if (cards.length !== 2) return false;
  return cards[0].slice(0, -1) === 'A' && cards[1].slice(0, -1) === 'A';
}

// Quắc (Bust): tổng điểm > 21 (theo luật Xì Dách Việt Nam)
export function isQuac(cards: string[]): boolean {
  return calculateScore(cards) > 21;
}

// Bust: alias cho isQuac (> 21)
export function isBust(cards: string[]): boolean {
  return calculateScore(cards) > 21;
}

// Ngũ Linh: 5 lá bài, điểm ≤ 21
export function isFiveCards(cards: string[]): boolean {
  if (cards.length !== 5) return false;
  return calculateScore(cards) <= 21;
}

// Lấy trạng thái của tay bài
export type HandStatus = 'playing' | 'stand' | 'busted' | 'xidach' | 'xibang' | 'fiveCards';

export function getHandStatus(cards: string[], finalAction?: 'stand'): HandStatus {
  if (isXiBang(cards)) return 'xibang';
  if (isXiDach(cards)) return 'xidach';
  if (isBust(cards)) return 'busted';   // quắc = bust = > 21
  if (isFiveCards(cards)) return 'fiveCards';
  if (finalAction === 'stand') return 'stand';
  return 'playing';
}

// Kiểm tra player có thể tiếp tục rút không
export function canHit(cards: string[]): boolean {
  if (cards.length >= 5) return false;
  if (isBust(cards) || isXiDach(cards) || isXiBang(cards)) return false;
  if (calculateScore(cards) === 21) return false; // đã đủ 21, không cần rút thêm
  return true;
}

// So sánh kết quả player vs dealer
export type PlayerResult = 'win' | 'lose' | 'draw' | 'xidach' | 'xibang' | 'fiveCards';

export function compareWithDealer(playerCards: string[], dealerCards: string[]): PlayerResult {
  const playerStatus = getHandStatus(playerCards, 'stand');
  const dealerStatus = getHandStatus(dealerCards, 'stand');

  // Cả hai đều quắc → hòa (theo luật: coi như hòa)
  if (playerStatus === 'busted' && dealerStatus === 'busted') return 'draw';

  // Player quắc → thua
  if (playerStatus === 'busted') return 'lose';

  // Dealer quắc → player không quắc thì thắng
  if (dealerStatus === 'busted') {
    if (playerStatus === 'xidach') return 'xidach';
    if (playerStatus === 'xibang') return 'xibang';
    if (playerStatus === 'fiveCards') return 'fiveCards';
    return 'win';
  }

  // ========== So sánh theo thứ tự ưu tiên ==========
  // Xì Bàng > Xì Dách > Ngũ Linh > Điểm thường

  // Cả hai đều Xì Bàng → hòa
  if (playerStatus === 'xibang' && dealerStatus === 'xibang') return 'draw';
  // Player Xì Bàng → thắng
  if (playerStatus === 'xibang') return 'xibang';
  // Dealer Xì Bàng, player không → thua
  if (dealerStatus === 'xibang') return 'lose';

  // Cả hai đều Xì Dách → hòa
  if (playerStatus === 'xidach' && dealerStatus === 'xidach') return 'draw';
  // Player Xì Dách → thắng đặc biệt 1.5x
  if (playerStatus === 'xidach') return 'xidach';
  // Dealer Xì Dách → thua
  if (dealerStatus === 'xidach') return 'lose';

  // Cả hai đều Ngũ Linh → ai ít điểm hơn thắng (theo luật)
  if (playerStatus === 'fiveCards' && dealerStatus === 'fiveCards') {
    const ps = calculateScore(playerCards);
    const ds = calculateScore(dealerCards);
    if (ps < ds) return 'fiveCards';
    if (ps === ds) return 'draw';
    return 'lose';
  }
  // Player Ngũ Linh, dealer không → thắng
  if (playerStatus === 'fiveCards') return 'fiveCards';
  // Dealer Ngũ Linh, player không → thua
  if (dealerStatus === 'fiveCards') return 'lose';

  // So điểm bình thường
  const ps = calculateScore(playerCards);
  const ds = calculateScore(dealerCards);
  // Nhà con ≤15 điểm: chưa đủ điểm, thua (nhà cái được phép dừng ở 15, nhà con thì không)
  if (ps <= 15) return 'lose';
  if (ps > ds) return 'win';
  if (ps === ds) return 'draw';
  return 'lose';
}

// Tính tiền thắng thua dựa trên kết quả
export function calculatePayout(betAmount: number, result: PlayerResult): number {
  switch (result) {
    case 'xidach':    return Math.floor(betAmount * 1.5); // thắng thêm 1.5x (net +1.5x)
    case 'xibang':    return betAmount;                   // thắng thêm 1x (net +1x)
    case 'fiveCards': return betAmount;                   // thắng thêm 1x
    case 'win':       return betAmount;                   // thắng thêm 1x
    case 'draw':      return 0;                           // hòa, giữ nguyên
    case 'lose':      return -betAmount;                  // mất cược
  }
}

// deltaM cho player (tiền thực nhận hoặc mất)
export function calculateDeltaM(betAmount: number, result: PlayerResult): number {
  return calculatePayout(betAmount, result);
}

export function formatMoney(money: number): string {
  if (!money && money !== 0) return '0';
  if (money >= 1_000_000_000) return `${Math.floor(money / 1_000_000_000)}B`;
  if (money >= 1_000_000) return `${Math.floor(money / 1_000_000)}M`;
  if (money >= 1_000) return `${Math.floor(money / 1_000)}K`;
  return money.toString();
}
