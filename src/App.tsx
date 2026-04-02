import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { BauCua } from './components/BauCua';
import { TaiXiu } from './components/TaiXiu';
import { XocDia } from './components/XocDia';
import { DapHeo } from './components/DapHeo';
import { Dashboard } from './components/Dashboard';
import { Shop } from './components/Shop';
import { Profile } from './components/Profile';
import { Inventory } from './components/Inventory';
import { Leaderboard } from './components/Leaderboard';
import { Notification } from './components/Notification';
import { AdminPanel } from './components/admin/AdminPanel';
import { Friends } from './components/Friends';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { GameType, SoundType } from './types';
import { SOUNDS, BACKGROUNDS_DESKTOP, BACKGROUNDS_MOBILE } from './constants';
import './App.css';
import { UserProfileModal } from './components/UserProfileModal';
import { TienLen } from './components/TienLen/TienLen';
import { XiDach } from './components/XiDach/lobby/XiDach';
import { CaCaNgu } from './components/CaCaNgu/CaCaNgu';
import { AiThongMinhHon } from './components/SieuTriTue/AiThongMinhHon/AiThongMinhHon';
import { MezonCallback } from './components/MezonCallback';
import { hasStoredAuthToken } from './utils/mezonOAuth';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { userData, loading: userLoading, updateMoney, updateTask, checkin } = useUserData(user?.uid);

  const [currentGame, setCurrentGame] = useState<GameType>(GameType.HOME);
  const [isMuted, setIsMuted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'win' | 'loss' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isPlayingInternalMusic, setIsPlayingInternalMusic] = useState(false);

  const authProviderLabel = (() => {
    if (!user) return 'Tài khoản';

    const providerIds = user.providerData.map((provider) => provider.providerId);
    if (providerIds.includes('google.com')) return 'Google';
    if (providerIds.includes('password')) return 'Email';
    if (providerIds.includes('custom') || hasStoredAuthToken()) return 'Mezon';

    return 'Tài khoản';
  })();

  // ⭐ Kiểm tra xem có đang ở trang callback của Mezon không
  const isMezonCallback = window.location.pathname === '/mezon-callback';
  const [mezonError, setMezonError] = useState<string | null>(null);

  const handleSetPlayingInternalMusic = useCallback((isPlaying: boolean) => {
    setIsPlayingInternalMusic(isPlaying);
  }, []);

  const soundRefs = useRef<{ [key in SoundType]?: HTMLAudioElement }>({});
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize sounds
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, path]) => {
      if (key === 'bgMusic') {
        bgMusicRef.current = new Audio(path);
        bgMusicRef.current.loop = true;
        bgMusicRef.current.volume = 0.3;
      } else {
        soundRefs.current[key as SoundType] = new Audio(path);
      }
    });

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

  // Control background music
  useEffect(() => {
    // Stop BG music if muted, logged out, or if the current game is playing its own music
    if (user && !isMuted && !isPlayingInternalMusic && bgMusicRef.current) {
      bgMusicRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    } else if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
  }, [user, isMuted, isPlayingInternalMusic]);

  const playSound = (type: SoundType) => {
    if (isMuted) return;
    const sound = soundRefs.current[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.log('Sound play error:', err));
    }
  };

  const toggleSound = () => setIsMuted(!isMuted);

  const handleShowNotification = (message: string, type: 'win' | 'loss') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoHome = () => setCurrentGame(GameType.HOME);

  // ⭐ THÊM handleLogout
  const handleLogout = async () => {
    try {
      await logout();
      setCurrentGame(GameType.HOME);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Determine background
  const isMobile = window.innerWidth < 768;
  const backgrounds = isMobile ? BACKGROUNDS_MOBILE : BACKGROUNDS_DESKTOP;
  const bgImage = backgrounds[bgIndex]?.url || backgrounds[0].url;

  const handleChangeBg = () => {
    setBgIndex((prev) => (prev + 1) % backgrounds.length);
  };

  // ⭐ GỘP TẤT CẢ useEffect BACKGROUND THÀNH 1:
  useEffect(() => {
    if (user && userData?.background) {
      document.body.style.backgroundImage = `url(${userData.background})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = bgImage ? `url(${bgImage})` : '';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundRepeat = 'no-repeat';
    }

    return () => {
      document.body.style.backgroundImage = '';
    };
  }, [user, userData?.background, bgImage]);

  // ⭐ EVENT LISTENER CHO BACKGROUND UPDATE
  useEffect(() => {
    const handleBackgroundUpdate = (event: any) => {
      const { backgroundUrl } = event.detail;
      if (backgroundUrl) {
        document.body.style.backgroundImage = `url(${backgroundUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
      }
    };

    window.addEventListener('background-updated', handleBackgroundUpdate);

    return () => {
      window.removeEventListener('background-updated', handleBackgroundUpdate);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-yellow-900">
        <div className="text-white text-2xl animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (isMezonCallback) {
    return (
      <MezonCallback 
        onSuccess={() => {
          // Firebase tự động cập nhật auth state, App sẽ re-render vì useAuth()
          window.location.href = '/';
        }} 
        onError={(msg) => setMezonError(msg)} 
      />
    );
  }

  if (!user) {
    return (
      <>
        {mezonError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
            ❌ {mezonError}
          </div>
        )}
        <Auth />
      </>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-yellow-900">
        <div className="text-white text-2xl animate-pulse">Đang tải dữ liệu...</div>
      </div>
    );
  }

  const commonProps = {
    balance: userData.money,
    updateBalance: updateMoney,
    onShowNotification: handleShowNotification,
    playSound: playSound
  };

  const renderGame = () => {
    switch (currentGame) {
      case GameType.HOME:
        return (
          <Home
            onSelectGame={setCurrentGame}
            isAuthenticated={Boolean(user)}
            isAuthLoading={authLoading}
          />
        );

      case GameType.DASHBOARD:
        return <Dashboard playSound={playSound} />;

      case GameType.BAU_CUA:
        return <BauCua {...commonProps} />;

      case GameType.TAI_XIU:
        return <TaiXiu {...commonProps} />;

      case GameType.XOC_DIA:
        return <XocDia {...commonProps} />;

      case GameType.DAP_HEO:
        return <DapHeo {...commonProps} />;

      case GameType.SHOP:
        return (
          <Shop
            userId={user?.uid}
            userMoney={userData.money}
            onShowNotification={handleShowNotification}
            playSound={playSound}
          />
        );

      case GameType.PROFILE:
        return <Profile />;

      case GameType.INVENTORY:
        return (
          <Inventory
            userId={user?.uid}
            onShowNotification={handleShowNotification}
            playSound={playSound}
            updateMoney={updateMoney}
          />
        );

      case GameType.LEADERBOARD:
        return <Leaderboard />;

      case GameType.ADMIN_PANEL:
        return (
          <AdminPanel
            onShowNotification={handleShowNotification}
          />
        );

      case GameType.FRIENDS:
        return <Friends />;

      case GameType.TIEN_LEN:
        return (
          <TienLen
            user={{
              uid: user.uid,
              username: userData.nickname || (userData.email || user.email || '').split('@')[0], // ép về string
              email: userData.email || user.email || "",
              balance: userData.money,
              avatar: userData.avatar,
              background: userData.background,
            }}
            onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
          />
        );

      case GameType.XI_DACH:
        return (
          <XiDach
            user={{
              uid: user.uid,
              username: userData.nickname || (userData.email || user.email || '').split('@')[0],
              email: userData.email || user.email || "",
              balance: userData.money,
              avatar: userData.avatar,
              background: userData.background,
            }}
            onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
          />
        );

      case GameType.CO_CA_NGU:
        return (
          <CaCaNgu
            user={{
              uid: user.uid,
              username: userData.nickname || (userData.email || user.email || '').split('@')[0],
              email: userData.email || user.email || "",
              balance: userData.money,
              avatar: userData.avatar,
              background: userData.background,
            }}
            onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
          />
        );

      case GameType.SIEU_TRI_TUE:
        return (
          <AiThongMinhHon
            user={{
              uid: user.uid,
              username: userData.nickname || (userData.email || user.email || '').split('@')[0],
              email: userData.email || user.email || "",
              balance: userData.money,
              avatar: userData.avatar,
              background: userData.background,
            }}
            onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
          />
        );

      default:
        return <Home onSelectGame={setCurrentGame} />;
    }
  };

  const getTitle = () => {
    switch (currentGame) {
      case GameType.HOME: return 'Trang Chủ';
      case GameType.DASHBOARD: return 'Bảng Điều Khiển';
      case GameType.BAU_CUA: return 'Bầu Cua Tôm Cá';
      case GameType.TAI_XIU: return 'Tài Xỉu';
      case GameType.XOC_DIA: return 'Xóc Đĩa';
      case GameType.DAP_HEO: return 'Đập Heo Đất';
      case GameType.SHOP: return 'Cửa Hàng';
      case GameType.PROFILE: return 'Hồ Sơ';
      case GameType.INVENTORY: return 'Túi Đồ';
      case GameType.LEADERBOARD: return 'Bảng Xếp Hạng';
      case GameType.TIEN_LEN: return 'Tiến Lên';
      case GameType.XI_DACH: return 'Xì Dách';
      case GameType.CO_CA_NGU: return 'Cờ Cá Ngựa';
      default: return 'Game Tết';
    }
  };

  // TienLen tự quản lý UI toàn màn hình, không cần header/footer của Layout
  if (currentGame === GameType.TIEN_LEN) {
    return (
      <TienLen
        user={{
          uid: user.uid,
          username: userData.nickname || (userData.email || user.email || '').split('@')[0],
          email: userData.email || user.email || "",
          balance: userData.money,
          avatar: userData.avatar,
          background: userData.background,
        }}
        onGoHome={() => setCurrentGame(GameType.HOME)}
        onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
      />
    );
  }

  // XiDach tự quản lý UI toàn màn hình, không cần header/footer của Layout
  if (currentGame === GameType.XI_DACH) {
    return (
      <XiDach
        user={{
          uid: user.uid,
          username: userData.nickname || (userData.email || user.email || '').split('@')[0],
          email: userData.email || user.email || "",
          balance: userData.money,
          avatar: userData.avatar,
          background: userData.background,
        }}
        onGoHome={() => setCurrentGame(GameType.HOME)}
        onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
      />
    );
  }

  if (currentGame === GameType.CO_CA_NGU) {
    return (
      <CaCaNgu
        user={{
          uid: user.uid,
          username: userData.nickname || (userData.email || user.email || '').split('@')[0],
          email: userData.email || user.email || "",
          balance: userData.money,
          avatar: userData.avatar,
          background: userData.background,
        }}
        onGoHome={() => setCurrentGame(GameType.HOME)}
        onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
      />
    );
  }

  if (currentGame === GameType.SIEU_TRI_TUE) {
    return (
      <AiThongMinhHon
        user={{
          uid: user.uid,
          username: userData.nickname || (userData.email || user.email || '').split('@')[0],
          email: userData.email || user.email || "",
          balance: userData.money,
          avatar: userData.avatar,
          background: userData.background,
        }}
        onGoHome={() => setCurrentGame(GameType.HOME)}
        onSetPlayingInternalMusic={handleSetPlayingInternalMusic}
      />
    );
  }

  return (
    <Layout
      user={{
        username: userData.nickname || (userData.email || "").split('@')[0],
        balance: userData.money,
        email: userData.email,
        uid: user.uid,
        avatar: userData.avatar || undefined,
        background: userData.background || undefined
      }}
      authProviderLabel={authProviderLabel}
      onGoHome={handleGoHome}
      onLogout={handleLogout}  // ⭐ SỬA ĐÂY
      title={getTitle()}
      isMuted={isMuted}
      toggleSound={toggleSound}
      bgImage={bgImage}
      onChangeBg={handleChangeBg}
      currentGame={currentGame}
      onNavigate={setCurrentGame}
    >
      {renderGame()}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Danh sách bạn bè */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-white/10 rounded-xl p-4 max-w-lg w-full">
            <button
              className="absolute top-2 right-2 text-red-500 text-xl font-bold z-10"
              onClick={() => setSelectedUser(null)}
            >
              ✖
            </button>
            <UserProfileModal userId={selectedUser} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
