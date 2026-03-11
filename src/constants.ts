import { BauCuaItem, ChipInfo, PigType, ShopItem, ItemType, TetItemAction } from './types';

export const INITIAL_BALANCE = 500000;

export const BAU_CUA_ITEMS: BauCuaItem[] = [
  {
    id: 'ga',
    name: 'Gà',
    image: '/assets/image/items/ga.jpg',
    boardImage: '/assets/image/items/ga.png',
    color: 'bg-yellow-600'
  },

  {
    id: 'bau',
    name: 'Bầu',
    image: '/assets/image/items/bau.png',        // ⭐ Ảnh trong bát (không background)
    boardImage: '/assets/image/items/bau.jpg',   // ⭐ Ảnh ô đặt cược (có background)
    color: 'bg-green-600'
  },

  {
    id: 'nai',
    name: 'Nai',
    image: '/assets/image/items/nai.jpg',
    boardImage: '/assets/image/items/nai.png',
    color: 'bg-orange-600'
  },
  {
    id: 'tom',
    name: 'Tôm',
    image: '/assets/image/items/tom.jpg',        // ⭐ Trong bát
    boardImage: '/assets/image/items/tom.png',   // ⭐ Ô cược
    color: 'bg-pink-600'
  },

  {
    id: 'cua',
    name: 'Cua',
    image: '/assets/image/items/cua.png',
    boardImage: '/assets/image/items/cua.jpg',
    color: 'bg-red-600'
  },

  {
    id: 'ca',
    name: 'Cá',
    image: '/assets/image/items/ca.jpg',
    boardImage: '/assets/image/items/ca.png',
    color: 'bg-blue-600'
  }
];

export const CHIP_VALUES: ChipInfo[] = [
  { value: 1000, label: '1K', image: '/assets/image/moneys/1k.jpg', color: 'bg-gray-400' },
  { value: 2000, label: '2K', image: '/assets/image/moneys/2k.jpg', color: 'bg-blue-400' },
  { value: 5000, label: '5K', image: '/assets/image/moneys/5k.jpg', color: 'bg-purple-400' },
  { value: 10000, label: '10K', image: '/assets/image/moneys/10k.jpg', color: 'bg-red-400' },
  { value: 20000, label: '20K', image: '/assets/image/moneys/20k.jpg', color: 'bg-green-400' },
  { value: 50000, label: '50K', image: '/assets/image/moneys/50k.jpg', color: 'bg-indigo-400' },
  { value: 100000, label: '100K', image: '/assets/image/moneys/100k.jpg', color: 'bg-yellow-400' },
  { value: 200000, label: '200K', image: '/assets/image/moneys/200k.jpg', color: 'bg-pink-400' },
  { value: 500000, label: '500K', image: '/assets/image/moneys/500k.jpg', color: 'bg-orange-400' }
];

export const TAI_XIU_CONFIG = {
  TAI_RANGE: [11, 17] as const,
  XIU_RANGE: [4, 10] as const,
  TAI: 'TAI',
  XIU: 'XIU'
};

export const XOC_DIA_CONFIG = {
  CHAN: 'CHAN',
  LE: 'LE'
};

