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
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 sticky top-0 z-50 shadow-2xl">
        <h1 className="text-white font-bold text-2xl text-center mb-3">
          👑 ADMIN PANEL
        </h1>
        
        {/* ⭐ TABS */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-yellow-400 text-red-900'
                : 'bg-white/20 text-white'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'notifications'
                ? 'bg-yellow-400 text-red-900'
                : 'bg-white/20 text-white'
            }`}
          >
            📢 Thông báo
          </button>
        </div>

        {/* Search chỉ hiện ở tab Users */}
        {activeTab === 'users' && (
          <MobileSearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Tìm email, UID..."
          />
        )}
      </div>

      {/* ========== USERS TAB ========== */}
      {activeTab === 'users' && (
        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-500 rounded-xl p-3 text-white">
              <p className="text-xs opacity-80">👥 Tổng User</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-orange-500 rounded-xl p-3 text-white">
              <p className="text-xs opacity-80">💰 Tổng Tiền</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalMoney)}</p>
            </div>
            <div className="bg-green-500 rounded-xl p-3 text-white">
              <p className="text-xs opacity-80">✅ Hoạt động</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
            <div className="bg-red-500 rounded-xl p-3 text-white">
              <p className="text-xs opacity-80">🔒 Bị khóa</p>
              <p className="text-2xl font-bold">{stats.lockedUsers}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => handleFilterChange({ type: 'all' })}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${
                selectedFilter.type === 'all'
                  ? 'bg-yellow-400 text-red-900'
                  : 'bg-white/20 text-white'
              }`}
            >
              🔔 Tất cả
            </button>
            <button
              onClick={() => handleFilterChange({ type: 'admins' })}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${
                selectedFilter.type === 'admins'
                  ? 'bg-yellow-400 text-red-900'
                  : 'bg-white/20 text-white'
              }`}
            >
              👑 Admin
            </button>
            <button
              onClick={() => handleFilterChange({ type: 'locked' })}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${
                selectedFilter.type === 'locked'
                  ? 'bg-yellow-400 text-red-900'
                  : 'bg-white/20 text-white'
              }`}
            >
              🔒 Đã khóa
            </button>
            <button
              onClick={() => handleFilterChange({ type: 'active' })}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${
                selectedFilter.type === 'active'
                  ? 'bg-yellow-400 text-red-900'
                  : 'bg-white/20 text-white'
              }`}
            >
              ✅ Active 7d
            </button>
          </div>

          {/* Sort */}
          <select
            value={selectedFilter.sortBy}
            onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
            className="w-full bg-white/10 text-white rounded-xl p-3 mb-4 border border-white/20 font-bold"
          >
            <option value="money_desc">💰 Tiền: Cao → Thấp</option>
            <option value="money_asc">💰 Tiền: Thấp → Cao</option>
            <option value="lastLogin">🕒 Login gần nhất</option>
            <option value="newest">🆕 Mới nhất</option>
            <option value="oldest">📅 Cũ nhất</option>
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

          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <EmptyState message="Không tìm thấy user nào" />
          )}
        </div>
      )}

      {/* ========== NOTIFICATIONS TAB ========== */}
      {activeTab === 'notifications' && (
        <div className="p-4">
          <button
            onClick={() => setShowNotificationForm(true)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl mb-4 shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            ➕ Tạo thông báo mới
          </button>

          <div className="space-y-3">
            {adminNotifications.map((notif) => (
              <div key={notif.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
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
                    className="text-red-400 hover:text-red-300 text-xl"
                  >
                    🗑️
                  </button>
                </div>
                <p className="text-white/70 text-sm mb-2">{notif.message}</p>
                <div className="flex flex-wrap gap-2 text-xs text-white/50">
                  <span>👥 {notif.targetType === 'all' ? 'Tất cả' : 'Cụ thể'}</span>
                  {notif.giftMoney && <span>💰 {notif.giftMoney.toLocaleString()}đ</span>}
                  {notif.giftItems && <span>🎁 {notif.giftItems.length} vật phẩm</span>}
                  <span>✅ {notif.claimedBy?.length || 0} đã nhận</span>
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

      {/* ⭐ NOTIFICATION FORM MODAL */}
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

      {/* Refresh Button */}
      <button
        onClick={() => activeTab === 'users' ? getAllUsers() : loadNotifications()}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-2xl active:scale-95 transition-all z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};