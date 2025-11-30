import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';
import { User, GameType } from '../types';
import { ASSETS, DEFAULT_AVATAR } from '../constants';
import { useUserData } from '../hooks/useUserData';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { NotificationList } from './NotificationList';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onGoHome: () => void;
  onLogout: () => void;
  title: string;
  isMuted: boolean;
  toggleSound: () => void;
  bgImage: string;
  onChangeBg: () => void;
  currentGame: GameType;
  onNavigate: (game: GameType) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  user, 
  onGoHome, 
  onLogout, 
  title, 
  children,
  isMuted,
  toggleSound,
  bgImage,
  onChangeBg,
  currentGame,
  onNavigate
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // ⭐ THÊM
  
  const { userData } = useUserData(user.uid);
  const { notifications, unreadCount } = useUserNotifications(user.uid); // ⭐ THÊM
  
  // ⭐ CHECK ADMIN
  const isAdmin = userData?.isAdmin || false;

  const hasUnfinishedTasks = userData && (
    !userData.tasks.followTiktok || 
    !userData.tasks.subscribeYoutube ||
    userData.lastCheckin !== new Date().toLocaleDateString('vi-VN')
  );

  const navItems = [
    { 
      id: GameType.HOME, 
      label: 'Trang Chủ',
      gradient: 'from-red-600 to-yellow-600'
    },
    { 
      id: GameType.DASHBOARD, 
      label: 'Nhiệm Vụ',
      badge: hasUnfinishedTasks,
      gradient: 'from-yellow-600 to-orange-600'
    },
    { 
      id: GameType.SHOP, 
      label: 'Shop',
      gradient: 'from-orange-600 to-red-600'
    },
    { 
      id: GameType.INVENTORY, 
      label: 'Túi Đồ',
      gradient: 'from-red-600 to-yellow-600'
    },
    { 
      id: GameType.PROFILE, 
      label: 'Hồ Sơ',
      gradient: 'from-yellow-600 to-orange-600'
    },
    { 
      id: GameType.LEADERBOARD, 
      label: 'BXH',
      gradient: 'from-orange-600 to-red-600'
    },
    { 
      id: GameType.FRIENDS, 
      label: 'Bạn bè',
      gradient: 'from-blue-600 to-cyan-600'
    },
    // ⭐ THÊM ADMIN PANEL
    ...(isAdmin ? [{
      id: 'ADMIN_PANEL' as GameType,
      label: '👑 Admin',
      gradient: 'from-purple-600 to-indigo-600'
    }] : [])
  ];

  const gameItems = [
    { id: GameType.BAU_CUA, label: 'Bầu Cua', gradient: 'from-red-700 to-red-500' },
    { id: GameType.TAI_XIU, label: 'Tài Xỉu', gradient: 'from-yellow-700 to-yellow-500' },
    { id: GameType.XOC_DIA, label: 'Xóc Đĩa', gradient: 'from-orange-700 to-orange-500' },
    { id: GameType.DAP_HEO, label: 'Đập Heo', gradient: 'from-red-700 to-yellow-600' }
  ];

  const avatarUrl = user.avatar || DEFAULT_AVATAR;

  const handleNavigate = (gameType: GameType) => {
    onNavigate(gameType);
    setShowMobileMenu(false);
  };

  // ⭐ Detect mobile landscape
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  useEffect(() => {
    const check = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileLandscape(isMobile && window.innerWidth > window.innerHeight);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isMobileLandscape ? 'bg-black' : ''}`}>
      {/* Header */}
      {!isMobileLandscape && (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-red-800 to-red-600 border-b-4 border-tet-gold shadow-xl">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between py-2 sm:py-3 gap-2 relative">
              {/* ⭐ Trang trí Noel góc trái header */}
              <img
                src="/assets/image/icons/snowman.png"
                alt="Snowman"
                className="absolute left-0 -top-4 w-10 h-10 sm:w-14 sm:h-14 drop-shadow-xl animate-bounce-slow"
                style={{ zIndex: 10, background: 'none' }} // ⭐ THÊM background: 'none'
              />
              
              {/* Logo */}
              <button
                onClick={onGoHome}
                className="flex items-center gap-2 hover:scale-105 transition-transform shrink-0"
              >
                <img 
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-yellow-400 shadow-lg object-cover"
                />
                <span className="text-xl sm:text-2xl font-festive text-tet-yellow hidden sm:block">
                  {title}
                </span>
              </button>

              {/* Desktop: User Info */}
              <div className="hidden md:flex items-center gap-2 lg:gap-4">
                <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 lg:px-4 lg:py-2 border-2 border-tet-gold">
                  <span className="text-base lg:text-xl font-bold text-tet-yellow">
                    💰 {formatCurrency(user.balance)}
                  </span>
                </div>

                {/* ⭐ NOTIFICATION BELL - DESKTOP */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative bg-white/20 backdrop-blur-md rounded-full p-2 border-2 border-white/30 hover:bg-white/30 transition-all"
                  title="Thông báo"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                  </svg>
                  
                  {/* Badge - Số thông báo chưa đọc */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate(GameType.PROFILE)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 lg:px-4 lg:py-2 border-2 border-white/30 hover:bg-white/30 transition-all"
                >
                  <img 
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 border-white object-cover"
                  />
                  <span className="text-white font-semibold text-sm lg:text-base max-w-[100px] lg:max-w-[150px] truncate">
                    {user.email}
                  </span>
                </button>

                <button
                  onClick={toggleSound}
                  className="bg-white/20 backdrop-blur-md rounded-full p-2 border-2 border-white/30 hover:bg-white/30 transition-all"
                >
                  <img 
                    src={isMuted ? ASSETS.soundOff : ASSETS.soundOn} 
                    alt="Sound"
                    className="w-5 h-5 lg:w-6 lg:h-6"
                  />
                </button>

                <button
                  onClick={onChangeBg}
                  className="bg-white/20 backdrop-blur-md rounded-full p-2 border-2 border-white/30 hover:bg-white/30 transition-all"
                  title="Đổi nền"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-full transition-all text-sm lg:text-base"
                >
                  Đăng Xuất
                </button>
              </div>

              {/* Mobile: Info + Menu Button */}
              <div className="flex md:hidden items-center gap-2">
                {/* ⭐ NOTIFICATION BELL - MOBILE */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative bg-white/20 backdrop-blur-md rounded-full p-2 border-2 border-white/30"
                >
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                  </svg>
                  
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate(GameType.PROFILE)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-2 py-1 border-2 border-white/30"
                >
                  <img 
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-white font-bold leading-tight">
                      {formatCurrency(user.balance)}
                    </span>
                  </div>
                </button>

                <button
                  onClick={toggleSound}
                  className="bg-white/20 backdrop-blur-md rounded-full p-2 border-2 border-white/30"
                >
                  <img 
                    src={isMuted ? ASSETS.soundOff : ASSETS.soundOn} 
                    alt="Sound"
                    className="w-5 h-5"
                  />
                </button>

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="bg-white/20 backdrop-blur-md rounded-lg p-2 border-2 border-white/30 relative"
                >
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? 'opacity-0' : ''}`}></span>
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? '-rotate-45 -translate-y-2' : ''}`}></span>
                  </div>

                  {hasUnfinishedTasks && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-gradient-to-r from-yellow-600 to-orange-600 shadow-lg border-b-2 border-yellow-400">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1 lg:gap-2 py-2 flex-wrap">
            
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  relative px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg font-bold transition-all transform text-xs lg:text-sm
                  ${currentGame === item.id 
                    ? 'bg-white text-red-700 scale-110 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                  }
                `}
              >
                {item.label}
                
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                )}
              </button>
            ))}

            <div className="w-px h-6 lg:h-8 bg-white/30 mx-1"></div>

            {gameItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg font-bold transition-all transform text-xs lg:text-sm
                  ${currentGame === item.id 
                    ? 'bg-white text-red-700 scale-110 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ⭐ MOBILE MENU - TẾT SANG TRỌNG */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[9000] bg-black/90 backdrop-blur-lg animate-fade-in" style={{ top: '64px' }}>
          <div className="h-full overflow-y-auto bg-gradient-to-br from-red-950 via-gray-900 to-yellow-950">
            
            {/* Decorative Header */}
            <div className="p-6 text-center border-b border-yellow-600/30">
              <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full mb-3"></div>
              <h3 className="text-yellow-400 font-bold text-lg">Menu</h3>
              <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full mt-3"></div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-4">
              
              {/* Main Navigation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded"></div>
                  <p className="text-yellow-300/70 text-xs uppercase tracking-wider">Menu Chính</p>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500 to-transparent rounded"></div>
                </div>

                <div className="space-y-2">
                  {navItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-slide-down"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Gradient Border */}
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                        currentGame === item.id 
                          ? 'from-yellow-500 to-red-500' 
                          : item.gradient
                      } rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                      {/* Button Content */}
                      <div className={`relative flex items-center justify-between px-4 py-3 rounded-xl ${
                        currentGame === item.id
                          ? 'bg-gradient-to-r from-red-900 to-yellow-900'
                          : 'bg-gray-900'
                      }`}>
                        <span className="text-white font-semibold text-sm">
                          {item.label}
                        </span>
                        
                        {/* Badge or Arrow */}
                        {item.badge ? (
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                        ) : (
                          <svg className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>

                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini Games */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-yellow-500 to-red-500 rounded"></div>
                  <p className="text-yellow-300/70 text-xs uppercase tracking-wider">Mini Games</p>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-red-500 to-transparent rounded"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {gameItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-slide-down"
                      style={{ animationDelay: `${(navItems.length + index) * 0.05}s` }}
                    >
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                      <div className={`relative px-3 py-3 rounded-xl ${
                        currentGame === item.id
                          ? 'bg-gradient-to-r from-red-900 to-yellow-900'
                          : 'bg-gray-900'
                      }`}>
                        <span className="text-white font-semibold text-xs block text-center">
                          {item.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="border-t border-yellow-600/30 pt-4 space-y-2">
                <button
                  onClick={() => {
                    onChangeBg();
                    setShowMobileMenu(false);
                  }}
                  className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                    <span className="text-white font-semibold text-sm">Đổi Nền</span>
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    onLogout();
                    setShowMobileMenu(false);
                  }}
                  className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-700 to-red-500 rounded-xl blur opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-center justify-between bg-red-700 rounded-xl px-4 py-3">
                    <span className="text-white font-bold text-sm">Đăng Xuất</span>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ NOTIFICATION LIST MODAL */}
      {showNotifications && (
        <NotificationList
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isMobileLandscape ? 'p-0 m-0' : ''}`}>
        <div className={`${isMobileLandscape ? 'p-0 m-0 w-screen h-screen flex items-center justify-center bg-black' : 'container mx-auto px-2 sm:px-4 py-4 pb-20 sm:pb-24'}`}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {!isMobileLandscape && (
        <footer className="bg-gradient-to-r from-red-900 to-red-800 border-t-2 border-yellow-400 py-4 sm:py-6 mt-auto relative">
          {/* ⭐ Trang trí hộp quà và chuông ở footer */}
          <img
            src="/assets/image/icons/gift.png"
            alt="Gift"
            className="absolute left-4 bottom-2 w-8 h-8 sm:w-12 sm:h-12 animate-bounce"
            style={{ zIndex: 10, background: 'none' }} // ⭐ THÊM background: 'none'
          />
          <img
            src="/assets/image/icons/bell.png"
            alt="Bell"
            className="absolute right-4 bottom-2 w-8 h-8 sm:w-12 sm:h-12 animate-shake"
            style={{ zIndex: 10, background: 'none' }} // ⭐ THÊM background: 'none'
          />
          
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/90 text-xs sm:text-sm mb-1 sm:mb-2">
              Chúc Tân Xuân - Vạn Sự Như Ý
            </p>
            <p className="text-white/70 text-[10px] sm:text-xs">
              © 2025 Game by <span className="text-tet-yellow font-bold">Mạnh Mơ Màng</span>
            </p>
          </div>
        </footer>
      )}

      {/* ⭐ Trang trí mũ Noel ở góc trên avatar */}
      <style>
      {`
        .avatar-noel {
          position: relative;
        }
        .avatar-noel::after {
          content: '';
          display: block;
          position: absolute;
          top: -10px;
          left: 18px;
          width: 28px;
          height: 28px;
          background: url('/assets/image/icons/santa-hat.png') no-repeat center/contain;
          z-index: 20;
          pointer-events: none;
        }
      `}
      </style>
    </div>
  );
};
