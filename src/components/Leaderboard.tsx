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
    if (rank === 1) return 'from-yellow-500/20 via-yellow-400/30 to-yellow-500/20';
    if (rank === 2) return 'from-gray-300/20 via-gray-400/30 to-gray-500/20';
    if (rank === 3) return 'from-orange-400/20 via-orange-500/30 to-orange-600/20';
    return '';
  };

  const getBorderStyle = (rank: number) => {
    if (rank === 1) return 'border border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]';
    if (rank === 2) return 'border border-gray-300/50 shadow-[0_0_30px_rgba(209,213,219,0.2)]';
    if (rank === 3) return 'border border-orange-400/50 shadow-[0_0_30px_rgba(251,146,60,0.2)]';
    return 'border border-white/10 hover:border-white/30';
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
        setShareMessage('Mở TikTok và tạo video với thành tích của bạn!');
        setTimeout(() => setShareMessage(null), 5000);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareMessage('Đã mở cửa sổ chia sẻ!');
      setTimeout(() => setShareMessage(null), 3000);
    }
  };

  const handleOpenProfile = (uid: string) => {
    setPreviewUser(uid);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-12 animate-fade-in-up">

      {/* HEADER */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 transition-opacity"></div>
        <h1 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] flex items-center justify-center gap-3">
          <span className="animate-bounce">🏆</span> BẢNG VÀNG ĐẠI GIA
        </h1>
        <p className="relative text-gray-300 text-base sm:text-lg font-medium mb-4">
          Nơi vinh danh Top 10 cao thủ sở hữu tài sản khổng lồ nhất
        </p>

        {currentUserRank && (
          <div className="relative mt-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-md rounded-2xl p-4 sm:px-8 border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse hover:animate-none transition-all">
            <p className="text-blue-100 font-bold text-base sm:text-xl flex items-center gap-3">
              Hạng <span className="text-yellow-400 text-xl sm:text-2xl font-black">#{currentUserRank.rank}</span> với <span className="text-green-400 font-black">{formatCurrency(currentUserRank.money)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Share Message */}
      {shareMessage && (
        <div className="w-full bg-green-500/20 backdrop-blur-md border border-green-400/50 text-green-300 rounded-2xl p-3 sm:p-4 text-center font-bold animate-scale-in text-sm sm:text-base shadow-[0_0_15px_rgba(74,222,128,0.3)]">
          {shareMessage}
        </div>
      )}

      {/* Social Share Buttons */}
      {currentUserRank && (
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
          <h3 className="text-gray-300 font-bold text-sm sm:text-base mb-3 text-center uppercase tracking-widest">Khoe Chiến Tích</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => handleShare('facebook')} className="flex items-center gap-2 bg-[#1877F2]/80 hover:bg-[#1877F2] shadow-[0_4px_15px_rgba(24,119,242,0.4)] hover:shadow-[0_4px_20px_rgba(24,119,242,0.6)] text-white font-bold py-2.5 px-5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:animate-bounce" viewBox="0 0 48 48">
                <path fill="#fff" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path>
                <path fill="#1877F2" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"></path>
              </svg>
              Facebook
            </button>
            <button onClick={() => handleShare('twitter')} className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 shadow-[0_4px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] border border-white/20 text-white font-bold py-2.5 px-5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:animate-bounce drop-shadow-md" viewBox="0 0 50 50">
                <path fill="#fff" d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z"></path>
              </svg>
              X
            </button>
            <button onClick={() => handleShare('tiktok')} className="flex items-center gap-2 bg-gradient-to-r from-[#25F4EE]/80 via-black/80 to-[#FE2C55]/80 hover:from-[#25F4EE] hover:via-black hover:to-[#FE2C55] shadow-[0_4px_15px_rgba(254,44,85,0.3)] hover:shadow-[0_4px_20px_rgba(254,44,85,0.5)] border border-[#FE2C55]/50 text-white font-bold py-2.5 px-5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:animate-bounce drop-shadow-[0_0_3px_#25F4EE]" viewBox="0 0 50 50">
                <path fill="#fff" d="M41,4H9C6.243,4,4,6.243,4,9v32c0,2.757,2.243,5,5,5h32c2.757,0,5-2.243,5-5V9C46,6.243,43.757,4,41,4z M37.006,22.323 c-0.227,0.021-0.457,0.035-0.69,0.035c-2.623,0-4.928-1.349-6.269-3.388c0,5.349,0,11.435,0,11.537c0,4.709-3.818,8.527-8.527,8.527 s-8.527-3.818-8.527-8.527s3.818-8.527,8.527-8.527c0.178,0,0.352,0.016,0.527,0.027v4.202c-0.175-0.021-0.347-0.053-0.527-0.053 c-2.404,0-4.352,1.948-4.352,4.352s1.948,4.352,4.352,4.352s4.527-1.894,4.527-4.298c0-0.095,0.042-19.594,0.042-19.594h4.016 c0.378,3.591,3.277,6.425,6.901,6.685V22.323z"></path>
              </svg>
              TikTok
            </button>
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
                rounded-2xl p-4 sm:p-5 transform transition-all duration-300
                hover:scale-[1.02] cursor-pointer
                ${entry.rank <= 3 ? 'bg-gradient-to-r ' + getRankColor(entry.rank) : 'bg-white/5 backdrop-blur-md hover:bg-white/10'}
                ${getBorderStyle(entry.rank)}
                ${isCurrentUser ? 'ring-2 ring-green-400/50 shadow-[0_0_20px_rgba(74,222,128,0.3)]' : 'shadow-xl'}
              `}
              style={entry.rank <= 3 && entry.background ? {
                backgroundImage: `url(${entry.background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'overlay',
                backgroundColor: 'rgba(0,0,0,0.4)'
              } : {}}
              onClick={() => handleOpenProfile(entry.uid)}
            >

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
                  <h3 className={`font-bold text-white truncate ${isTop3 ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
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
                  <div className={`font-bold text-white whitespace-nowrap ${isTop3 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
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
      <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 mt-4 shadow-xl">
        <h4 className="font-bold text-yellow-400 text-lg sm:text-xl mb-4 flex items-center gap-2">
          <span>🎯</span> Bí kíp lên Top:
        </h4>
        <ul className="text-gray-300 text-sm sm:text-base space-y-3">
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Chơi minigames thường xuyên để tích luỹ tiền cược</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Điểm danh hàng ngày nhận phần thưởng điểm danh</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Mở hũ Jackpot trong các sảnh sự kiện</li>
          <li className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Sử dụng thẻ Bonus ở Cửa Hàng để gia tăng thu nhập</li>
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