import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';
import { User, GameType } from '../types';
import { ASSETS, DEFAULT_AVATAR } from '../constants';
import { useUserData } from '../hooks/useUserData';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { NotificationList } from './NotificationList';
import { Footer } from './Footer';
import { SupportModal } from './SupportModal';
import { LuckyWheelPopup } from './shared/LuckyWheelPopup';
import { trackQuestProgress } from '../hooks/useDailyQuests';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  authProviderLabel?: string;
  onGoHome: () => void;
  onLogout: () => void;
  title: string;
  isMuted: boolean;
  toggleSound: () => void;
  bgImage: string;
  onChangeBg: () => void;
  currentGame: GameType;
  onNavigate: (game: GameType) => void;
  showSupport?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  authProviderLabel = 'Tài khoản',
  onGoHome,
  onLogout,
  title,
  children,
  isMuted,
  toggleSound,
  bgImage,
  onChangeBg,
  currentGame,
  onNavigate,
  showSupport: initialShowSupport = false
}) => {
  const [isSupportOpen, setIsSupportOpen] = useState(initialShowSupport);

  useEffect(() => {
    if (initialShowSupport) setIsSupportOpen(true);
  }, [initialShowSupport]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false); // ⭐ Auto open logic

  const { userData } = useUserData(user.uid);
  const { notifications, unreadCount } = useUserNotifications(user.uid); // ⭐ THÊM

  // ⭐ CHECK ADMIN
  const isAdmin = userData?.isAdmin || false;

  useEffect(() => {
    if (user?.uid) {
      trackQuestProgress(user.uid, 'login', 1);
    }
  }, [user?.uid]);

  // ⭐ AUTO OPEN LUCKY WHEEL
  useEffect(() => {
    if (userData && !hasAutoOpened) {
      const today = new Date().toISOString().split('T')[0];
      // Nếu ngày quay cuối cùng khác hôm nay (nghĩa là đăng nhập lần đầu trong ngày mới)
      if (userData.lastSpinDate !== today) {
        setShowLuckyWheel(true);
        setHasAutoOpened(true);
      }
    }
  }, [userData, hasAutoOpened]);

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
  ];

  // Admin item appended conditionally
  if (isAdmin) {
    navItems.push({ id: 'ADMIN_PANEL' as GameType, label: 'Admin', badge: false, gradient: 'from-purple-600 to-indigo-600' });
  }



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
      {/* ============ NAVBAR ============ */}
      {!isMobileLandscape && (
        <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="w-full max-w-[1400px] mx-auto px-6">
            <div className="flex items-center justify-between h-16 gap-4">

              {/* LOGO */}
              <button
                onClick={onGoHome}
                className="flex items-center gap-2.5 hover:scale-105 transition-transform shrink-0"
              >
                <img
                  src="/assets/image/logos/logoWeb.png"
                  alt="M-GAME Logo"
                  className="w-9 h-9 rounded-xl object-contain"
                />
                <span className="text-lg font-black text-white hidden sm:block tracking-tight">
                  M-GAME
                </span>
              </button>

              {/* DESKTOP NAV — all items flat, no dropdown */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-center mx-4">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      relative px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap
                      transition-all duration-200 active:scale-95
                      ${currentGame === item.id && item.id !== GameType.DASHBOARD
                        ? 'bg-white/25 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-105'
                      }
                    `}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></span>
                    )}
                  </button>
                ))}
              </nav>

              {/* USER PANEL — desktop */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {/* Money badge */}
                <div className="bg-yellow-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-md select-none flex items-center gap-2">
                  <span>💰 {formatCurrency(user.balance)}</span>
                </div>

                {/* Notification bell */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Thông báo"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Avatar + username */}
                <button
                  onClick={() => onNavigate(GameType.PROFILE)}
                  className="flex items-center gap-2 hover:bg-white/10 rounded-xl px-2 py-1.5 transition-all"
                >
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                  />
                  <span className="text-white text-sm font-semibold max-w-[120px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                <span className="text-[11px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {authProviderLabel}
                </span>

                {/* Sound */}
                <button onClick={toggleSound} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all" title={isMuted ? 'Bật âm' : 'Tắt âm'}>
                  <img src={isMuted ? ASSETS.soundOff : ASSETS.soundOn} alt="Sound" className="w-5 h-5" />
                </button>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 hover:text-white font-bold px-4 py-1.5 rounded-xl transition-all text-sm active:scale-95"
                >
                  Đăng xuất
                </button>
              </div>

              {/* MOBILE RIGHT */}
              <div className="flex md:hidden items-center gap-2">
                {/* Money */}
                <div className="bg-yellow-400 text-black font-black text-xs px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                  <span>💰 {formatCurrency(user.balance)}</span>
                </div>

                {/* Notification */}
                <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-black">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Hamburger */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                >
                  <div className="w-5 h-4 flex flex-col justify-between">
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? 'opacity-0 scale-x-0' : ''}`}></span>
                    <span className={`block h-0.5 bg-white rounded transition-all ${showMobileMenu ? '-rotate-45 -translate-y-[9px]' : ''}`}></span>
                  </div>
                  {hasUnfinishedTasks && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse"></span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </header>
      )}

      {/* Desktop nav is embedded inside the header above */}

      {/* ============ MOBILE FULL-SCREEN DRAWER ============ */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[9000] bg-black/95 backdrop-blur-xl animate-fade-in" style={{ top: '64px' }}>
          <div className="h-full overflow-y-auto pb-8">

            {/* Avatar / Profile row */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
              <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{user.email?.split('@')[0]}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
                <p className="text-blue-300 text-[11px] mt-0.5">{authProviderLabel}</p>
              </div>
              <div className="bg-yellow-400 text-black font-black text-xs px-3 py-1.5 rounded-full">
                {formatCurrency(user.balance)}
              </div>
            </div>

            {/* Nav items — all core pages */}
            <div className="px-4 py-4 space-y-1.5">
              <p className="text-gray-500 text-xs uppercase tracking-wider font-bold px-2 mb-3">Menu</p>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-between
                    ${currentGame === item.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
              ))}

              <div className="border-t border-white/10 pt-3 mt-3 space-y-1.5">
                <button
                  onClick={() => { onChangeBg(); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl font-semibold text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-transparent"
                >
                  Đổi Nền
                </button>
                <button
                  onClick={() => { onLogout(); setShowMobileMenu(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl font-semibold text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-all active:scale-95 border border-red-500/20"
                >
                  Đăng xuất
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

      <main className={`flex-1 overflow-auto ${isMobileLandscape ? 'p-0 m-0' : ''}`}>
        <div className={`${isMobileLandscape ? 'p-0 m-0 w-screen h-screen flex items-center justify-center bg-black' : 'container mx-auto px-2 sm:px-4 py-4 pb-20 sm:pb-24'}`}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {!isMobileLandscape && (
        <Footer
          onNavigate={onNavigate}
          onOpenSupport={() => setIsSupportOpen(true)}
        />
      )}

      {/* Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Lucky Wheel Modal */}
      {showLuckyWheel && (
        <LuckyWheelPopup
          uid={user?.uid || ''}
          onClose={() => setShowLuckyWheel(false)}
        />
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
