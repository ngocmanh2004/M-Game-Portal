import React, { useState } from 'react';
import { AdminUser } from '../../types/admin.types';
import { formatCurrency } from '../../utils';

interface UserCardProps {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onLock: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onLock,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3 cursor-pointer active:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
            alt={user.email}
            className="w-14 h-14 rounded-full border-2 border-yellow-400 object-cover"
          />
          {user.isAdmin && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
              <span className="text-xs">👑</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate text-sm">
            {user.email}
          </p>
          <p className="text-yellow-400 font-bold text-lg">
            {formatCurrency(user.money)}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-1">
          {user.isAdmin && (
            <span className="bg-yellow-400 text-red-900 px-2 py-0.5 rounded-full text-xs font-bold">
              Admin
            </span>
          )}
          {user.isLocked && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              Khóa
            </span>
          )}
        </div>

        {/* Expand Icon */}
        <div className="text-white/50">
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/10 animate-slide-down">
          {/* User Info */}
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-white/80">
              <span>UID:</span>
              <span className="font-mono text-xs">{user.uid}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Đăng ký:</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Đăng nhập:</span>
              <span>{formatDate(user.lastLogin)}</span>
            </div>
            {user.lastCheckin && (
              <div className="flex justify-between text-white/80">
                <span>Điểm danh:</span>
                <span>{user.lastCheckin}</span>
              </div>
            )}
            <div className="flex justify-between text-white/80">
              <span>Nhiệm vụ:</span>
              <span>
                TikTok: {user.tasks?.followTiktok ? '✅' : '❌'} | 
                YouTube: {user.tasks?.subscribeYoutube ? '✅' : '❌'}
              </span>
            </div>
          </div>

          {/* ⭐ ACTION BUTTONS - HIỂN THỊ RÕ RÀNG */}
          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1"
            >
              <span className="text-xl">✏️</span>
              <span className="text-xs">Sửa</span>
            </button>

            {/* Lock/Unlock Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLock(user);
              }}
              className={`${
                user.isLocked 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600'
              } text-white font-bold py-3 rounded-lg active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1`}
            >
              <span className="text-xl">{user.isLocked ? '🔓' : '🔒'}</span>
              <span className="text-xs">{user.isLocked ? 'Mở khóa' : 'Khóa'}</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-lg active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1"
            >
              <span className="text-xl">🗑️</span>
              <span className="text-xs">Xóa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};