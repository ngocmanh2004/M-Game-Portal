export interface AdminUser {
  uid: string;
  email: string;
  money: number;
  avatar?: string;
  background?: string;
  isAdmin: boolean;
  isLocked?: boolean;
  createdAt: number;
  lastLogin: number;
  lastCheckin?: string;
  tasks?: {
    followTiktok: boolean;
    subscribeYoutube: boolean;
  };
}

export interface UserFilter {
  type: 'all' | 'admins' | 'locked' | 'active';
  sortBy: 'money_desc' | 'money_asc' | 'lastLogin' | 'newest' | 'oldest';
}

export interface AdminStats {
  totalUsers: number;
  totalMoney: number;
  activeUsers: number;
  lockedUsers: number;
}

export interface SwipeAction {
  id: 'edit' | 'lock' | 'delete';
  label: string;
  color: string;
  icon: string;
}