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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-xl mx-auto bg-[#1a0f0a]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 max-h-[85vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Thông Báo</h2>
              <p className="text-white/40 text-[10px] sm:text-xs uppercase font-bold tracking-widest mt-0.5">Hộp thư cá nhân</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all flex items-center justify-center border border-white/10 hover:border-red-500/30 group"
            title="Đóng"
          >
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Danh sách thông báo */}
        <div className="relative flex-1 overflow-y-auto custom-scrollbar p-6 pt-4 space-y-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-4 border border-white/5">
                📭
              </div>
              <p className="text-white/60 font-bold">Hộp thư trống</p>
              <p className="text-white/30 text-sm mt-1">Đừng lo, các tin tức mới sẽ sớm xuất hiện!</p>
            </div>
          ) : (
            <div className="grid gap-4">
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
        </div>

        {/* Footer Info (Optional) */}
        {notifications.length > 0 && (
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-white/30 text-[10px] font-medium italic">Bấm vào từng dòng để xem chi tiết và nhận quà</p>
          </div>
        )}

        {/* Popup kết quả nhận quà */}
        {lastResult && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeResult}></div>
            <div className="relative animate-bounce-in">
              <Notification
                message={lastResult.message}
                type={lastResult.type}
                onClose={closeResult}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};