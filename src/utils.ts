import { User } from './types';

const STORAGE_KEY = 'game_users';
const CURRENT_USER_KEY = 'current_user';

// Tài khoản admin mặc định
const ADMIN_ACCOUNT = {
  username: 'admin',
  password: 'Manhdz123',
  balance: 1000000000000000 // 1 triệu tỷ
};

export const getStoredUsers = (): Record<string, { password: string; balance: number }> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : {};
  
  // Luôn đảm bảo admin tồn tại với số tiền 1 triệu tỷ
  if (!users[ADMIN_ACCOUNT.username]) {
    users[ADMIN_ACCOUNT.username] = {
      password: ADMIN_ACCOUNT.password,
      balance: ADMIN_ACCOUNT.balance
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } else {
    // Cập nhật số tiền admin về 1 triệu tỷ mỗi lần load
    users[ADMIN_ACCOUNT.username].balance = ADMIN_ACCOUNT.balance;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  
  return users;
};

export const saveUserToDB = (username: string, data: { password: string; balance: number }) => {
  const users = getStoredUsers();
  users[username] = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const loginUser = (username: string): User => {
  const users = getStoredUsers();
  const user = users[username];
  
  const currentUser: User = {
    username,
    balance: user.balance
  };
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  return currentUser;
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  
  const user = JSON.parse(stored);
  
  // Nếu là admin, luôn set lại balance về 1 triệu tỷ
  if (user.username === ADMIN_ACCOUNT.username) {
    user.balance = ADMIN_ACCOUNT.balance;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    // Cập nhật luôn trong DB
    const users = getStoredUsers();
    users[ADMIN_ACCOUNT.username].balance = ADMIN_ACCOUNT.balance;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  
  return user;
};

export const updateUserBalance = (username: string, newBalance: number) => {
  const users = getStoredUsers();
  
  // Nếu là admin, không cho phép giảm số tiền xuống dưới 1 triệu tỷ
  if (username === ADMIN_ACCOUNT.username && newBalance < ADMIN_ACCOUNT.balance) {
    newBalance = ADMIN_ACCOUNT.balance;
  }
  
  if (users[username]) {
    users[username].balance = newBalance;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    
    // Update current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === username) {
      currentUser.balance = newBalance;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  }
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ⭐ FORMAT SỐ TIỀN: 500K, 2M, 10M...
export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1).replace('.0', '')}K`;
  }
  return `${amount}đ`;
};

export const formatPrice = (amount: number): string => {
  if (amount === 0) return 'FREE';
  if (amount >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}M`;
  }
  if (amount >= 10_000) {
    const v = amount / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}K`;
  }
  return amount.toLocaleString('vi-VN');
};


// Hàm reset tài khoản admin (gọi khi cần)
export const resetAdminAccount = () => {
  const users = getStoredUsers();
  users[ADMIN_ACCOUNT.username] = {
    password: ADMIN_ACCOUNT.password,
    balance: ADMIN_ACCOUNT.balance
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.username === ADMIN_ACCOUNT.username) {
    currentUser.balance = ADMIN_ACCOUNT.balance;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }
};
