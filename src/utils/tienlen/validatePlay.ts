const CARD_ORDER = '3456789TJQKA2';

// Lấy giá trị
function cardValue(card: string) {
  return CARD_ORDER.indexOf(card[0]);
}

// Group theo giá trị
function groupByValue(cards: string[]) {
  const map: Record<number, string[]> = {};
  cards.forEach(c => {
    const v = cardValue(c);
    if (!map[v]) map[v] = [];
    map[v].push(c);
  });
  return map;
}

// Kiểm tra sảnh
function isSequence(cards: string[]) {
  const sorted = [...cards].sort((a, b) => cardValue(a) - cardValue(b));

  // Không chứa 2
  if (sorted.some(c => c[0] === '2')) return false;

  for (let i = 1; i < sorted.length; i++) {
    if (cardValue(sorted[i]) !== cardValue(sorted[i - 1]) + 1) return false;
  }
  return true;
}

// Xác định loại bộ bài
export function getCombinationType(cards: string[]): string | null {
  const n = cards.length;
  const groups = groupByValue(cards);
  const values = Object.keys(groups).map(Number);

  // ---- SINGLE
  if (n === 1) return 'single';

  // ---- PAIR
  if (n === 2 && values.length === 1) return 'pair';

  // ---- TRIO
  if (n === 3 && values.length === 1) return 'trio';

  // ---- TỨ QUÝ
  if (n === 4 && values.length === 1) return 'four';

  // ---- 3 đôi thông
  if (n === 6 && values.every(v => groups[v].length === 2)) {
    const sorted = values.sort((a, b) => a - b);
    if (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1)
      return 'threePairs';
  }

  // ---- 4 đôi thông
  if (n === 8 && values.every(v => groups[v].length === 2)) {
    const sorted = values.sort((a, b) => a - b);
    if (
      sorted[1] === sorted[0] + 1 &&
      sorted[2] === sorted[1] + 1 &&
      sorted[3] === sorted[2] + 1
    ) return 'fourPairs';
  }

  // ---- Sảnh
  if (n >= 3 && isSequence(cards)) return 'sequence';

  return null;
}

// So sánh 2 bộ bài cùng loại (THƯỜNG)
function compareNormal(type: string, a: string[], b: string[]) {
  if (type === 'single' || type === 'pair' || type === 'trio' || type === 'sequence') {
    const minA = Math.min(...a.map(cardValue));
    const minB = Math.min(...b.map(cardValue));
    return minA > minB;
  }

  if (type === 'four') {
    const valA = cardValue(a[0]);
    const valB = cardValue(b[0]);
    return valA > valB;
  }

  if (type === 'threePairs' || type === 'fourPairs') {
    const sortedA = [...a].sort((x, y) => cardValue(x) - cardValue(y));
    const sortedB = [...b].sort((x, y) => cardValue(x) - cardValue(y));
    return cardValue(sortedA[0]) > cardValue(sortedB[0]);
  }

  return false;
}

// Luật chặt đặc biệt
function canBeatSpecial(current: string[], last: string[]) {
  const typeA = getCombinationType(current);
  const typeB = getCombinationType(last);

  // 2 bị chặt bởi: tứ quý, 3 đôi thông, 4 đôi thông
  if (typeB === 'single' && last[0][0] === '2') {
    return typeA === 'four' || typeA === 'threePairs' || typeA === 'fourPairs';
  }

  // Đôi 2 bị chặt bởi: tứ quý, 4 đôi thông
  if (typeB === 'pair' && last[0][0] === '2') {
    return typeA === 'four' || typeA === 'fourPairs';
  }

  // Tứ quý bị chặt bởi tứ quý lớn hơn
  if (typeB === 'four' && typeA === 'four') {
    return compareNormal('four', current, last);
  }

  return false;
}

// Kiểm tra đè bài
export function canBeat(cards: string[], lastCards: string[]): boolean {
  const typeA = getCombinationType(cards);
  const typeB = getCombinationType(lastCards);

  if (!typeA || !typeB) return false;

  // Kiểm tra chặt đặc biệt
  if (canBeatSpecial(cards, lastCards)) return true;

  // Không cùng loại → không thể đè
  if (typeA !== typeB) return false;

  // Phải cùng số lượng
  if (cards.length !== lastCards.length) return false;

  return compareNormal(typeA, cards, lastCards);
}

// Validate tổng
export function validatePlay(cards: string[], lastCards: string[]) {
  if (!getCombinationType(cards)) {
    return { valid: false, reason: 'Bộ bài không hợp lệ' };
  }

  // Không có lượt trước → đánh thoải mái
  if (!lastCards || lastCards.length === 0) {
    return { valid: true };
  }

  if (!canBeat(cards, lastCards)) {
    return { valid: false, reason: 'Không đủ lớn để đè' };
  }

  return { valid: true };
}
