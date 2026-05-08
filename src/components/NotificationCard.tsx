import React, { useState } from 'react';
import { Gift, Zap, Bell, AlertTriangle, RefreshCw, Coins, X, Check, Loader2 } from 'lucide-react';
import { AdminNotification, UserNotification, NotificationType } from '../types';
import { SHOP_ITEMS } from '../constants';

interface NotificationCardProps {
  notification: UserNotification & { details: AdminNotification };
  onMarkRead: (userNotificationId: string, notificationId: string) => void;
  onClaimGift: (userNotificationId: string, details: AdminNotification) => Promise<{ success: boolean; message: string }>;
  onDelete: (userNotificationId: string) => void;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; bg: string; iconColor: string; accentColor: string }
> = {
  [NotificationType.GIFT]: {
    icon: <Gift className="w-5 h-5" />,
    bg: 'rgba(249,115,22,0.15)',
    iconColor: '#fb923c',
    accentColor: 'rgba(249,115,22,0.6)',
  },
  [NotificationType.EVENT]: {
    icon: <Zap className="w-5 h-5" />,
    bg: 'rgba(168,85,247,0.15)',
    iconColor: '#c084fc',
    accentColor: 'rgba(168,85,247,0.6)',
  },
  [NotificationType.SYSTEM]: {
    icon: <Bell className="w-5 h-5" />,
    bg: 'rgba(59,130,246,0.15)',
    iconColor: '#60a5fa',
    accentColor: 'rgba(59,130,246,0.6)',
  },
  [NotificationType.WARNING]: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'rgba(239,68,68,0.15)',
    iconColor: '#f87171',
    accentColor: 'rgba(239,68,68,0.6)',
  },
  [NotificationType.UPDATE]: {
    icon: <RefreshCw className="w-5 h-5" />,
    bg: 'rgba(20,184,166,0.15)',
    iconColor: '#2dd4bf',
    accentColor: 'rgba(20,184,166,0.6)',
  },
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onClaimGift,
  onDelete,
}) => {
  const [claiming, setClaiming] = useState(false);

  const handleMarkRead = () => {
    if (!notification.read) {
      onMarkRead(notification.id, notification.details.id);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    await onClaimGift(notification.id, notification.details);
    setClaiming(false);
  };

  const tc = typeConfig[notification.details.type] ?? typeConfig[NotificationType.SYSTEM];
  const hasGift =
    notification.details.giftMoney ||
    (notification.details.giftItems && notification.details.giftItems.length > 0);

  const renderGiftItems = () => {
    if (!notification.details.giftItems) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {notification.details.giftItems.map((gift, idx) => {
          const item = SHOP_ITEMS.find((i) => i.id === gift.itemId);
          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.25)',
                color: '#fbbf24',
              }}
            >
              {item?.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-4 h-4 rounded object-cover" />
              )}
              <span>{item?.name || gift.itemId} ×{gift.quantity}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`relative group cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-200 overflow-hidden ${notification.claimed ? 'opacity-50' : ''}`}
      style={{
        background: notification.read
          ? 'rgba(255,255,255,0.03)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
        border: notification.read
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(255,255,255,0.12)',
        boxShadow: notification.read ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onClick={handleMarkRead}
    >
      {!notification.read && (
        <span
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
          style={{ background: tc.accentColor, boxShadow: `0 0 8px ${tc.accentColor}` }}
        />
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
          (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)';
        }}
        title="Xóa thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex gap-4">
        <div
          className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: tc.bg, color: tc.iconColor, border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {tc.icon}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <h3
              className="font-bold text-sm"
              style={{ color: notification.read ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.95)' }}
            >
              {notification.details.title}
            </h3>
            {!notification.read && (
              <span
                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded"
                style={{ background: '#f59e0b', color: '#000' }}
              >
                Mới
              </span>
            )}
            {notification.claimed && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                <Check className="w-2.5 h-2.5" />
                Đã nhận
              </span>
            )}
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{ color: notification.read ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)' }}
          >
            {notification.details.message}
          </p>

          {notification.details.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden max-w-[200px]" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <img
                src={notification.details.imageUrl}
                alt="img"
                className="w-full h-auto max-h-[140px] object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {notification.details.giftMoney && (
            <div className="flex items-center gap-2 mt-3 font-bold text-sm" style={{ color: '#fbbf24' }}>
              <Coins className="w-4 h-4" />
              <span>+{notification.details.giftMoney.toLocaleString()}đ</span>
            </div>
          )}

          {renderGiftItems()}

          {hasGift && (
            <div className="mt-4">
              {notification.claimed ? (
                <div
                  className="flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-xl w-fit"
                  style={{
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    color: 'rgba(52,211,153,0.6)',
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Đã vào túi đồ
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleClaim(); }}
                  disabled={claiming}
                  className="flex items-center gap-2.5 px-5 py-2.5 font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#000',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
                  }}
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Gift className="w-4 h-4" />
                  )}
                  {claiming ? 'Đang nhận...' : 'Nhận quà'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};