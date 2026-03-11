import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils';
import { DEFAULT_AVATAR, DEFAULT_BACKGROUND } from '../constants';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useFriends } from '../hooks/useFriends';
import { AvatarUpload } from './shared/AvatarUpload';

interface ProfileProps {
  userId?: string;
  onClose?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ userId, onClose }) => {
  const { user } = useAuth();
  const isMe = !userId || userId === user?.uid;
  const { userData, loading, updateNickname } = useUserData(userId || user?.uid);
  const { leaderboard } = useLeaderboard(100);
  const { friends, sendFriendRequest, friendRequests } = useFriends(user?.uid);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    if (userData && leaderboard.length > 0) {
      const entry = leaderboard.find(e => e.uid === (userId || user?.uid));
      setUserRank(entry?.rank || null);
    }
  }, [leaderboard, userData, userId, user]);

  useEffect(() => {
    if (!isMe && friendRequests.some(r => r.from === user?.uid && r.to === userId)) {
      setRequestSent(true);
    }
  }, [friendRequests, userId, user, isMe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">👑</div>
          <div className="text-2xl text-white animate-pulse">Đang tải hồ sơ...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-2xl text-white">Không tìm thấy dữ liệu người dùng</div>
      </div>
    );
  }

  const avatar = userData.avatar || DEFAULT_AVATAR;
  const background = userData.background || DEFAULT_BACKGROUND;
  const isTop1 = userRank === 1;
  const isTop2 = userRank === 2;
  const isTop3 = userRank === 3;
  const isTop10 = userRank && userRank <= 10;
  const isFriend = friends.some(f => f.uid === userId);

  const getRankTitle = () => {
    if (isTop1) return '👑 HOÀNG ĐẾ';
    if (isTop2) return '🥈 HOÀNG HẬU';
    if (isTop3) return '🥉 HOÀNG TỬ';
    if (isTop10) return '⭐ ĐẠI GIA';
    return '💎 THÀNH VIÊN';
  };

  const getRankColor = () => {
    if (isTop1) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    if (isTop2) return 'from-gray-300 via-gray-400 to-gray-500';
    if (isTop3) return 'from-orange-400 via-orange-500 to-orange-600';
    if (isTop10) return 'from-blue-400 via-purple-500 to-pink-500';
    return 'from-gray-500 via-gray-600 to-gray-700';
  };

  // Helper: parse createdAt
  const getCreatedAt = () => {
    if (!userData.createdAt) return 'Chưa cập nhật';
    if (typeof userData.createdAt === 'number') {
      return new Date(userData.createdAt).toLocaleDateString('vi-VN');
    }
    // Firestore Timestamp
    if (
      typeof userData.createdAt === 'object' &&
      userData.createdAt !== null &&
      typeof (userData.createdAt as { toDate?: () => Date }).toDate === 'function'
    ) {
      return new Date((userData.createdAt as { toDate: () => Date }).toDate()).toLocaleDateString('vi-VN');
    }
    return 'Chưa cập nhật';
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#1a0f0a] pb-24 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-6 relative">

        {/* Banner Card Wrapper */}
        <div className="relative w-full mb-16 sm:mb-20">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/10">
            <div
              className="w-full h-40 sm:h-52 md:h-64 object-cover"
              style={{
                backgroundImage: `url(${background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>
            </div>
          </div>

          {/* Avatar Positioned over Banner */}
          <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="relative">
              {isTop1 && <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400 rounded-full animate-spin-slow blur-lg opacity-80 z-0"></div>}
              {isTop2 && <div className="absolute -inset-2 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-300 rounded-full animate-pulse blur-lg opacity-80 z-0"></div>}
              {isTop3 && <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 rounded-full animate-pulse blur-lg opacity-80 z-0"></div>}

              <AvatarUpload
                userId={userId || user?.uid || ''}
                currentAvatar={avatar}
                isMe={isMe}
                sizeClass="w-24 h-24 sm:w-32 sm:h-32"
                borderClass={`border-4 ${isTop1 ? 'border-yellow-400' : isTop2 ? 'border-gray-300' : isTop3 ? 'border-orange-400' : 'border-[#1a0f0a]'}`}
              />

              {!isMe && (
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-[#1a0f0a] flex items-center justify-center shadow-lg z-20">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full"></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="text-center mb-8 px-4 flex flex-col items-center">
          {isEditingNickname ? (
            <div className="flex justify-center items-center gap-2 mb-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-yellow-400 placeholder-white/30 text-center"
                maxLength={20}
                placeholder="Nhập biệt danh..."
                autoFocus
              />
              <button
                onClick={async () => {
                  if (newNickname.trim() && updateNickname) {
                    await updateNickname(newNickname.trim());
                  }
                  setIsEditingNickname(false);
                }}
                className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg border border-green-500/50 hover:bg-green-500/30 font-bold"
              >
                Lưu
              </button>
              <button
                onClick={() => setIsEditingNickname(false)}
                className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg border border-red-500/50 hover:bg-red-500/30 font-bold"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-2 mb-2 pb-1 relative">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide drop-shadow-md flex items-center gap-2">
                {userData.nickname || userData.email?.split('@')[0]}
              </h1>
              {isMe && (
                <button
                  onClick={() => {
                    setNewNickname(userData.nickname || userData.email?.split('@')[0] || '');
                    setIsEditingNickname(true);
                  }}
                  className="p-2 sm:p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center justify-center border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95 shadow-sm"
                  title="Sửa Biệt Danh"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <p className="text-gray-400 text-sm mb-3">
            {userData.email}
          </p>

          {userRank && (
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${getRankColor()} px-4 py-1.5 rounded-full border border-white/30 shadow-lg mb-3`}>
              {isTop1 && <span>👑</span>}
              <span className="font-bold text-sm sm:text-base drop-shadow-md">{getRankTitle()}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-gray-300 text-xs sm:text-sm">
            <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">📅 Tham gia: {getCreatedAt()}</span>
            {userRank && (
              <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 font-bold">
                🏆 Hạng #{userRank}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isMe && (
          <div className="flex justify-center mb-8 gap-3">
            {isFriend ? (
              <button className="bg-green-500/20 text-green-400 border border-green-500/50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-default">
                ✓ Đã là bạn bè
              </button>
            ) : requestSent ? (
              <button className="bg-gray-500/20 text-gray-400 border border-gray-500/50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-default">
                ⏳ Đã gửi lời mời
              </button>
            ) : (
              <button
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
                onClick={async () => {
                  await sendFriendRequest(userId!); // eslint-disable-line
                  setRequestSent(true);
                }}
              >
                + Kết bạn
              </button>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">💰 Tổng Tài Sản</span>
            <span className="text-2xl sm:text-3xl font-black text-yellow-500 drop-shadow-md break-all">
              {formatCurrency(userData.money)}
            </span>
          </div>

          {userRank && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">🏆 Xếp Hạng</span>
              <span className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${getRankColor()} text-transparent bg-clip-text drop-shadow-md`}>
                #{userRank}
              </span>
              <span className="text-gray-300 text-xs mt-1 font-semibold">{getRankTitle()}</span>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">📅 Điểm Danh</span>
            <span className="text-lg sm:text-xl font-bold text-blue-400 drop-shadow-md">
              {userData.lastCheckin ? new Date(userData.lastCheckin).toLocaleDateString('vi-VN') : 'Chưa điểm danh'}
            </span>
            <span className="text-gray-400 text-xs mt-1">
              {userData.lastCheckin === new Date().toLocaleDateString('vi-VN') ? '✅ Hôm nay' : '❌ Chưa điểm danh'}
            </span>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/10 shadow-xl mb-8">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Nhiệm Vụ Của Bạn
          </h2>
          <div className="grid gap-3">
            {[
              { id: 'tiktok', label: 'Follow TikTok', done: userData.tasks?.followTiktok },
              { id: 'youtube', label: 'Subscribe YouTube', done: userData.tasks?.subscribeYoutube }
            ].map(task => (
              <div key={task.id} className="flex items-center justify-between bg-black/40 rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${task.done ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                    {task.done ? '✓' : '○'}
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-gray-200">{task.label}</span>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${task.done ? 'bg-green-500 text-white shadow-md' : 'bg-gray-700 text-gray-300'}`}>
                  {task.done ? 'Hoàn Thành' : 'Chưa Làm'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button Modal Support */}
        {onClose && (
          <div className="flex justify-center">
            <button
              className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 font-bold px-10 py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
              onClick={onClose}
            >
              Đóng Hồ Sơ
            </button>
          </div>
        )}

      </div>
    </div>
  );
};