import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils';
import { DEFAULT_AVATAR, DEFAULT_BACKGROUND } from '../constants';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useFriends } from '../hooks/useFriends';

interface ProfileProps {
  userId?: string;
  onClose?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ userId, onClose }) => {
  const { user } = useAuth();
  const isMe = !userId || userId === user?.uid;
  const { userData, loading } = useUserData(userId || user?.uid);
  const { leaderboard } = useLeaderboard(100);
  const { friends, sendFriendRequest, friendRequests } = useFriends(user?.uid);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (userData && leaderboard.length > 0) {
      const entry = leaderboard.find(e => e.uid === (userId || user?.uid));
      setUserRank(entry?.rank || null);
      if (entry && entry.rank <= 3) setShowParticles(true);
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
    <div className="w-full pb-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl relative">
        {showParticles && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(isTop1 ? 50 : isTop2 ? 30 : 20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl sm:text-3xl md:text-4xl animate-float opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                {isTop1 ? '👑' : isTop2 ? '💎' : '⭐'}
              </div>
            ))}
          </div>
        )}

        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-14 sm:mb-16 md:mb-20 shadow-2xl">
          <div
            className="w-full h-48 sm:h-56 md:h-72 lg:h-80"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            {userRank && userRank <= 10 && (
              <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r ${getRankColor()} px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-white shadow-2xl animate-bounce-slow`}>
                <span className="text-white font-black text-[10px] sm:text-xs drop-shadow-lg">
                  {getRankTitle()}
                </span>
              </div>
            )}
            {userRank && (
              <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 ${isTop1 ? 'animate-spin-slow' : ''}`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${getRankColor()} border-2 border-white shadow-2xl flex items-center justify-center`}>
                  <span className="text-white font-black text-sm sm:text-base md:text-xl">
                    #{userRank}
                  </span>
                </div>
              </div>
            )}
            {isTop1 && (
              <>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-4xl sm:text-5xl md:text-6xl animate-bounce-slow opacity-80">
                  👑
                </div>
                <div className="absolute top-3 left-1/4 text-2xl sm:text-3xl md:text-4xl animate-pulse opacity-60" style={{ animationDelay: '0.3s' }}>
                  ✨
                </div>
                <div className="absolute top-3 right-1/4 text-2xl sm:text-3xl md:text-4xl animate-pulse opacity-60" style={{ animationDelay: '0.6s' }}>
                  ✨
                </div>
              </>
            )}
            {isTop2 && (
              <>
                <div className="absolute top-6 left-1/3 text-xl sm:text-2xl md:text-3xl animate-spin-slow opacity-70">
                  💎
                </div>
                <div className="absolute top-6 right-1/3 text-xl sm:text-2xl md:text-3xl animate-spin-slow opacity-70" style={{ animationDelay: '1s' }}>
                  💎
                </div>
              </>
            )}
            {isTop3 && (
              <>
                <div className="absolute top-8 left-1/4 text-lg sm:text-xl md:text-2xl animate-pulse opacity-60">
                  ⭐
                </div>
                <div className="absolute top-8 right-1/4 text-lg sm:text-xl md:text-2xl animate-pulse opacity-60" style={{ animationDelay: '0.5s' }}>
                  ⭐
                </div>
              </>
            )}
          </div>

          <div className="absolute -bottom-10 sm:-bottom-12 md:-bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {isTop1 && (
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full animate-spin-slow blur-md opacity-80"></div>
              )}
              {isTop2 && (
                <div className="absolute -inset-2 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full animate-pulse blur-md opacity-70"></div>
              )}
              {isTop3 && (
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full animate-pulse blur-md opacity-70"></div>
              )}
              <div className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-3 sm:border-4 ${
                isTop1 ? 'border-yellow-400 shadow-[0_0_60px_rgba(255,215,0,1)]' :
                isTop2 ? 'border-gray-300 shadow-[0_0_50px_rgba(192,192,192,0.9)]' :
                isTop3 ? 'border-orange-400 shadow-[0_0_40px_rgba(205,127,50,0.8)]' :
                'border-white shadow-2xl'
              } overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 p-1`}>
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              {isTop1 && (
                <div className="absolute -top-5 sm:-top-6 md:-top-8 left-1/2 transform -translate-x-1/2 text-3xl sm:text-4xl md:text-5xl animate-bounce-slow drop-shadow-2xl">
                  👑
                </div>
              )}
              <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                <span className="text-white font-bold text-[8px] sm:text-[10px]">●</span>
              </div>
              {userRank && userRank <= 10 && (
                <div className={`absolute top-0 left-0 bg-gradient-to-r ${getRankColor()} px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border-2 border-white shadow-lg`}>
                  <span className="text-white font-bold text-[8px] sm:text-[9px] md:text-[10px]">
                    TOP {userRank}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mb-3 sm:mb-4 relative z-10">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1.5 truncate px-4 drop-shadow-lg">
            {userData.email}
          </h1>
          {userRank && (
            <div className={`inline-block bg-gradient-to-r ${getRankColor()} px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-white/50 shadow-xl mb-2 ${isTop1 ? 'animate-pulse' : ''}`}>
              <span className="text-white font-black text-[10px] sm:text-xs md:text-sm drop-shadow-md">
                {getRankTitle()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-300 text-[9px] sm:text-[10px] md:text-xs flex-wrap px-2">
            <span className="flex items-center gap-1">
              📅 Tham gia: {getCreatedAt()}
            </span>
            {userRank && (
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                🏆 Hạng #{userRank}
              </span>
            )}
          </div>
        </div>

        {/* Nút gửi kết bạn nếu không phải mình và chưa là bạn */}
        {!isMe && !isFriend && !requestSent && (
          <div className="flex justify-center mb-4">
            <button
              className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition"
              onClick={async () => {
                await sendFriendRequest(userId!);
                setRequestSent(true);
              }}
            >
              + Gửi lời mời kết bạn
            </button>
          </div>
        )}
        {!isMe && requestSent && (
          <div className="flex justify-center mb-4">
            <span className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold">
              Đã gửi lời mời kết bạn
            </span>
          </div>
        )}
        {!isMe && isFriend && (
          <div className="flex justify-center mb-4">
            <span className="bg-green-400 text-white px-4 py-2 rounded-lg font-bold">
              Đã là bạn bè
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className={`bg-gradient-to-br ${isTop1 ? 'from-yellow-400 via-yellow-500 to-yellow-600' : 'from-yellow-500 to-orange-500'} rounded-xl p-2.5 sm:p-3 shadow-xl border-2 border-white/30 ${isTop1 ? 'animate-glow-pulse' : ''}`}>
            <div className="text-white/90 text-[9px] sm:text-[10px] mb-0.5 font-bold">💰 Tổng Tài Sản</div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-white drop-shadow-lg break-all">
              {formatCurrency(userData.money)}
            </div>
          </div>
          {userRank && (
            <div className={`bg-gradient-to-br ${getRankColor()} rounded-xl p-2.5 sm:p-3 shadow-xl border-2 border-white/30`}>
              <div className="text-white/90 text-[9px] sm:text-[10px] mb-0.5 font-bold">🏆 Xếp Hạng</div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-white drop-shadow-lg">
                #{userRank}
              </div>
              <div className="text-white/80 text-[9px] sm:text-[10px] mt-0.5">
                {getRankTitle()}
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-2.5 sm:p-3 shadow-xl border-2 border-white/30">
            <div className="text-white/90 text-[9px] sm:text-[10px] mb-0.5 font-bold">📅 Điểm Danh</div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-lg">
              {userData.lastCheckin ? new Date(userData.lastCheckin).toLocaleDateString('vi-VN') : 'Chưa điểm danh'}
            </div>
            <div className="text-white/80 text-[9px] sm:text-[10px] mt-0.5">
              {userData.lastCheckin === new Date().toLocaleDateString('vi-VN') ? '✅ Hôm nay' : '❌ Chưa điểm danh'}
            </div>
          </div>
        </div>

        {(isTop1 || isTop2 || isTop3) && (
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-2.5 sm:p-3 border-2 border-purple-400 shadow-2xl mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-black text-yellow-400 mb-2 flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🏅</span>
              THÀNH TỰU
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {isTop1 && (
                <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-2 text-center">
                  <div className="text-xl sm:text-2xl mb-1 animate-bounce">👑</div>
                  <div className="text-yellow-400 font-bold text-[9px] sm:text-[10px]">HOÀNG ĐẾ</div>
                </div>
              )}
              {isTop2 && (
                <div className="bg-gray-400/20 border-2 border-gray-300 rounded-xl p-2 text-center">
                  <div className="text-xl sm:text-2xl mb-1">💎</div>
                  <div className="text-gray-300 font-bold text-[9px] sm:text-[10px]">HOÀNG HẬU</div>
                </div>
              )}
              {isTop3 && (
                <div className="bg-orange-500/20 border-2 border-orange-400 rounded-xl p-2 text-center">
                  <div className="text-xl sm:text-2xl mb-1">🥉</div>
                  <div className="text-orange-400 font-bold text-[9px] sm:text-[10px]">HOÀNG TỬ</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border-2 border-white/30 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold text-tet-yellow mb-2 flex items-center gap-2">
            <span className="text-lg sm:text-xl">🎯</span>
            Nhiệm Vụ
          </h2>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 sm:p-2.5 gap-2 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${userData.tasks.followTiktok ? 'bg-green-500 scale-110' : 'bg-gray-500'}`}>
                  <span className="text-[10px] sm:text-xs font-bold">{userData.tasks.followTiktok ? '✓' : '○'}</span>
                </div>
                <span className="text-white font-semibold text-[10px] sm:text-xs truncate">Follow TikTok</span>
              </div>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${userData.tasks.followTiktok ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                {userData.tasks.followTiktok ? '✅ Hoàn Thành' : '⏳ Chưa Làm'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 sm:p-2.5 gap-2 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${userData.tasks.subscribeYoutube ? 'bg-green-500 scale-110' : 'bg-gray-500'}`}>
                  <span className="text-[10px] sm:text-xs font-bold">{userData.tasks.subscribeYoutube ? '✓' : '○'}</span>
                </div>
                <span className="text-white font-semibold text-[10px] sm:text-xs truncate">Subscribe YouTube</span>
              </div>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${userData.tasks.subscribeYoutube ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                {userData.tasks.subscribeYoutube ? '✅ Hoàn Thành' : '⏳ Chưa Làm'}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            className="mt-6 mx-auto block bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg"
            onClick={onClose}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
};