// Sinh mã phòng 5 số ngẫu nhiên (10000 - 99999)
export function generateRoomCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}