import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils';
import { DEFAULT_AVATAR } from '../constants';
import { Button } from './Button';
import { Profile } from './Profile';
import { useUserData } from '../hooks/useUserData';
import { UserProfileModal } from './UserProfileModal';
import { UserProfilePreview } from './UserProfilePreview';

export const Leaderboard: React.FC = () => {
  const { leaderboard, loading } = useLeaderboard(10);
  const { user } = useAuth();
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🏆</div>
          <p className="text-white text-xl animate-pulse">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    if (rank === 2) return 'from-gray-300 via-gray-400 to-gray-500';
    if (rank === 3) return 'from-orange-400 via-orange-500 to-orange-600';
    return 'from-blue-500 via-purple-500 to-pink-500';
  };

  const getBorderStyle = (rank: number) => {
    // ⭐ BỎ animate-rainbow, CHỈ DÙNG shadow + border đơn giản
    if (rank === 1) return 'border-[6px] border-yellow-400 shadow-[0_0_60px_rgba(255,215,0,1),0_0_30px_rgba(255,215,0,0.8)_inset]';
    if (rank === 2) return 'border-[5px] border-gray-300 shadow-[0_0_50px_rgba(192,192,192,0.9),0_0_25px_rgba(192,192,192,0.7)_inset]';
    if (rank === 3) return 'border-[5px] border-orange-400 shadow-[0_0_40px_rgba(205,127,50,0.8),0_0_20px_rgba(205,127,50,0.6)_inset]';
    return 'border-2 border-white/30';
  };

  const currentUserRank = leaderboard.find(entry => entry.uid === user?.uid);

  // ⭐ Share lên mạng xã hội
  const handleShare = (platform: 'facebook' | 'twitter' | 'tiktok') => {
    if (!currentUserRank) {
      setShareMessage('❌ Bạn chưa có trong top 10!');
      setTimeout(() => setShareMessage(null), 3000);
      return;
    }

    const message = `🏆 Tôi đang xếp hạng #${currentUserRank.rank} với ${formatCurrency(currentUserRank.money)} trong game Bầu Cua Tết! 🎮`;
    const url = window.location.href;

    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'tiktok':
        setShareMessage('📱 Mở TikTok và tạo video với thành tích của bạn!');
        setTimeout(() => setShareMessage(null), 5000);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareMessage('✅ Đã mở cửa sổ chia sẻ!');
      setTimeout(() => setShareMessage(null), 3000);
    }
  };

  const handleOpenProfile = (uid: string) => {
    setPreviewUser(uid);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 pb-8">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-festive text-tet-yellow mb-3 drop-shadow-lg animate-bounce">
          🏆 BẢNG XẾP HẠNG 🏆
        </h1>
        <p className="text-white/90 text-base sm:text-lg mb-2">Top 10 Đại Gia Nhà Giàu</p>
        
        {currentUserRank && (
          <div className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-4 border-4 border-green-300 shadow-2xl animate-pulse">
            <p className="text-white font-bold text-base sm:text-lg">
              🎯 Hạng #{currentUserRank.rank} - {formatCurrency(currentUserRank.money)}
            </p>
          </div>
        )}
      </div>

      {/* Share Message */}
      {shareMessage && (
        <div className="w-full bg-blue-500 text-white rounded-2xl p-3 sm:p-4 text-center font-bold animate-scale-in text-sm sm:text-base">
          {shareMessage}
        </div>
      )}

      {/* Social Share Buttons */}
      {currentUserRank && (
        <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-white/20">
          <h3 className="text-white font-bold text-base sm:text-lg mb-2 sm:mb-3 text-center">📢 Chia Sẻ</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => handleShare('facebook')} className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 text-xs sm:text-sm">
              📘 Facebook
            </Button>
            <Button onClick={() => handleShare('twitter')} className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-300 text-xs sm:text-sm">
              🐦 Twitter
            </Button>
            <Button onClick={() => handleShare('tiktok')} className="bg-black hover:bg-gray-800 border-2 border-pink-500 text-xs sm:text-sm">
              🎵 TikTok
            </Button>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="w-full space-y-3 sm:space-y-4">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.uid === user?.uid;
          const isTop3 = entry.rank <= 3;
          
          return (
            <div
              key={entry.uid}
              className={`
                relative overflow-hidden
                bg-gradient-to-r ${getRankColor(entry.rank)}
                rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl transform transition-all
                hover:scale-[1.02] hover:shadow-2xl
                ${getBorderStyle(entry.rank)}
                ${isCurrentUser ? 'ring-4 ring-green-400 ring-offset-2' : ''}
              `}
              style={{
                backgroundImage: entry.background ? `url(${entry.background})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onClick={() => handleOpenProfile(entry.uid)}
            >
              {/* ⭐ OVERLAY ĐẸP HƠN CHO TOP 3 */}
              {entry.background && (
                <div className="absolute inset-0 bg-black/60 rounded-xl sm:rounded-2xl"></div>
              )}
              
              {/* ⭐ HIỆU ỨNG LẤP LÁNH CHO TOP 1 */}
              {entry.rank === 1 && (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-shine"></div>
                  <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-shine" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute -top-1 -right-1 text-4xl sm:text-5xl opacity-60 animate-pulse">✨</div>
                  <div className="absolute -bottom-1 -left-1 text-4xl sm:text-5xl opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
                </>
              )}

              {/* ⭐ HIỆU ỨNG LẤP LÁNH CHO TOP 2 */}
              {entry.rank === 2 && (
                <>
                  <div className="absolute top-0 right-0 text-3xl sm:text-4xl opacity-50 animate-pulse">💎</div>
                  <div className="absolute bottom-0 left-0 text-3xl sm:text-4xl opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}>💎</div>
                </>
              )}

              {/* ⭐ HIỆU ỨNG LẤP LÁNH CHO TOP 3 */}
              {entry.rank === 3 && (
                <>
                  <div className="absolute top-1 right-1 text-2xl sm:text-3xl opacity-40 animate-bounce">🌟</div>
                  <div className="absolute bottom-1 left-1 text-2xl sm:text-3xl opacity-40 animate-bounce" style={{ animationDelay: '0.3s' }}>🌟</div>
                </>
              )}

              <div className="relative flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => handleOpenProfile(entry.uid)} title="Xem hồ sơ">
                
                {/* ⭐ RANK MEDAL - THIẾT KẾ SANG TRỌNG VÀ LẤP LÁNH */}
                <div className="relative shrink-0">
                  {entry.rank === 1 && (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      {/* Viền quay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-300 rounded-full animate-spin-slow opacity-80 blur-sm"></div>
                      {/* Nền chính */}
                      <div className="absolute inset-[3px] bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full"></div>
                      {/* Viền trong sáng */}
                      <div className="absolute inset-[6px] bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-500 rounded-full border-2 border-yellow-100 shadow-inner"></div>
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl drop-shadow-lg animate-bounce">👑</span>
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-full bg-yellow-300 opacity-30 animate-ping"></div>
                    </div>
                  )}
                  
                  {entry.rank === 2 && (
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                      {/* Viền quay chậm */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-400 to-gray-200 rounded-full animate-spin-slow opacity-70 blur-sm"></div>
                      {/* Nền chính */}
                      <div className="absolute inset-[3px] bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-full"></div>
                      {/* Viền trong sáng */}
                      <div className="absolute inset-[5px] bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400 rounded-full border-2 border-gray-50 shadow-inner"></div>
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl drop-shadow-md">🥈</span>
                      </div>
                    </div>
                  )}
                  
                  {entry.rank === 3 && (
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                      {/* Nền chính */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-300 via-orange-500 to-orange-600 rounded-full"></div>
                      {/* Viền trong sáng */}
                      <div className="absolute inset-[5px] bg-gradient-to-br from-orange-200 via-orange-400 to-orange-500 rounded-full border-2 border-orange-100 shadow-inner"></div>
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl drop-shadow-md">🥉</span>
                      </div>
                    </div>
                  )}
                  
                  {entry.rank > 3 && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white/50 shadow-lg">
                      <span className="text-white font-bold text-sm sm:text-base">#{entry.rank}</span>
                    </div>
                  )}
                </div>

                {/* ⭐ AVATAR - FRAME ĐẸP HƠN */}
                <div className="relative shrink-0">
                  <img 
                    src={entry.avatar || DEFAULT_AVATAR} 
                    alt={entry.email}
                    className={`
                      ${isTop3 ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-12 sm:h-12'}
                      rounded-full object-cover
                      ${entry.rank === 1 ? 'border-[3px] border-yellow-300 shadow-[0_0_25px_rgba(255,215,0,1)]' :
                        entry.rank === 2 ? 'border-[3px] border-gray-300 shadow-[0_0_20px_rgba(192,192,192,0.9)]' :
                        entry.rank === 3 ? 'border-[3px] border-orange-300 shadow-[0_0_18px_rgba(205,127,50,0.8)]' :
                        'border-2 border-white shadow-lg'}
                      ${isCurrentUser ? 'ring-4 ring-green-400 ring-offset-2' : ''}
                    `}
                  />
                  {isCurrentUser && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold animate-bounce shadow-lg">
                      BẠN
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-white truncate ${
                    isTop3 ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  }`}>
                    {isCurrentUser ? '👑 ' : ''}{entry.email}
                  </h3>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                    <span className="text-white/90 text-[10px] sm:text-xs font-semibold">
                      Hạng {entry.rank}
                    </span>
                    {entry.rank === 1 && (
                      <span className="bg-yellow-400 text-yellow-900 text-[8px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold">
                        ĐẠI GIA
                      </span>
                    )}
                  </div>
                </div>

                {/* Money */}
                <div className="text-right shrink-0">
                  <div className={`font-bold text-white whitespace-nowrap ${
                    isTop3 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}>
                    {formatCurrency(entry.money)}
                  </div>
                  <div className="text-white/80 text-[10px] sm:text-xs">Tài Sản</div>
                </div>
              </div>

              {/* Sparkle Effect for Top 3 */}
              {isTop3 && (
                <div className="absolute top-1 right-1 text-2xl sm:text-3xl opacity-30 animate-ping">
                  ✨
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-white text-xl">Chưa có dữ liệu xếp hạng</p>
        </div>
      )}

      {/* Instructions */}
      <div className="w-full bg-yellow-400/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-2xl p-4 sm:p-6">
        <h4 className="font-bold text-tet-yellow text-lg sm:text-xl mb-3">
          📌 Cách lên Top:
        </h4>
        <ul className="text-white/90 text-sm sm:text-base space-y-2">
          <li>💰 Chơi game để kiếm tiền</li>
          <li>🎁 Điểm danh hàng ngày nhận thưởng</li>
          <li>🎯 Hoàn thành nhiệm vụ nhận tiền</li>
          <li>🛒 Mua Bonus Card để tăng % thắng</li>
          <li>🏆 Top 3 được highlight đặc biệt!</li>
          <li>📢 Chia sẻ thành tích để khoe với bạn bè!</li>
        </ul>
      </div>

      {/* Modal xem hồ sơ */}
      {previewUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-white/10 rounded-xl p-4 max-w-xs w-full text-center">
            <button
              className="absolute top-2 right-2 z-20 bg-red-500 hover:bg-red-600 text-white text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition"
              onClick={() => setPreviewUser(null)}
              aria-label="Đóng"
            >✖</button>
            <UserProfilePreview userId={previewUser} onViewProfile={() => {
              setSelectedUser(previewUser);
              setPreviewUser(null);
            }} />
          </div>
        </div>
      )}

      {/* Modal hồ sơ đầy đủ */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-white/10 rounded-xl p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Nút đóng */}
            <button
              className="absolute top-2 right-2 z-20 bg-red-500 hover:bg-red-600 text-white text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition"
              onClick={() => setSelectedUser(null)}
              aria-label="Đóng"
            >✖</button>
            <Profile userId={selectedUser} />
          </div>
        </div>
      )}
    </div>
  );
};