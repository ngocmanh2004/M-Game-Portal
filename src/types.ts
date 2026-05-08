export interface User {
  username: string;
  balance: number;
  email?: string;
  uid?: string;
  avatar?: string;
  background?: string;
}

export interface UserData {
  email: string;
  nickname?: string;
  money: number;
  tickets?: number;
  lastSpinDate?: string;
  lastQuestDate?: string;
  dailyQuests?: Record<string, any>;
  avatar?: string;
  background?: string;
  activeMusic?: string;
  lastCheckin: string;
  tasks: {
    followTiktok: boolean;
    subscribeYoutube: boolean;
  };
  isAdmin?: boolean;  // ⭐ THÊM
  isLocked?: boolean; // ⭐ THÊM
  createdAt?: number;
  lastLogin?: number;
}

export interface BauCuaItem {
  id: string;
  name: string;
  image: string;
  boardImage: string;
  color: string;
}

export interface ChipInfo {
  value: number;
  label: string;
  image: string;
  color: string;
}

export interface Bet {
  targetId: string;
  amount: number;
}

export interface PigType {
  id: string;
  name: string;
  price: number;
  minReward: number;
  maxReward: number;
  jackpotReward: number;  // ⭐ THÊM
  boomChance: number;
  jackpotChance: number;
  image: string;
  color: string;
  rarity: string;
}

export enum GameType {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  BAU_CUA = 'BAU_CUA',
  TAI_XIU = 'TAI_XIU',
  XOC_DIA = 'XOC_DIA',
  DAP_HEO = 'DAP_HEO',
  SHOP = 'SHOP',
  INVENTORY = 'INVENTORY',
  PROFILE = 'PROFILE',
  LEADERBOARD = 'LEADERBOARD',
  ADMIN_PANEL = 'ADMIN_PANEL',
  FRIENDS = 'FRIENDS',
  TIEN_LEN = 'TIEN_LEN',
  XI_DACH = 'XI_DACH',
  CO_CA_NGU = 'CO_CA_NGU',
  SIEU_TRI_TUE = 'SIEU_TRI_TUE',
}

// ─── Cờ Cá Ngựa types ──────────────────────────────────────────────────────

export type CaNguColor = 'red' | 'blue' | 'yellow' | 'green';

export type CaNguPiecePos =
  | { type: 'home' }
  | { type: 'path'; index: number }
  | { type: 'homeCol'; step: number }
  | { type: 'finished' };

export interface CaNguPiece {
  id: number;
  pos: CaNguPiecePos;
}

export interface CaNguPlayer {
  uid: string;
  name: string;
  avatar?: string;
  color: CaNguColor;
  balance: number;
}

export interface CaNguTransaction {
  ts: number;
  fromUid: string;
  toUid: string;
  amount: number;
  reason: 'kick' | 'kickDouble' | 'homeCol6' | 'endPenalty';
}

export interface CaNguGameState {
  status: 'waiting' | 'rolling' | 'choosing' | 'moving' | 'finished';
  playerOrder: string[];
  players: Record<string, CaNguPlayer>;
  balances: Record<string, number>;
  pieces: Record<string, CaNguPiece[]>;
  currentTurnUid: string;
  dice: [number, number] | null;
  extraTurn: boolean;
  winner: string | null;
  betAmount: number;
  transactions: CaNguTransaction[];
  pendingMoves: CaNguMoveOption[] | null;
  highlightPieceId: number | null;
  lastAction: string | null;
}

export interface CaNguMoveOption {
  pieceId: number;
  diceValues: number[];
  targetPos: CaNguPiecePos;
  kicksUid?: string;
  isDouble: boolean;
}

export interface CaNguLobby {
  id: string;
  hostUid: string;
  hostName: string;
  betAmount: number;
  maxPlayers: 4;
  players: Record<string, { name: string; avatar?: string; ready: boolean }>;
  status: 'waiting' | 'starting' | 'started';
  createdAt: number;
  roomCode?: string;
  gameId?: string;
}

export type SoundType = 'effect' | 'dice' | 'money' | 'pig' | 'win' | 'loss' | 'lucky' | 'boom';

// ⭐ ========== SHOP & INVENTORY ==========

export enum ItemType {
  AVATAR = 'AVATAR',
  BACKGROUND = 'BACKGROUND',
  BONUS_CARD = 'BONUS_CARD',
  TET_INTERACTIVE = 'TET_INTERACTIVE',
  MUSIC = 'MUSIC'
}

