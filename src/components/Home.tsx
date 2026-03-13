import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import { Button } from './Button';
import {
  hasStoredAuthToken,
  isAutoLoginBlocked,
  isAutoLoginInProgress,
  isMobileDevice,
  startMezonOAuthLogin,
} from '../utils/mezonOAuth';

interface HomeProps {
  onSelectGame: (game: GameType) => void;
  isAuthenticated?: boolean;
  isAuthLoading?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  onSelectGame,
  isAuthenticated = false,
  isAuthLoading = false,
}) => {
  const [onlinePlayers, setOnlinePlayers] = useState(1248);
  const autoLoginTriggeredRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (autoLoginTriggeredRef.current) return;
    if (!isMobileDevice()) return;
    if (isAuthenticated) return;
    if (hasStoredAuthToken()) return;
    if (isAutoLoginInProgress()) return;
    if (isAutoLoginBlocked()) return;

    autoLoginTriggeredRef.current = true;
    startMezonOAuthLogin();
  }, [isAuthLoading, isAuthenticated]);

  // simulate fluctuation in online players to make the lobby feel "live"
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlinePlayers(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const games = [
    {
      type: GameType.TIEN_LEN,
      title: 'Tiến Lên Miền Nam',
      description: 'Thể hiện đẳng cấp sát phạt',
      logo: '/assets/image/logos/tienlen.png',
      gradient: 'from-emerald-400 to-teal-600',
      badge: 'HOT'
    },
    {
      type: GameType.XI_DACH,
      title: 'Xì Dách',
      description: 'Đỉnh cao Blackjack phong cách Việt',
      logo: '/assets/image/logos/xidach.png',
      gradient: 'from-amber-700 to-neutral-900',
      badge: 'HOT'
    },
    {
      type: GameType.SIEU_TRI_TUE,
      title: 'Ai Thông Minh Hơn?',
      description: 'Hỏi đáp phong cách Kahoot tranh Tốc độ',
      logo: '/assets/image/logos/sieutritue.png',
      gradient: 'from-cyan-400 to-blue-700',
      badge: 'NEW'
    },
    {
      type: GameType.BAU_CUA,
      title: 'Bầu Cua Tôm Cá',
      description: 'Thử thách may rủi mùa lễ hội',
      logo: '/assets/image/logos/baucua.jpg',
      gradient: 'from-orange-500 to-red-600',
      badge: 'HOT'
    },
    {
      type: GameType.TAI_XIU,
      title: 'Tài Xỉu',
      description: 'Lắc xí ngầu phán đoán cực căng',
      logo: '/assets/image/logos/taixiu.jpg',
      gradient: 'from-amber-400 to-orange-600',
    },
    {
      type: GameType.XOC_DIA,
      title: 'Xóc Đĩa',
      description: 'Quân vị sấp ngửa - Cuộc chiến chẵn lẻ',
      logo: '/assets/image/logos/xocdia.jpg',
      gradient: 'from-rose-500 to-red-800',
    },
    {
      type: GameType.DAP_HEO,
      title: 'Đập Heo Đất',
      description: 'Săn Jackpot nổ hũ khổng lồ',
      logo: '/assets/image/logos/dapheo.jpg',
      gradient: 'from-pink-500 to-purple-600',
    },
    
  ];

  return (
    <div className="flex flex-col items-center gap-8 sm:gap-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 pt-2 animate-fade-in-up">

      {/* 1. HERO SECTION */}
      <div className="w-full relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-900 via-[#111827] to-[#312e81] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between border border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[150%] bg-blue-500/20 blur-[120px] rounded-full group-hover:bg-blue-400/30 transition-colors duration-1000"></div>

        <div className="relative z-10 text-center md:text-left max-w-2xl flex flex-col items-center md:items-start space-y-5">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-300 drop-shadow-lg leading-tight">
            Sẵn sàng chinh phục đỉnh cao?
          </h1>
          <p className="text-blue-200/90 text-sm sm:text-lg font-medium tracking-wide max-w-xl">
            Vào ngay một phòng trải nghiệm để so tài cùng hàng ngàn cao thủ khác trên toàn hệ thống M-Game Portal!
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              className="!from-blue-500 !to-indigo-600 px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg shadow-[0_0_30px_rgba(59,130,246,0.4)] border-none text-white tracking-widest uppercase hover:scale-105"
              onClick={() => onSelectGame(GameType.SIEU_TRI_TUE)}
            >
              CHƠI NGAY
            </Button>
          </div>
        </div>

        {/* Hero Graphic */}
        <div className="relative z-10 w-56 h-56 md:w-72 md:h-72 mt-10 md:mt-0 flex-shrink-0 animate-float hidden sm:block">
          <div className="absolute inset-0 bg-blue-500/40 blur-[50px] rounded-full"></div>
          <img
            src="/assets/image/logos/sieutritue.png"
            alt="Featured Game"
            className="relative w-full h-full object-cover rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-2 border-white/20 transform -rotate-6 transition-transform hover:rotate-0 duration-500"
          />
        </div>
      </div>

      {/* 2. LIVE LOBBY STATS */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

        
      </div>

      {/* 3. GAME SELECTION GRID */}
      <div className="w-full mt-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-4 drop-shadow-md">
            Sảnh Chờ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-bold">Minigames</span>
          </h2>
          <div className="h-1 flex-1 max-w-[200px] bg-gradient-to-r from-blue-500 to-transparent rounded-full hidden sm:block ml-4 opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 w-full">
          {games.map((game, index) => (
            <button
              key={game.type}
              onClick={() => onSelectGame(game.type)}
              className="group relative h-[300px] sm:h-[340px] rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 active:scale-[0.98] shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_rgba(59,130,246,0.3)] animate-fade-in-up"
              style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
            >
              {/* Background Poster Image */}
              <div className="absolute inset-0 bg-gray-900">
                <img
                  src={game.logo}
                  alt={game.title}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x400/1e3a8a/60a5fa?text=' + encodeURIComponent(game.title); }}
                />
                {/* Dark Gradient Overlay for optimal text reading */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/70 to-transparent"></div>
              </div>

              {/* Hover Ring/Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none mix-blend-screen`}></div>

              {/* Inner Content Area */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-left z-10">

                {/* Status Badges */}
                {game.badge && (
                  <span className={`absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg uppercase tracking-wider ${game.badge === 'HOT' ? 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                    {game.badge}
                  </span>
                )}

                <h3 className="font-black text-2xl sm:text-3xl text-white mb-2 group-hover:text-yellow-400 transition-colors drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-tight">
                  {game.title}
                </h3>
                <p className="text-gray-300 text-sm font-medium mb-6 drop-shadow-md line-clamp-2 pr-4 leading-relaxed">
                  {game.description}
                </p>

                {/* Call To Action Button built into the Card */}
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${game.gradient} p-[2px] transform origin-left transition-transform`}>
                  <div className="bg-black/40 backdrop-blur-md rounded-[14px] px-5 py-3 flex items-center justify-between group-hover:bg-transparent transition-colors">
                    <span className="text-white font-bold text-sm tracking-widest uppercase">
                      Tham Gia Ngay
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                      <span className="text-white font-bold">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