export const PIG_TYPES: PigType[] = [
  {
    id: 'clay',
    name: 'Heo Đất',
    price: 50000,
    minReward: 30000,
    maxReward: 150000,
    jackpotReward: 300000,
    boomChance: 0.05,
    jackpotChance: 0.15,
    image: '/assets/image/items/heodat.png',  // ⭐ ĐỔI
    color: 'from-amber-700 to-orange-900',
    rarity: 'Thường'
  },
  {
    id: 'silver',
    name: 'Heo Bạc',
    price: 100000,
    minReward: 70000,
    maxReward: 200000,
    jackpotReward: 500000,
    boomChance: 0.08,
    jackpotChance: 0.13,
    image: '/assets/image/items/heobac.png',  // ⭐ ĐỔI
    color: 'from-gray-300 to-gray-600',
    rarity: 'Hiếm'
  },
  {
    id: 'golden',
    name: 'Heo Vàng',
    price: 200000,
    minReward: 150000,
    maxReward: 350000,
    jackpotReward: 1000000,
    boomChance: 0.12,
    jackpotChance: 0.1,
    image: '/assets/image/items/heovang.png',  // ⭐ ĐỔI
    color: 'from-yellow-300 to-yellow-600',
    rarity: 'Quý Hiếm'
  },
  {
    id: 'diamond',
    name: 'Heo Kim Cương',
    price: 500000,
    minReward: 300000,
    maxReward: 1000000,
    jackpotReward: 5000000,
    boomChance: 0.17,
    jackpotChance: 0.08,
    image: '/assets/image/items/heokimcuong.png',  // ⭐ ĐỔI
    color: 'from-cyan-300 to-blue-600',
    rarity: 'Siêu Hiếm'
  },
  {
    id: 'superman',
    name: 'Heo Superman',
    price: 1000000,
    minReward: 700000,
    maxReward: 1500000,
    jackpotReward: 10000000,
    boomChance: 0.2,
    jackpotChance: 0.05,
    image: '/assets/image/items/heosuperman.png',
    color: 'from-red-600 to-blue-500',        // ⭐ Đỏ vàng rực rỡ
    rarity: 'Marvel'
  },
  {
    id: 'thanos',
    name: 'Heo Thanos',
    price: 3000000,
    minReward: 2000000,
    maxReward: 5000000,
    jackpotReward: 15000000,
    boomChance: 0.20,
    jackpotChance: 0.05,
    image: '/assets/image/items/heothanos.png',
    color: 'from-purple-600 to-yellow-400',     // ⭐ Tím vàng quyền lực
    rarity: 'Marvel'
  },
  {
    id: 'doraemon',
    name: 'Heo Doraemon',
    price: 5000000,
    minReward: 2500000,
    maxReward: 10000000,
    jackpotReward: 25000000,
    boomChance: 0.21,
    jackpotChance: 0.04,
    image: '/assets/image/items/heodoraemon.png',
    color: 'from-blue-400 to-sky-700',          // ⭐ Xanh dương tươi sáng
    rarity: 'Doraemon'
  },
  {
    id: 'songoku',
    name: 'Heo Songoku',
    price: 10000000,
    minReward: 5000000,
    maxReward: 20000000,
    jackpotReward: 50000000,
    boomChance: 0.22,
    jackpotChance: 0.03,
    image: '/assets/image/items/heosongoku.png',
    color: 'from-orange-700 to-yellow-300',     // ⭐ Cam vàng năng lượng
    rarity: 'Dragon Ball'
  }
];

export const BACKGROUNDS_DESKTOP = [
  { id: 'bg-tet1', name: 'Nền Tết Truyền Thống', url: '/assets/image/background/bg-tet1.png', class: 'bg-gradient-to-br from-red-900 to-red-700' },
  { id: 'bg1', name: 'Đỏ Truyền Thống', url: '/assets/image/background/bg1.png', class: 'bg-gradient-to-br from-red-900 to-red-700' },
  { id: 'bg2', name: 'Vàng Rực Rỡ', url: '/assets/image/background/bg2.png', class: 'bg-gradient-to-br from-yellow-700 to-orange-600' },
  { id: 'bg3', name: 'Hồng Phấn', url: '/assets/image/background/bg3.png', class: 'bg-gradient-to-br from-pink-600 to-purple-700' }
];

export const BACKGROUNDS_MOBILE = [
  { id: 'bg-mobile1', name: 'Nền Tết Mobile', url: '/assets/image/items/bg-noel1.jpg', class: 'bg-gradient-to-br from-red-900 to-red-700' },
  { id: 'bg-mb1', name: 'Đỏ Di Động', url: '/assets/image/background/bg-mb1.png', class: 'bg-gradient-to-br from-red-800 to-red-600' },
  { id: 'bg-mb2', name: 'Vàng Di Động', url: '/assets/image/background/bg-mb2.png', class: 'bg-gradient-to-br from-yellow-600 to-orange-500' }
];

export const SOUNDS = {
  effect: '/assets/audio/effect.mp3',
  dice: '/assets/audio/dice.mp3',
  money: '/assets/audio/money.mp3',
  pig: '/assets/audio/pig.mp3',
  win: '/assets/audio/win.mp3',
  loss: '/assets/audio/lose.mp3',
  lucky: '/assets/audio/lucky.mp3',
  boom: '/assets/audio/boom.mp3',
  spin: '/assets/audio/spin.mp3',
  bgMusic: '/assets/audio/tet-music.mp3'
};

export const ASSETS = {
  logo: '/assets/image/icons/logo.png',
  soundOn: '/assets/image/icons/speaker.png',
  soundOff: '/assets/image/icons/mute.png',
  plate: '/assets/image/items/diamo.png',
  bowl: '/assets/image/items/diaup.png',
};

// ⭐ ========== DANH SÁCH VẬT PHẨM SHOP - CẬP NHẬT ẢNH THẬT ==========

