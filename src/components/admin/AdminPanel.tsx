import React, { useState, useEffect } from 'react';
import { useAdminOperations } from '../../hooks/useAdminOperations';
import { useAuth } from '../../hooks/useAuth';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { AdminUser, UserFilter } from '../../types/admin.types';
import { AdminNotification, NotificationType } from '../../types';
import { MobileSearchBar } from './MobileSearchBar';
import { UserCard } from './UserCard';
import { UserEditSheet } from './UserEditSheet';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { NotificationForm } from './NotificationForm';
import { formatCurrency } from '../../utils';

interface AdminPanelProps {
  onShowNotification: (msg: string, type: 'win' | 'loss') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onShowNotification }) => {
  const { user } = useAuth();
  const {
    filteredUsers,
    loading,
    stats,
    getAllUsers,
    searchUsers,
    filterUsers,
    updateUserMoney,
    toggleAdminStatus,
    lockUnlockAccount,
    deleteUser
  } = useAdminOperations();

  const { getNotifications, deleteNotification } = useAdminNotifications();

  // ⭐ THÊM STATES
  const [activeTab, setActiveTab] = useState<'users' | 'notifications'>('users');
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<UserFilter>({
    type: 'all',
    sortBy: 'money_desc'
  });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  // ⭐ Load users khi mount
  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  // ⭐ Load notifications khi chuyển tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);

  const loadNotifications = async () => {
    const notifs = await getNotifications(50);
    setAdminNotifications(notifs);
  };

  // ⭐ HANDLE SEARCH
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  // ⭐ HANDLE FILTER
  const handleFilterChange = (newFilter: Partial<UserFilter>) => {
    const updatedFilter = { ...selectedFilter, ...newFilter };
    setSelectedFilter(updatedFilter);
    filterUsers(updatedFilter);
  };

  // ⭐ HANDLE EDIT
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsEditSheetOpen(true);
  };

  // ⭐ HANDLE SAVE EDIT
  const handleSaveEdit = async (
    userId: string,
    updates: { money: number; isAdmin: boolean; isLocked: boolean }
  ): Promise<boolean> => {
    try {
      await updateUserMoney(userId, updates.money);
      await toggleAdminStatus(userId, updates.isAdmin);
      await lockUnlockAccount(userId, updates.isLocked);

      onShowNotification('✅ Cập nhật thành công!', 'win');
      await getAllUsers();
      return true;
    } catch (error) {
      onShowNotification('❌ Có lỗi xảy ra!', 'loss');
      return false;
    }
  };

  // ⭐ HANDLE LOCK/UNLOCK
  const handleLock = async (user: AdminUser) => {
    const action = user.isLocked ? 'mở khóa' : 'khóa';
    const confirm = window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.email}?`);

    if (!confirm) return;

    const success = await lockUnlockAccount(user.uid, !user.isLocked);

    if (success) {
      onShowNotification(`✅ Đã ${action} tài khoản!`, 'win');
      await getAllUsers();
    } else {
      onShowNotification('❌ Có lỗi xảy ra!', 'loss');
    }
  };

  // ⭐ HANDLE DELETE
  const handleDelete = async (user: AdminUser) => {
    const confirm = window.confirm(
      `⚠️ XÓA TÀI KHOẢN?\n\nEmail: ${user.email}\nSố dư: ${formatCurrency(user.money)}\n\nHành động này KHÔNG THỂ HOÀN TÁC!`
    );

    if (!confirm) return;

    const doubleConfirm = window.confirm('Bạn có CHẮC CHẮN muốn xóa?');
    if (!doubleConfirm) return;

    const success = await deleteUser(user.uid);

    if (success) {
      onShowNotification('✅ Đã xóa tài khoản!', 'win');
      await getAllUsers();
    } else {
      onShowNotification('❌ Có lỗi xảy ra!', 'loss');
    }
  };

  // ⭐ HANDLE DELETE NOTIFICATION
  const handleDeleteNotification = async (notifId: string) => {
    if (!window.confirm('Xóa thông báo này?')) return;

    const success = await deleteNotification(notifId);
    if (success) {
      onShowNotification('✅ Đã xóa!', 'win');
      loadNotifications();
    } else {
      onShowNotification('❌ Có lỗi!', 'loss');
    }
  };

  // ⭐ LOADING STATE
  if (loading && filteredUsers.length === 0 && activeTab === 'users') {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen pb-24 w-full max-w-5xl mx-auto px-4 sm:px-6 animate-fade-in-up">

      {/* ADMIN HEADER */}
      <div className="bg-black/60 rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden my-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10"></div>
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Quản lý hệ thống game và người dùng</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng User', value: stats.totalUsers, color: 'from-blue-500 to-cyan-500' },
          { label: 'Tổng Tiền', value: formatCurrency(stats.totalMoney), color: 'from-yellow-500 to-orange-500', small: true },
          { label: 'Hoạt động', value: stats.activeUsers, color: 'from-green-500 to-emerald-500' },
          { label: 'Bị khóa', value: stats.lockedUsers, color: 'from-red-500 to-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-black/50 rounded-2xl p-5 border border-white/10 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:border-white/20">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color} ${(stat as any).small ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* TAB NAV */}
      <div className="flex gap-2 p-1 bg-black/50 rounded-xl border border-white/10 mb-5 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'users'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
          Người Dùng
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'notifications'
            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
          Thông Báo
        </button>
      </div>

      {/* ========== USERS TAB ========== */}
      {activeTab === 'users' && (
        <div>
          {/* Search */}
          <MobileSearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Tìm email, UID..."
          />

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 my-4 scrollbar-hide">
            {[
              { type: 'all', label: 'Tất cả' },
              { type: 'admins', label: 'Admin' },
              { type: 'locked', label: 'Đã khóa' },
              { type: 'active', label: 'Active 7d' },
            ].map((f) => (
              <button
                key={f.type}
                onClick={() => handleFilterChange({ type: f.type as any })}
                className={`px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${selectedFilter.type === f.type
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={selectedFilter.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
            className="w-full sm:w-auto bg-black/40 text-white rounded-xl px-4 py-2.5 mb-5 border border-white/10 font-medium text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="money_desc">Tiền: Cao → Thấp</option>
            <option value="money_asc">Tiền: Thấp → Cao</option>
            <option value="lastLogin">Login gần nhất</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          {/* User List */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.uid}
                user={user}
                onEdit={handleEdit}
                onLock={handleLock}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {filteredUsers.length === 0 && !loading && (
            <EmptyState message="Không tìm thấy user nào" />
          )}
        </div>
      )}

      {/* ========== NOTIFICATIONS TAB ========== */}
      {activeTab === 'notifications' && (
        <div>
          <button
            onClick={() => setShowNotificationForm(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3.5 rounded-2xl mb-5 shadow-[0_5px_15px_rgba(168,85,247,0.3)] hover:scale-[1.01] active:scale-95 transition-all"
          >
            Tạo Thông Báo Mới
          </button>

          <div className="space-y-3">
            {adminNotifications.map((notif) => (
              <div key={notif.id} className="bg-black/40 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className="text-2xl mr-2">
                      {notif.type === NotificationType.GIFT && '🎁'}
                      {notif.type === NotificationType.EVENT && '🎊'}
                      {notif.type === NotificationType.SYSTEM && '🔔'}
                      {notif.type === NotificationType.WARNING && '⚠️'}
                      {notif.type === NotificationType.UPDATE && '🔄'}
                    </span>
                    <span className="text-white font-bold">{notif.title}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-3">{notif.message}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="bg-white/5 px-2.5 py-1 rounded-lg">{notif.targetType === 'all' ? 'Tất cả' : 'Cụ thể'}</span>
                  {notif.giftMoney && <span className="bg-white/5 px-2.5 py-1 rounded-lg">{notif.giftMoney.toLocaleString()}đ</span>}
                  {notif.giftItems && <span className="bg-white/5 px-2.5 py-1 rounded-lg">{notif.giftItems.length} vật phẩm</span>}
                  <span className="bg-white/5 px-2.5 py-1 rounded-lg">{notif.claimedBy?.length || 0} đã nhận</span>
                </div>
              </div>
            ))}
            {adminNotifications.length === 0 && (
              <EmptyState message="Chưa có thông báo nào" />
            )}
          </div>
        </div>
      )}

      {/* Edit Sheet */}
      <UserEditSheet
        user={editingUser}
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Notification Form Modal */}
      {showNotificationForm && (
        <NotificationForm
          adminUserId={user?.uid || ''}
          onSuccess={() => {
            setShowNotificationForm(false);
            loadNotifications();
          }}
          onCancel={() => setShowNotificationForm(false)}
        />
      )}

      {/* Refresh FAB */}
      <button
        onClick={() => activeTab === 'users' ? getAllUsers() : loadNotifications()}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-2xl shadow-[0_5px_20px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};
