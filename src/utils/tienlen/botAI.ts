import { canBeat } from "./validatePlay";

// Trả về 1 bộ bài hợp lệ để bot đánh, hoặc [] nếu pass
export function pickBotMove(
  hand: string[],
  lastPlay: string[] | null,
  difficulty: "easy" | "medium" | "hard",
  playersArr?: any[],
  game?: any
) {
  if (difficulty === "easy") return pickEasy(hand, lastPlay);
  if (difficulty === "medium") return pickMedium(hand, lastPlay);
  if (difficulty === "hard")
    return pickHard(hand, lastPlay, playersArr || [], game); // <-- thêm || []
  return [];
}

// ------------------- EASY -------------------
function pickEasy(hand: string[], lastPlay: string[] | null) {
  const combos = getAllCombos(hand);
  // Nếu mở vòng, bắt buộc phải đánh bộ chứa 3S nếu có
  if (!lastPlay || lastPlay.length === 0) {
    const comboWith3S = combos.find((c) => c.includes("3S"));
    if (comboWith3S) return comboWith3S;
    return combos[0]; // fallback: đánh bộ đầu tiên
  }
  const candidates = combos.filter((c) => canBeat(c, lastPlay));
  if (candidates.length === 0) return [];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ------------------- MEDIUM -------------------
function pickMedium(hand: string[], lastPlay: string[] | null) {
  const combos = getAllCombos(hand).sort((a, b) => a.length - b.length);
  if (!lastPlay || lastPlay.length === 0) {
    const comboWith3S = combos.find((c) => c.includes("3S"));
    if (comboWith3S) return comboWith3S;
    return combos[0];
  }
  const candidates = combos.filter((c) => canBeat(c, lastPlay));
  if (candidates.length === 0) return [];
  if (Math.random() < 0.2) return []; // pass 20%
  return candidates[0];
}

// ------------------- HARD -------------------
function pickHard(
  hand: string[],
  lastPlay: string[] | null,
  playersArr: any[],
  game: any
) {
  const combos = getAllCombos(hand);

  if (!lastPlay || lastPlay.length === 0) {
    // Ưu tiên đánh bộ chứa 3S nếu có
    const comboWith3S = combos.find((c) => c.includes("3S"));
    if (comboWith3S) return comboWith3S;
    if (hand.length <= 3) return combos.sort((a, b) => a.length - b.length)[0];
    return combos.find((c) => !isStrongCombo(c)) || combos[0];
  }

  const candidates = combos.filter((c) => canBeat(c, lastPlay));
  if (candidates.length === 0) return [];
  let best = candidates.sort((a, b) => comboStrength(a) - comboStrength(b))[0];
  const nextPlayer =
    playersArr[(game.currentPlayerIndex + 1) % playersArr.length];
  if (nextPlayer.handCount <= 3) {
    const strongCandidate = candidates.find((c) => isStrongCombo(c));
    if (strongCandidate) best = strongCandidate;
  }
  return best;
}

// ------------------- Hỗ trợ -------------------
function isStrongCombo(combo: string[]) {
  return (
    combo.some((c) => c[0] === "2") || combo.length >= 5 || combo.length === 4
  );
}

function comboStrength(combo: string[]) {
  let val = 0;
  combo.forEach((c) => {
    const v =
      c.length === 3
        ? 10
        : c[0] === "J"
        ? 11
        : c[0] === "Q"
        ? 12
        : c[0] === "K"
        ? 13
        : c[0] === "A"
        ? 14
        : c[0] === "2"
        ? 16
        : parseInt(c[0]);
    val += v;
  });
  val += combo.length * 10; // ưu tiên combo dài
  return val;
}

// ------------------- Liệt kê tất cả combo hợp lệ -------------------
function getAllCombos(hand: string[]): string[][] {
  const combos: string[][] = [];
  const valueCount: Record<string, string[]> = {};
  hand.forEach((card) => {
    const v = card.length === 3 ? "T" : card[0];
    if (!valueCount[v]) valueCount[v] = [];
    valueCount[v].push(card);
  });

  // Single
  hand.forEach((card) => combos.push([card]));

  // Pair
  Object.values(valueCount).forEach((arr) => {
    if (arr.length >= 2) combos.push(arr.slice(0, 2));
  });

  // Trio
  Object.values(valueCount).forEach((arr) => {
    if (arr.length >= 3) combos.push(arr.slice(0, 3));
  });

  // Four
  Object.values(valueCount).forEach((arr) => {
    if (arr.length === 4) combos.push(arr.slice(0, 4));
  });

  // TODO: có thể thêm sảnh và sảnh đôi nếu muốn bot mạnh hơn
  return combos;
}