// ⭐ Loại tương tác của vật phẩm Tết
export enum TetItemAction {
  FIREWORK = 'FIREWORK',      // Pháo hoa - nổ + animation
  TREE = 'TREE',               // Cây đào/mai - click nhận tiền
  FOOD = 'FOOD',               // Bánh chưng - mở nhận bonus
  LANTERN = 'LANTERN',         // Lồng đèn - sáng lên + nhiệm vụ
  DECORATION = 'DECORATION'    // Trang trí tĩnh
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  description: string;
  imageUrl: string;

  // Cho BONUS_CARD
  bonusPercent?: number;
  expiresIn?: number;

  // Cho TET_INTERACTIVE
  tetAction?: TetItemAction;
  minReward?: number;      // Tiền thưởng tối thiểu
  maxReward?: number;      // Tiền thưởng tối đa
  maxUses?: number;        // Số lần dùng tối đa (-1 = vô hạn)
  cooldown?: number;       // Thời gian chờ giữa các lần dùng (ms)

  // Cho MUSIC
  audioUrl?: string;

  stock?: number;
}

export interface UserItem {
  itemId: string;
  quantity: number;
  obtainedAt: number;
  used?: boolean;            // Đang sử dụng (avatar, background, decoration)

  // Cho BONUS_CARD
  activatedAt?: number;
  expiresAt?: number;

  // Cho TET_INTERACTIVE
  usesLeft?: number;         // Số lần dùng còn lại
  lastUsedAt?: number;       // Lần dùng gần nhất
  displayOnDashboard?: boolean; // Hiển thị trên Dashboard
}

export interface LeaderboardEntry {
  uid: string;
  email: string;
  avatar?: string;
  background?: string;  // ⭐ THÊM
  money: number;
  rank: number;
}

// ⭐ Kết quả khi dùng vật phẩm Tết
export interface TetItemUseResult {
  success: boolean;
  message: string;
  reward?: number;           // Tiền thưởng
  animation?: string;        // Tên animation
  sound?: SoundType;         // Âm thanh
}


export interface FriendRequest {
  id: string;
  from: string;           // User ID người gửi
  to: string;             // User ID người nhận
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Friendship {
  id: string;
  users: [string, string]; // 2 User IDs
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: [string, string]; // 2 User IDs
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: {
    [userId: string]: number;
  };
}

export interface UserPublicProfile {
  uid: string;
  email: string;
  avatar?: string;
  money: number;
  onlineStatus?: boolean;
  lastSeen?: number;
}

// ========== ADMIN NOTIFICATIONS & GIFTS ==========

export enum NotificationType {
  SYSTEM = 'SYSTEM',           // Thông báo hệ thống
  EVENT = 'EVENT',             // Sự kiện
  GIFT = 'GIFT',               // Quà tặng
  WARNING = 'WARNING',         // Cảnh báo
  UPDATE = 'UPDATE'            // Cập nhật game
}

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;           // Ảnh minh họa

  // Gift kèm theo
  giftItems?: {
    itemId: string;
    quantity: number;
  }[];
  giftMoney?: number;          // Tiền thưởng

  // Target users
  targetType: 'all' | 'specific'; // Gửi tất cả hay cụ thể
  targetUserIds?: string[];    // Danh sách UID (nếu specific)

  // Metadata
  createdBy: string;           // Admin UID
  createdAt: number;
  expiresAt?: number;          // Hết hạn (tự xóa)

  // Tracking
  readBy?: string[];           // Danh sách user đã đọc
  claimedBy?: string[];        // Danh sách user đã nhận quà
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;      // Link đến AdminNotification
  read: boolean;
  claimed: boolean;            // Đã nhận quà chưa
  createdAt: number;
}

export interface QuizRoomPlayer {
  name: string;
  avatar?: string;
  balance: number;
  score: number;
  isEliminated: boolean;
  eliminatedInRound: number | null;
  isSpectator: boolean;
  isReady: boolean;
}

export interface QuizRoomQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

export interface QuizRoomAnswer {
  answerIndex: number;
  answerTime: number;
}

export interface QuizRoom {
  id: string;
  hostUid: string;
  hostName: string;
  betAmount: number;
  totalPot: number;
  roomCode: string;
  status: 'lobby' | 'starting' | 'playing' | 'ended';
  startingIn: number;
  practiceMode: boolean;
  phase: 'question' | 'reveal' | 'leaderboard' | 'elimination' | 'podium';
  currentRound: 1 | 2 | 3;
  currentQuestionIndex: number;
  questionStartTime: number;
  timeLimit: number;
  questions: QuizRoomQuestion[][];
  players: Record<string, QuizRoomPlayer>;
  answers: Record<string, Record<string, QuizRoomAnswer>>;
  winners?: { first?: string; second?: string; third?: string };
  rewards?: Record<string, number>;
  createdAt: number;
}