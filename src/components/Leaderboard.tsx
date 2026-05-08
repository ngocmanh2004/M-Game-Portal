import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils';
import { DEFAULT_AVATAR } from '../constants';
import { Profile } from './Profile';
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

      {/* HEADER - Enhanced Contrast Design */}
      <div className="relative group">
        {/* Strong background layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-blue-600/20 rounded-3xl"></div>
        
        {/* Main header container */}
        <div className="relative bg-gradient-to-br from-gray-900/90 to-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden">
          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-float opacity-60"></div>
            <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-float-delayed opacity-60"></div>
            <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-purple-400 rounded-full animate-float-slow opacity-60"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Title - Fixed for mobile centering */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3">
              <span className="text-5xl sm:text-6xl animate-bounce filter drop-shadow-[0_0_20px_rgba(255,215,0,1)]">🏆</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.8)]">
                  TOP ĐẠI GIA
                </span>
              </h1>
            </div>
            
            <p className="text-gray-100 text-base sm:text-lg font-semibold mb-4 max-w-2xl px-4">
              Nơi vinh danh Top 10 cao thủ sở hữu tài sản khổng lồ nhất
            </p>

            {currentUserRank && (
              <div className="mt-4 w-full max-w-lg px-4">
                {/* User rank with strong background */}
                <div className="bg-gradient-to-r from-emerald-800/80 to-blue-800/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <div className="text-center space-y-3">
                    <div className="text-emerald-100 font-bold text-sm uppercase tracking-wider">Vị trí của bạn</div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="bg-yellow-500/20 border-2 border-yellow-400/60 rounded-xl px-4 py-2">
                        <span className="text-yellow-300 text-2xl sm:text-3xl font-black">#{currentUserRank.rank}</span>
                      </div>
                      <span className="text-gray-100 font-semibold text-lg">với</span>
                      <div className="bg-emerald-500/20 border-2 border-emerald-400/60 rounded-xl px-4 py-2">
                        <span className="text-emerald-300 font-black text-xl sm:text-2xl">
                          {formatCurrency(currentUserRank.money)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Message - High Contrast */}
      {shareMessage && (
        <div className="relative">
          <div className="bg-gradient-to-r from-emerald-800/90 to-green-800/90 backdrop-blur-sm border-2 border-emerald-400/60 text-white rounded-2xl p-4 text-center font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-scale-in">
            <div className="flex items-center justify-center gap-3">
              <span className="text-emerald-300 text-2xl">✓</span>
              <span className="text-base sm:text-lg">{shareMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Buttons - High Contrast Design */}
      {currentUserRank && (
        <div className="relative">
          {/* Strong background layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 rounded-2xl"></div>
          
          <div className="relative bg-gradient-to-br from-gray-900/90 to-slate-900/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border-2 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <h3 className="text-white font-bold text-base sm:text-lg mb-5 text-center uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="text-2xl">🚀</span> Khoe Chiến Tích
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => handleShare('facebook')} 
                className="group/btn relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-[#1877F2] to-[#1565C0] hover:from-[#166FE5] hover:to-[#0D47A1] shadow-[0_8px_30px_rgba(24,119,242,0.5)] hover:shadow-[0_12px_40px_rgba(24,119,242,0.7)] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-blue-400/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 48 48">
                  <path fill="#fff" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path>
                  <path fill="#1877F2" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"></path>
                </svg>
              </button>
              
              <button 
                onClick={() => handleShare('twitter')} 
                className="group/btn relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] border-2 border-gray-500/50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 50 50">
                  <path fill="#fff" d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z"></path>
                </svg>
              </button>
              
              <button 
                onClick={() => handleShare('tiktok')} 
                className="group/btn relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-[#25F4EE] via-black to-[#FE2C55] hover:from-[#00F2EA] hover:via-gray-900 hover:to-[#FF0050] shadow-[0_8px_30px_rgba(254,44,85,0.5)] hover:shadow-[0_12px_40px_rgba(254,44,85,0.7)] border-2 border-pink-500/60 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 50 50">
                  <path fill="#fff" d="M41,4H9C6.243,4,4,6.243,4,9v32c0,2.757,2.243,5,5,5h32c2.757,0,5-2.243,5-5V9C46,6.243,43.757,4,41,4z M37.006,22.323 c-0.227,0.021-0.457,0.035-0.69,0.035c-2.623,0-4.928-1.349-6.269-3.388c0,5.349,0,11.435,0,11.537c0,4.709-3.818,8.527-8.527,8.527 s-8.527-3.818-8.527-8.527s3.818-8.527,8.527-8.527c0.178,0,0.352,0.016,0.527,0.027v4.202c-0.175-0.021-0.347-0.053-0.527-0.053 c-2.404,0-4.352,1.948-4.352,4.352s1.948,4.352,4.352,4.352s4.527-1.894,4.527-4.298c0-0.095,0.042-19.594,0.042-19.594h4.016 c0.378,3.591,3.277,6.425,6.901,6.685V22.323z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List - Modern card design with backgrounds */}
      <div className="w-full space-y-4">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.uid === user?.uid;
          const isTop3 = entry.rank <= 3;

          return (
            <div
              key={entry.uid}
              className={`
                group relative overflow-hidden
                rounded-2xl transform transition-all duration-500
                hover:scale-[1.02] cursor-pointer
                backdrop-blur-xl border
                ${getBorderStyle(entry.rank)}
                ${isCurrentUser ? 'ring-2 ring-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'shadow-[0_10px_40px_rgba(0,0,0,0.3)]'}
                hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]
              `}
              style={entry.background ? {
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.6)), url(${entry.background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {
                background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))'
              }}
              onClick={() => handleOpenProfile(entry.uid)}
            >

              {/* Animated border for top ranks */}
              {entry.rank === 1 && (
                <div className="absolute inset-0 rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 via-transparent to-yellow-400/50 animate-pulse rounded-2xl"></div>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-shimmer"></div>
                  <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-shimmer-delayed"></div>
                </div>
              )}

              {/* Floating elements for top 3 */}
              {entry.rank === 1 && (
                <>
                  <div className="absolute -top-2 -right-2 text-3xl sm:text-4xl opacity-70 animate-float">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-3xl sm:text-4xl opacity-70 animate-float-delayed">✨</div>
                </>
              )}

              {entry.rank === 2 && (
                <>
                  <div className="absolute top-2 right-2 text-2xl sm:text-3xl opacity-60 animate-pulse">💎</div>
                  <div className="absolute bottom-2 left-2 text-2xl sm:text-3xl opacity-60 animate-pulse-delayed">💎</div>
                </>
              )}

              {entry.rank === 3 && (
                <>
                  <div className="absolute top-2 right-2 text-xl sm:text-2xl opacity-50 animate-bounce">🌟</div>
                  <div className="absolute bottom-2 left-2 text-xl sm:text-2xl opacity-50 animate-bounce-delayed">🌟</div>
                </>
              )}

              {/* Main content */}
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">

                  {/* Enhanced Rank Medal */}
                  <div className="relative shrink-0">
                    {entry.rank === 1 && (
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18">
                        {/* Rotating outer ring */}
                        <div className="absolute inset-0 bg-gradient-conic from-yellow-300 via-yellow-500 to-yellow-300 rounded-full animate-spin-slow opacity-80 blur-sm"></div>
                        {/* Main medal */}
                        <div className="absolute inset-[2px] bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full shadow-inner"></div>
                        {/* Inner highlight */}
                        <div className="absolute inset-[6px] bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-500 rounded-full border-2 border-yellow-100/50"></div>
                        {/* Crown icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl drop-shadow-lg animate-bounce filter drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">👑</span>
                        </div>
                        {/* Pulsing glow */}
                        <div className="absolute inset-0 rounded-full bg-yellow-300/40 animate-ping"></div>
                      </div>
                    )}

                    {entry.rank === 2 && (
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                        <div className="absolute inset-0 bg-gradient-conic from-gray-200 via-gray-400 to-gray-200 rounded-full animate-spin-slow opacity-70 blur-sm"></div>
                        <div className="absolute inset-[2px] bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-full shadow-inner"></div>
                        <div className="absolute inset-[5px] bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400 rounded-full border-2 border-gray-50/50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl sm:text-2xl drop-shadow-md filter drop-shadow-[0_0_6px_rgba(192,192,192,0.8)]">🥈</span>
                        </div>
                      </div>
                    )}

                    {entry.rank === 3 && (
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-300 via-orange-500 to-orange-600 rounded-full shadow-inner"></div>
                        <div className="absolute inset-[5px] bg-gradient-to-br from-orange-200 via-orange-400 to-orange-500 rounded-full border-2 border-orange-100/50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl sm:text-2xl drop-shadow-md filter drop-shadow-[0_0_6px_rgba(205,127,50,0.8)]">🥉</span>
                        </div>
                      </div>
                    )}

                    {entry.rank > 3 && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-full flex items-center justify-center border-2 border-slate-400/50 shadow-lg group-hover:shadow-xl transition-shadow">
                        <span className="text-white font-bold text-sm sm:text-base">#{entry.rank}</span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Avatar */}
                  <div className="relative shrink-0">
                    <div className={`
                      ${isTop3 ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-12 h-12 sm:w-14 sm:h-14'}
                      rounded-full p-0.5 bg-gradient-to-br
                      ${entry.rank === 1 ? 'from-yellow-300 via-yellow-400 to-yellow-500' :
                        entry.rank === 2 ? 'from-gray-300 via-gray-400 to-gray-500' :
                          entry.rank === 3 ? 'from-orange-300 via-orange-400 to-orange-500' :
                            'from-slate-400 via-slate-500 to-slate-600'}
                    `}>
                      <img
                        src={entry.avatar || DEFAULT_AVATAR}
                        alt={entry.email}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    
                    {isCurrentUser && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold animate-bounce shadow-lg border border-emerald-300/50">
                        BẠN
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-white truncate mb-1 ${isTop3 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                      {isCurrentUser ? '👑 ' : ''}{entry.email}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/80 text-xs sm:text-sm font-medium bg-white/10 px-2 py-1 rounded-lg">
                        Hạng #{entry.rank}
                      </span>
                      {entry.rank === 1 && (
                        <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          ĐẠI GIA
                        </span>
                      )}
                      {entry.rank === 2 && (
                        <span className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          CAO THỦ
                        </span>
                      )}
                      {entry.rank === 3 && (
                        <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          THẦN TÀI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Money Display */}
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-white whitespace-nowrap mb-1 ${isTop3 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                      {formatCurrency(entry.money)}
                    </div>
                    <div className="text-white/70 text-xs sm:text-sm bg-white/10 px-2 py-1 rounded-lg">
                      Tài Sản
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
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

      {/* Instructions - Modern info card */}
      <div className="relative group">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
        
        <div className="relative w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300">
          <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 text-lg sm:text-xl mb-6 flex items-center gap-3">
            <span className="text-2xl animate-bounce">🎯</span> 
            <span>Bí kíp lên Top</span>
          </h4>
          
          <div className="grid gap-4">
            {[
              { icon: '🎮', text: 'Chơi minigames thường xuyên để tích luỹ tiền cược', color: 'from-green-400 to-emerald-500' },
              { icon: '📅', text: 'Điểm danh hàng ngày nhận phần thưởng điểm danh', color: 'from-blue-400 to-cyan-500' },
              { icon: '🎰', text: 'Mở hũ Jackpot trong các sảnh sự kiện', color: 'from-purple-400 to-pink-500' },
              { icon: '🛍️', text: 'Sử dụng thẻ Bonus ở Cửa Hàng để gia tăng thu nhập', color: 'from-orange-400 to-red-500' }
            ].map((tip, index) => (
              <div key={index} className="group/tip flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center text-xl shadow-lg group-hover/tip:scale-110 transition-transform`}>
                  {tip.icon}
                </div>
                <span className="text-gray-200 text-sm sm:text-base font-medium flex-1">{tip.text}</span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center opacity-80 group-hover/tip:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal xem hồ sơ - Enhanced UI */}
      {previewUser && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setPreviewUser(null)}
        >
          <div 
            className="relative bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full border-2 border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.4)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-3 -right-3 z-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-red-400/50"
              onClick={() => setPreviewUser(null)}
              aria-label="Đóng"
            >✕</button>
            <UserProfilePreview userId={previewUser} onViewProfile={() => {
              setSelectedUser(previewUser);
              setPreviewUser(null);
            }} />
          </div>
        </div>
      )}

      {/* Modal hồ sơ đầy đủ - Enhanced UI with hidden scrollbar */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="relative bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] border-2 border-blue-500/40 shadow-[0_0_60px_rgba(59,130,246,0.4)] animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              className="absolute -top-3 -right-3 z-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-red-400/50"
              onClick={() => setSelectedUser(null)}
              aria-label="Đóng"
            >✕</button>
            
            {/* Content with hidden scrollbar */}
            <div className="max-h-[calc(90vh-3rem)] overflow-y-auto scrollbar-hide">
              <Profile userId={selectedUser} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};