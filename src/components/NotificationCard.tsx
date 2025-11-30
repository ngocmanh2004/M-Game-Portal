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
      className={`relative bg-gradient-to-br from-yellow-900/80 to-red-900/80 rounded-xl border-2 p-4 mb-3 shadow-lg transition-all
        ${!notification.read ? 'border-yellow-400' : notification.claimed ? 'border-green-400 opacity-90' : 'border-white/20 opacity-80'}
      `}
      onClick={handleMarkRead}
    >
      {/* Nút xóa */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute top-2 right-2 text-red-400 hover:text-red-200 bg-white/10 rounded-full p-1 transition-all"
        title="Xóa thông báo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Icon */}
      <div className="absolute left-3 top-3 text-2xl select-none pointer-events-none">
        {notification.details.type === NotificationType.GIFT && '🎁'}
        {notification.details.type === NotificationType.EVENT && '🎊'}
        {notification.details.type === NotificationType.SYSTEM && '🔔'}
        {notification.details.type === NotificationType.WARNING && '⚠️'}
        {notification.details.type === NotificationType.UPDATE && '🔄'}
      </div>

      {/* Title & Content */}
      <div className="pl-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-yellow-300 text-base">{notification.details.title}</span>
          {!notification.read && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-xs text-red-900 rounded-full font-bold animate-pulse">Mới</span>
          )}
          {notification.claimed && (
            <span className="ml-2 px-2 py-0.5 bg-green-400 text-xs text-white rounded-full font-bold">Đã nhận</span>
          )}
        </div>
        <div className="text-white/90 text-sm mt-1">{notification.details.message}</div>
        {notification.details.imageUrl && (
          <img src={notification.details.imageUrl} alt="img" className="w-full max-w-xs rounded-lg mt-2" />
        )}

        {/* Gift */}
        {notification.details.giftMoney && (
          <div className="mt-2 text-yellow-300 text-sm font-bold">💰 Tiền thưởng: {notification.details.giftMoney.toLocaleString()}đ</div>
        )}
        {renderGiftItems()}

        {/* Claim button */}
        {((notification.details.giftMoney || (notification.details.giftItems && notification.details.giftItems.length > 0))) && (
          <div className="mt-3">
            {notification.claimed ? (
              <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full font-bold text-xs">Đã nhận quà</span>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); handleClaim(); }}
                disabled={claiming}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-red-900 font-bold rounded-lg shadow hover:scale-105 active:scale-95 transition-all"
              >
                {claiming ? 'Đang nhận...' : '🎁 Nhận quà'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};