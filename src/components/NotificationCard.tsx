import React, { useState } from 'react';
import { AdminNotification, UserNotification, NotificationType } from '../types';
import { SHOP_ITEMS } from '../constants';

interface NotificationCardProps {
  notification: UserNotification & { details: AdminNotification };
  onMarkRead: (userNotificationId: string, notificationId: string) => void;
  onClaimGift: (userNotificationId: string, details: AdminNotification) => Promise<{ success: boolean; message: string }>; // ⭐ Sửa kiểu trả về
  onDelete: (userNotificationId: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onClaimGift,
  onDelete
}) => {
  const [claiming, setClaiming] = useState(false);

  const handleMarkRead = () => {
    if (!notification.read) {
      onMarkRead(notification.id, notification.details.id);
    }
  };

  const handleClaim = async () => {
    console.log('Click nhận quà', notification.id);
    setClaiming(true);
    await onClaimGift(notification.id, notification.details);
    setClaiming(false);
  };

  // Hiển thị vật phẩm tặng kèm
  const renderGiftItems = () => {
    if (!notification.details.giftItems) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {notification.details.giftItems.map((gift, idx) => {
          const item = SHOP_ITEMS.find(i => i.id === gift.itemId);
          return (
            <div key={idx} className="flex items-center gap-1 bg-yellow-100/20 px-2 py-1 rounded text-xs text-yellow-300 border border-yellow-400/30">
              {item?.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-5 h-5 rounded" />}
              <span>{item?.name || gift.itemId} x{gift.quantity}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`relative group bg-white/5 hover:bg-white/10 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-xl border border-white/5 active:scale-[0.98] cursor-pointer
        ${!notification.read ? 'before:content-[""] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-yellow-400 before:rounded-r-full before:shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
        ${notification.claimed ? 'opacity-60 saturate-50' : ''}
      `}
      onClick={handleMarkRead}
    >
      {/* Nút xóa */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute top-4 right-4 text-white/20 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 border border-white/5"
        title="Xóa thông báo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-4 sm:gap-5">
        {/* Icon Column */}
        <div className="shrink-0 pt-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/5 ${notification.details.type === NotificationType.GIFT ? 'bg-orange-500/20 text-orange-400' :
            notification.details.type === NotificationType.SYSTEM ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-300'
            }`}>
            {notification.details.type === NotificationType.GIFT && '🎁'}
            {notification.details.type === NotificationType.EVENT && '🎊'}
            {notification.details.type === NotificationType.SYSTEM && '🔔'}
            {notification.details.type === NotificationType.WARNING && '⚠️'}
            {notification.details.type === NotificationType.UPDATE && '🔄'}
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className={`font-black tracking-wide ${notification.read ? 'text-white/60' : 'text-white'}`}>
              {notification.details.title}
            </h3>
            {!notification.read && (
              <span className="px-2 py-0.5 bg-yellow-400 text-[10px] text-black rounded-lg font-bold uppercase tracking-wider shadow-sm shadow-yellow-400/20">Mới</span>
            )}
            {notification.claimed && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-lg font-bold uppercase tracking-wider border border-green-500/30">Đã nhận</span>
            )}
          </div>

          <p className={`text-sm leading-relaxed ${notification.read ? 'text-white/40' : 'text-white/70'}`}>
            {notification.details.message}
          </p>

          {notification.details.imageUrl && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all shadow-lg shadow-black/40 max-w-[240px]">
              <img
                src={notification.details.imageUrl}
                alt="img"
                className="w-full h-auto max-h-[160px] object-cover transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Money & Items */}
          <div className="mt-4 flex flex-col gap-2">
            {notification.details.giftMoney && (
              <div className="flex items-center gap-2 text-yellow-500 font-black text-sm drop-shadow-md">
                <span className="text-base">💰</span>
                <span>Tiền thưởng: +{notification.details.giftMoney.toLocaleString()}đ</span>
              </div>
            )}
            {renderGiftItems()}
          </div>

          {/* Claim button */}
          {(notification.details.giftMoney || (notification.details.giftItems && notification.details.giftItems.length > 0)) && (
            <div className="mt-5">
              {notification.claimed ? (
                <div className="flex items-center gap-2 text-green-500/60 text-xs font-bold bg-green-500/5 py-2 px-4 rounded-xl border border-green-500/10 w-fit">
                  <span>✓ Đã nằm trong túi đồ</span>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); handleClaim(); }}
                  disabled={claiming}
                  className="relative overflow-hidden group/btn flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black rounded-2xl shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:grayscale"
                >
                  <span className="text-xl group-hover/btn:rotate-12 transition-transform">{claiming ? '⏳' : '🎁'}</span>
                  <span>{claiming ? 'Đang nhận quà...' : 'NHẬN QUÀ NGAY'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};