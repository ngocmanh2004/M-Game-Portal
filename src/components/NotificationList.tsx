import React from 'react';
import { Bell, X, Inbox } from 'lucide-react';
import { UserNotification, AdminNotification } from '../types';
import { NotificationCard } from './NotificationCard';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { Notification } from './Notification';
import { useAuth } from '../hooks/useAuth';

interface NotificationListProps {
  notifications: (UserNotification & { details: AdminNotification })[];
  onClose: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, onClose }) => {
  const { user } = useAuth();
  const { markAsRead, claimGift, deleteNotification, lastResult, closeResult } =
    useUserNotifications(user?.uid);

  const sorted = [...notifications].sort((a, b) => {
    if (a.read === b.read) return b.createdAt - a.createdAt;
    return a.read ? 1 : -1;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-auto rounded-2xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #13131f 0%, #0e0e1c 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none rounded-t-2xl"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(234,179,8,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 4px 15px rgba(234,179,8,0.3)',
              }}
            >
              <Bell className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Thông Báo</h2>
              {unreadCount > 0 ? (
                <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
                  {unreadCount} chưa đọc
                </p>
              ) : (
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">
                  Tất cả đã đọc
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-gray-500 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto p-4 space-y-2.5 custom-notif-scroll">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Inbox className="w-7 h-7 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-white/50 font-semibold text-sm">Hộp thư trống</p>
                <p className="text-white/25 text-xs mt-1">Chưa có thông báo nào</p>
              </div>
            </div>
          ) : (
            sorted.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
                onClaimGift={claimGift}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-6 py-3 border-t border-white/[0.05] text-center">
            <p className="text-white/25 text-[10px] font-medium">
              Nhấn vào thông báo để đánh dấu đã đọc
            </p>
          </div>
        )}

        {lastResult && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeResult} />
            <div className="relative">
              <Notification
                message={lastResult.message}
                type={lastResult.type}
                onClose={closeResult}
              />
            </div>
          </div>
        )}

        <style>{`
          .custom-notif-scroll::-webkit-scrollbar { width: 4px; }
          .custom-notif-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-notif-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
          .custom-notif-scroll::-webkit-scrollbar-thumb:hover { background: rgba(234,179,8,0.3); }
        `}</style>
      </div>
    </div>
  );
};