export const SHOP_ITEMS: ShopItem[] = [

  // ========== AVATARS - ẢNH THẬT ==========
  {
    id: 'avatar_free_nam',
    name: 'Avatar Free - Nam',
    price: 0,
    type: ItemType.AVATAR,
    description: 'Avatar miễn phí cho Nam',
    imageUrl: '/assets/image/items/avt-free-nam.jpg',
    stock: 999
  },
  {
    id: 'avatar_free_nu',
    name: 'Avatar Free - Nữ',
    price: 0,
    type: ItemType.AVATAR,
    description: 'Avatar miễn phí cho Nữ',
    imageUrl: '/assets/image/items/avt-free-nu.jpg',
    stock: 999
  },
  {
    id: 'avatar_aodai_nam',
    name: 'Áo Dài Truyền Thống - Nam',
    price: 2000000,
    type: ItemType.AVATAR,
    description: 'Avatar áo dài vàng sang trọng',
    imageUrl: '/assets/image/items/avt-aodaivang-nam.jpg',
    stock: 999
  },
  {
    id: 'avatar_aodai_nu',
    name: 'Áo Dài Truyền Thống - Nữ',
    price: 2000000,
    type: ItemType.AVATAR,
    description: 'Avatar áo dài vàng sang trọng',
    imageUrl: '/assets/image/items/avt-aodaivang-nu.jpg',
    stock: 999
  },
  {
    id: 'avatar_manh_soai_ca',
    name: '👑 Mạnh Soái Ca - VIP',
    price: 100000000,
    type: ItemType.AVATAR,
    description: 'Avatar đặc biệt dành riêng cho chủ nhân! Giới hạn 1 người',
    imageUrl: '/assets/image/items/avt-hiendai-nam.jpg',
    stock: 1
  },
  {
    id: 'avatar_chi_dai',
    name: '💎 Chị Đại Sông Cầu',
    price: 3000000,
    type: ItemType.AVATAR,
    description: 'Avatar phong cách hiện đại - Nữ',
    imageUrl: '/assets/image/items/avt-hiendai-nu.jpg',
    stock: 999
  },
  {
    id: 'avatar_noel1_nam',
    name: 'Noel Ấm Áp - Nam',
    price: 1000000,
    type: ItemType.AVATAR,
    description: 'Avatar noel phong cách hiện đại - Nam',
    imageUrl: '/assets/image/items/avt-noel1-nam.png',
    stock: 999
  },

  {
    id: 'avatar_noel1_nu',
    name: 'Noel Ấm Áp - Nữ',
    price: 1000000,
    type: ItemType.AVATAR,
    description: 'Avatar noel phong cách hiện đại - Nữ',
    imageUrl: '/assets/image/items/avt-noel1-nu.jpg',
    stock: 999
  },

  {
    id: 'avatar_noel2_nam',
    name: '👑 Mạnh Không Lạnh',
    price: 1000000000,
    type: ItemType.AVATAR,
    description: 'Avatar noel siêu hiếm - Nam',
    imageUrl: '/assets/image/items/avt-noel2-nam.jpg',
    stock: 999
  },
  {
    id: 'avatar_noel1_nu',
    name: '💎 Noel An Lành VIP',
    price: 10000000,
    type: ItemType.AVATAR,
    description: 'Avatar noel phong cách hiện đại - Nữ',
    imageUrl: '/assets/image/items/avt-noel2-nu.jpg',
    stock: 999
  },

  // ========== BACKGROUNDS - GIỮ NGUYÊN ==========
  {
    id: 'bg_shop_1',
    name: 'Nền Hoa Mai',
    price: 500000,
    type: ItemType.BACKGROUND,
    description: 'Background hoa mai rực rỡ',
    imageUrl: '/assets/image/items/bg-hoamai.jpg',
    stock: 999
  },
  {
    id: 'bg_shop_2',
    name: 'Nền Hoa Đào',
    price: 500000,
    type: ItemType.BACKGROUND,
    description: 'Background hoa đào',
    imageUrl: '/assets/image/items/bg-hoadao.jpg',
    stock: 999
  },
  {
    id: 'bg_shop_3',
    name: 'Nền Pháo Hoa',
    price: 10000000,
    type: ItemType.BACKGROUND,
    description: 'Background pháo hoa lung linh',
    imageUrl: '/assets/image/items/bg-phaohoa.jpg',
    stock: 999
  },

  {
    id: 'bg_shop_4',
    name: 'Nền Giáng Sinh 1',
    price: 1000000,
    type: ItemType.BACKGROUND,
    description: 'Background giáng sinh ấm áp',
    imageUrl: '/assets/image/items/bg-noel1.jpg',
    stock: 999
  },

  {
    id: 'bg_shop_5',
    name: 'Nền Giáng Sinh 2',
    price: 1500000,
    type: ItemType.BACKGROUND,
    description: 'Background giáng sinh ấm áp',
    imageUrl: '/assets/image/items/bg-noel2.jpg',
    stock: 999
  },

  {
    id: 'bg_shop_6',
    name: 'Nền Giáng Sinh 3',
    price: 2000000,
    type: ItemType.BACKGROUND,
    description: 'Background giáng sinh ấm áp',
    imageUrl: '/assets/image/items/bg-noel3.jpg',
    stock: 999
  },

  // ========== BONUS CARDS - ẢNH THẬT + GIÁ MỚI ==========
  {
    id: 'bonus_10',
    name: 'Thẻ Lộc +10%',
    price: 3000000,
    type: ItemType.BONUS_CARD,
    description: 'Tăng 10% tiền thắng trong 24 giờ',
    imageUrl: '/assets/image/items/theloc10.jpg',
    bonusPercent: 10,
    expiresIn: 86400000,
    stock: 50
  },
  {
    id: 'bonus_20',
    name: 'Thẻ Lộc +20%',
    price: 10000000,
    type: ItemType.BONUS_CARD,
    description: 'Tăng 20% tiền thắng trong 24 giờ',
    imageUrl: '/assets/image/items/theloc20.jpg',
    bonusPercent: 20,
    expiresIn: 86400000,
    stock: 30
  },
  {
    id: 'bonus_50',
    name: 'Thẻ Lộc VIP +50%',
    price: 30000000,
    type: ItemType.BONUS_CARD,
    description: 'Tăng 50% tiền thắng trong 48 giờ',
    imageUrl: '/assets/image/items/thelocvip50.jpg',
    bonusPercent: 50,
    expiresIn: 172800000,
    stock: 10
  },

  // ⭐ ========== VẬT PHẨM TẾT - ẢNH THẬT + GIÁ PHÙ HỢP ==========

  // 1. PHÁO HOA - 1 triệu
  {
    id: 'tet_phao_hoa',
    name: 'Pháo Hoa Tết',
    price: 1000000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Click để nổ pháo hoa! Nhận tiền ngẫu nhiên mỗi lần nổ',
    imageUrl: '/assets/image/items/phaohoa.jpg',
    tetAction: TetItemAction.FIREWORK,
    minReward: 100000,
    maxReward: 800000,
    maxUses: 10,
    cooldown: 300000,
    stock: 999
  },

  // 2. CÂY MAI - 500k
  {
    id: 'tet_cay_mai',
    name: 'Cây Mai Vàng',
    price: 500000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Đặt trên Dashboard. Click hái hoa mai nhận tiền!',
    imageUrl: '/assets/image/items/caymai.jpg',
    tetAction: TetItemAction.TREE,
    minReward: 50000,
    maxReward: 300000,
    maxUses: -1,
    cooldown: 3600000,
    stock: 999
  },

  // 3. CÂY ĐÀO - 700k
  {
    id: 'tet_cay_dao',
    name: 'Cây Đào Phú Quý',
    price: 700000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Đặt trên Dashboard. Click hái hoa đào nhận tiền!',
    imageUrl: '/assets/image/items/caydao.jpg',
    tetAction: TetItemAction.TREE,
    minReward: 80000,
    maxReward: 400000,
    maxUses: -1,
    cooldown: 3600000,
    stock: 999
  },

  // 4. BÁNH CHƯNG - 500k
  {
    id: 'tet_banh_chung',
    name: 'Bánh Chưng Tết',
    price: 500000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Mở bánh chưng nhận bonus tiền ngẫu nhiên!',
    imageUrl: '/assets/image/items/banhchung.jpg',
    tetAction: TetItemAction.FOOD,
    minReward: 300000,
    maxReward: 1200000,
    maxUses: 5,
    cooldown: 0,
    stock: 999
  },

  // 5. LỒNG ĐÈN - 500k
  {
    id: 'tet_long_den',
    name: '🏮 Lồng Đèn Tết',
    price: 500000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Treo trên Dashboard. Click sáng lên nhận tiền!',
    imageUrl: '/assets/image/items/longden.jpg',
    tetAction: TetItemAction.LANTERN,
    minReward: 60000,
    maxReward: 350000,
    maxUses: -1,
    cooldown: 1800000,
    stock: 999
  },

  // 6. BÀO LÌ XÌ - Trang trí (nếu có ảnh)
  {
    id: 'tet_li_xi',
    name: 'Bao Lì Xì',
    price: 1000000,
    type: ItemType.TET_INTERACTIVE,
    description: 'Trang trí Profile. Không có tương tác',
    imageUrl: '/assets/image/items/lixi.jpg',
    tetAction: TetItemAction.DECORATION,
    maxUses: -1,
    stock: 999
  }
];

// ⭐ Avatar & Background mặc định
export const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNq2dnEsfUtG9oo4bSvx2TNBGlfrOm1olCPQ&s';
export const DEFAULT_BACKGROUND = '/assets/image/background/bg1.png';