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
  const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('mgame_muted') === 'true');
  const [bgIndex, setBgIndex] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'win' | 'loss' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isPlayingInternalMusic, setIsPlayingInternalMusic] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentGame]);


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
  const loginMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const musicLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DEFAULT_MUSIC = '/assets/audio/tet-music.mp3';
  const LOGIN_MUSIC = '/assets/audio/login-music.mp3';
  const GAME_MUSIC_STT = '/assets/audio/ai-thong-minh-hon-music.mp3';
  const BASE_VOLUME = 0.45;

  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, path]) => {
      if (key === 'bgMusic') {
        bgMusicRef.current = new Audio(path);
        bgMusicRef.current.loop = false;
        bgMusicRef.current.volume = BASE_VOLUME;
      } else {
        soundRefs.current[key as SoundType] = new Audio(path);
      }
    });
    loginMusicRef.current = new Audio(LOGIN_MUSIC);
    loginMusicRef.current.loop = true;
    loginMusicRef.current.volume = BASE_VOLUME;
    gameMusicRef.current = new Audio(GAME_MUSIC_STT);
    gameMusicRef.current.loop = true;
    gameMusicRef.current.volume = BASE_VOLUME * 0.5;

    return () => {
      bgMusicRef.current?.pause();
      loginMusicRef.current?.pause();
      gameMusicRef.current?.pause();
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
    };
  }, []);

  const playWithUnlockFallback = (audio: HTMLAudioElement) => {
    audio.play().catch(() => {
      const unlock = () => audio.play().catch(() => {});
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    });
  };

  useEffect(() => {
    if (authLoading) return;

    if (isMuted) {
      loginMusicRef.current?.pause();
      bgMusicRef.current?.pause();
      gameMusicRef.current?.pause();
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
      return;
    }

    if (!user) {
      bgMusicRef.current?.pause();
      gameMusicRef.current?.pause();
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
      if (loginMusicRef.current?.paused) {
        playWithUnlockFallback(loginMusicRef.current);
      }
    } else {
      loginMusicRef.current?.pause();
    }
  }, [authLoading, user, isMuted]);

  useEffect(() => {
    if (!bgMusicRef.current) return;
    const targetSrc = userData?.activeMusic || DEFAULT_MUSIC;
    const currentPath = bgMusicRef.current.src
      ? new URL(bgMusicRef.current.src).pathname : '';
    const targetPath = new URL(targetSrc, window.location.origin).pathname;
    if (currentPath !== targetPath) {
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
      bgMusicRef.current.pause();
      bgMusicRef.current.src = targetSrc;
      bgMusicRef.current.load();
      if (user && !isMuted && !isPlayingInternalMusic) {
        playWithUnlockFallback(bgMusicRef.current);
      }
    }
  }, [userData?.activeMusic]);

  useEffect(() => {
    if (!user || !bgMusicRef.current) return;
    if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
    bgMusicRef.current.currentTime = 0;
  }, [user?.uid]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { audioUrl } = (e as CustomEvent).detail;
      if (!bgMusicRef.current || isMuted || isPlayingInternalMusic) return;
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
      loginMusicRef.current?.pause();
      gameMusicRef.current?.pause();
      bgMusicRef.current.pause();
      bgMusicRef.current.src = audioUrl;
      bgMusicRef.current.load();
      playWithUnlockFallback(bgMusicRef.current);
    };
    window.addEventListener('music-updated', handler);
    return () => window.removeEventListener('music-updated', handler);
  }, [isMuted, isPlayingInternalMusic]);

  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio || authLoading) return;

    if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);

    const handleEnded = () => {
      musicLoopTimerRef.current = setTimeout(() => {
        if (!isMuted && !isPlayingInternalMusic && user) {
          audio.currentTime = 0;
          playWithUnlockFallback(audio);
        }
      }, 3000);
    };

    audio.removeEventListener('ended', handleEnded);
    audio.addEventListener('ended', handleEnded);

    if (user && !isMuted && !isPlayingInternalMusic && currentGame !== GameType.SIEU_TRI_TUE) {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = DEFAULT_MUSIC;
        audio.load();
      }
      playWithUnlockFallback(audio);
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      if (musicLoopTimerRef.current) clearTimeout(musicLoopTimerRef.current);
    };
  }, [user?.uid, isMuted, isPlayingInternalMusic, currentGame]);

  useEffect(() => {
    const bg = bgMusicRef.current;
    const gm = gameMusicRef.current;
    if (!bg || !user) return;

    const inCardGame = currentGame === GameType.TIEN_LEN || currentGame === GameType.XI_DACH;
    const inSTT = currentGame === GameType.SIEU_TRI_TUE;

    if (isMuted) {
      gm?.pause();
      return;
    }

    if (inSTT) {
      bg.pause();
      if (gm?.paused) playWithUnlockFallback(gm);
    } else {
      gm?.pause();
      bg.volume = inCardGame ? BASE_VOLUME * 0.7 : BASE_VOLUME;
      if (bg.paused && !isPlayingInternalMusic) playWithUnlockFallback(bg);
    }
  }, [currentGame, user, isMuted]);

  const playSound = (type: SoundType) => {
    if (isMuted) return;
    const sound = soundRefs.current[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => console.log('Sound play error:', err));
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('mgame_muted', String(next));
  };

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
            onGoHome={() => setCurrentGame(GameType.HOME)}
            isMuted={isMuted}
            toggleSound={toggleSound}
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
            onGoHome={() => setCurrentGame(GameType.HOME)}
            isMuted={isMuted}
            toggleSound={toggleSound}
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
            onGoHome={() => setCurrentGame(GameType.HOME)}
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
            onGoHome={() => setCurrentGame(GameType.HOME)}
            isMuted={isMuted}
            toggleSound={toggleSound}
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
        isMuted={isMuted}
        toggleSound={toggleSound}
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
        isMuted={isMuted}
        toggleSound={toggleSound}
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
        isMuted={isMuted}
        toggleSound={toggleSound}
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
