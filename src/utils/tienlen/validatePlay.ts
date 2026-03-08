const CARD_ORDER = '3456789TJQKA2';
const SUIT_ORDER = 'SCDH'; // Bích < Chuồn < Rô < Cơ

function cardValue(card: string) {
  if (card.length === 3) return CARD_ORDER.indexOf('T'); 
  return CARD_ORDER.indexOf(card[0]);
}

function cardSuitValue(card: string) {
  return SUIT_ORDER.indexOf(card[card.length - 1]);
}

function groupByValue(cards: string[]) {
  const map: Record<number, string[]> = {};
  cards.forEach(c => {
    const v = cardValue(c);
    if (!map[v]) map[v] = [];
    map[v].push(c);
  });
  return map;
}

function isSequence(cards: string[]) {
  if (cards.some(c => c.includes('2'))) return false; // Sảnh không chứa 2
  const uniqueValues = new Set(cards.map(cardValue));
  if (uniqueValues.size !== cards.length) return false; 
  const sortedValues = Array.from(uniqueValues).sort((a, b) => a - b);
  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] !== sortedValues[i - 1] + 1) return false;
  }
  return true;
}

export function getCombinationType(cards: string[]): string | null {
  const n = cards.length;
  const groups = groupByValue(cards);
  const values = Object.keys(groups).map(Number);

  if (n === 1) return 'single';
  if (n === 2 && values.length === 1) return 'pair';
  if (n === 3 && values.length === 1) return 'trio';
  if (n === 4 && values.length === 1) return 'four';

  // 3 Đôi thông
  if (n === 6 && values.length === 3 && values.every(v => groups[v].length === 2)) {
    const sorted = values.sort((a, b) => a - b);
    if (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) return 'threePairs';
  }

  // 4 Đôi thông
  if (n === 8 && values.length === 4 && values.every(v => groups[v].length === 2)) {
    const sorted = values.sort((a, b) => a - b);
    if (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1 && sorted[3] === sorted[2] + 1) return 'fourPairs';
  }

  if (n >= 3 && isSequence(cards)) return 'sequence';
  return null;
}

function compareNormal(type: string, a: string[], b: string[]) {
  if (type === 'single' || type === 'pair' || type === 'trio' || type === 'four') {
    const valA = cardValue(a[0]);
    const valB = cardValue(b[0]);
    if (valA !== valB) return valA > valB;
    const maxSuitA = Math.max(...a.map(cardSuitValue));
    const maxSuitB = Math.max(...b.map(cardSuitValue));
    return maxSuitA > maxSuitB;
  }
  if (type === 'sequence') {
    const maxA = Math.max(...a.map(cardValue));
    const maxB = Math.max(...b.map(cardValue));
    if (maxA !== maxB) return maxA > maxB;
    const maxCardA = a.find(c => cardValue(c) === maxA) || a[0];
    const maxCardB = b.find(c => cardValue(c) === maxB) || b[0];
    return cardSuitValue(maxCardA) > cardSuitValue(maxCardB);
  }
  if (type === 'threePairs' || type === 'fourPairs') {
    const sortedA = [...a].sort((x, y) => cardValue(x) - cardValue(y));
    const sortedB = [...b].sort((x, y) => cardValue(x) - cardValue(y));
    return cardValue(sortedA[sortedA.length - 1]) > cardValue(sortedB[sortedB.length - 1]);
  }
  return false;
}

function canBeatSpecial(current: string[], last: string[]) {
  const typeA = getCombinationType(current);
  const typeB = getCombinationType(last);
  
  // Chặt Heo: Tứ quý, 3 đôi thông, 4 đôi thông chặt được Heo
  if (typeB === 'single' && (last[0].includes('2'))) {
      return typeA === 'four' || typeA === 'threePairs' || typeA === 'fourPairs';
  }
  // Chặt Đôi Heo: Tứ quý, 4 đôi thông
  if (typeB === 'pair' && last[0].includes('2')) {
      return typeA === 'four' || typeA === 'fourPairs';
  }
  
  if (typeB === 'threePairs' && typeA === 'threePairs') return compareNormal('threePairs', current, last);
  if (typeB === 'four' && typeA === 'four') return compareNormal('four', current, last);
  if (typeB === 'fourPairs' && typeA === 'fourPairs') return compareNormal('fourPairs', current, last);
  
  return false;
}

export function canBeat(cards: string[], lastCards: string[]): boolean {
  const typeA = getCombinationType(cards);
  const typeB = getCombinationType(lastCards);
  
  if (!typeA) return false;
  if (!lastCards || lastCards.length === 0) return true; 

  if (canBeatSpecial(cards, lastCards)) return true; 
  
  if (typeA !== typeB) return false; 
  if (cards.length !== lastCards.length) return false;
  
  return compareNormal(typeA, cards, lastCards);
}

export function validatePlay(cards: string[], lastCards: string[]) {
  if (!getCombinationType(cards)) return { valid: false, reason: 'Bộ bài không hợp lệ' };
  if (!lastCards || lastCards.length === 0) return { valid: true };
  if (!canBeat(cards, lastCards)) return { valid: false, reason: 'Không đủ lớn để đè' };
  return { valid: true };
}