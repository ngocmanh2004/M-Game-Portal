import React from 'react';
import { UserNotification, AdminNotification } from '../types';
import { NotificationCard } from './NotificationCard';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { Notification } from './Notification';
import { useAuth } from '../hooks/useAuth'; // Nếu bạn có hook này

interface NotificationListProps {
  notifications: (UserNotification & { details: AdminNotification })[];
  onClose: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onClose
}) => {
  const { user } = useAuth(); // Lấy user đang đăng nhập
  const {
    markAsRead,
    claimGift,
    deleteNotification,
    lastResult,
    closeResult
  } = useUserNotifications(user?.uid); // ⭐ Truyền đúng UID vào đây

  // Sắp xếp: chưa đọc lên đầu
  const sorted = [...notifications].sort((a, b) => {
    if (a.read === b.read) return b.createdAt - a.createdAt;
    return a.read ? 1 : -1;
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-lg mx-auto bg-gradient-to-br from-yellow-900/90 to-red-900/90 rounded-2xl shadow-2xl border-4 border-yellow-400 max-h-[90vh] overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-yellow-300">🔔 Thông Báo</h2>
          <button
            onClick={onClose}
            className="text-2xl text-red-400 hover:scale-110 transition-transform"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Danh sách thông báo */}
        {sorted.length === 0 ? (
          <div className="text-white/70 text-center py-10">Không có thông báo nào.</div>
        ) : (
          <div>
            {sorted.map(n => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
                onClaimGift={claimGift}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}

        {/* Popup kết quả nhận quà */}
        {lastResult && (
          <Notification
            message={lastResult.message}
            type={lastResult.type}
            onClose={closeResult}
          />
        )}
      </div>
    </div>
  );
};