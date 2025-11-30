import React from 'react';
import { GameType } from '../types';

interface HomeProps {
  onSelectGame: (game: GameType) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectGame }) => {
  const games = [
    {
      type: GameType.BAU_CUA,
      title: 'Bầu Cua',
      description: 'Trò chơi truyền thống',
      logo: '/assets/image/logos/baucua-noel.png',
      gradient: 'from-red-800 to-red-600',
    },
    {
      type: GameType.TAI_XIU,
      title: 'Tài Xỉu',
      description: 'Xí ngầu may mắn',
      logo: '/assets/image/logos/taixiu-noel.png',
      gradient: 'from-yellow-700 to-yellow-600',
    },
    {
      type: GameType.XOC_DIA,
      title: 'Xóc Đĩa',
      description: 'Chẵn lẻ hấp dẫn',
      logo: '/assets/image/logos/xocdia-noel.png',
      gradient: 'from-red-700 to-yellow-700',
    },
    {
      type: GameType.DAP_HEO,
      title: 'Đập Heo Đất',
      description: 'Nổ hũ phát tài',
      logo: '/assets/image/logos/dapheo-noel.png',
      gradient: 'from-yellow-600 to-red-600',
    },
    {
      type: GameType.TIEN_LEN,
      title: 'Tiến Lên Miền Nam',
      description: 'Đánh bài tiến lên',
      logo: '/assets/image/logos/tienlen-noel.png',
      gradient: 'from-green-800 to-green-600',
    }
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-3 pb-8 pt-2">
      
      {/* Title */}
      <div className="text-center relative w-full">
        <h2 className="font-festive text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-2 drop-shadow-[0_2px_10px_rgba(255,215,0,0.6)]">
          Chọn Trò Chơi
        </h2>
        <div className="h-1 w-24 sm:w-32 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
      </div>

      {/* Game Grid - 2 cột mobile, 4 cột desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 w-full">
        {games.map((game, index) => (
          <button
            key={game.type}
            onClick={() => onSelectGame(game.type)}
            className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl animate-slide-down"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Animated Border */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.gradient} rounded-xl sm:rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity`}></div>

            {/* Content */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              
              {/* Logo */}
              <div className="relative w-full aspect-square mb-2 sm:mb-3 overflow-hidden rounded-lg sm:rounded-xl border-2 border-yellow-600/40 group-hover:border-yellow-500 transition-colors">
                {/* Glow background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20 blur-xl`}></div>
                
                {/* Image */}
                <img 
                  src={game.logo} 
                  alt={game.title}
                  className="relative w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200x200/dc2626/fbbf24?text=' + game.title;
                  }}
                />
              </div>

              {/* Title */}
              <h3 className="font-bold text-base sm:text-lg md:text-xl text-yellow-400 mb-1 text-center">
                {game.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-xs sm:text-sm text-center mb-2 sm:mb-3">
                {game.description}
              </p>

              {/* Play Button */}
              <div className={`relative overflow-hidden rounded-md sm:rounded-lg ${game.gradient} p-0.5 group-hover:scale-105 transition-transform`}>
                <div className="bg-gray-900 rounded-md sm:rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-center">
                  <span className="text-yellow-400 font-semibold text-xs sm:text-sm">
                    Chơi Ngay
                  </span>
                </div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        ))}
      </div>

      {/* Info Card - COMPACT hơn trên desktop */}
      <div className="w-full max-w-4xl bg-gradient-to-br from-red-950/50 to-yellow-950/50 backdrop-blur-sm border border-yellow-600/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="h-0.5 sm:h-1 w-6 sm:w-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded"></div>
          <h3 className="text-yellow-400 font-bold text-xs sm:text-sm md:text-base">
            Hướng Dẫn
          </h3>
          <div className="h-0.5 sm:h-1 flex-1 bg-gradient-to-r from-yellow-500 to-transparent rounded"></div>
        </div>
        
        <ul className="text-gray-300 text-[10px] sm:text-xs md:text-sm space-y-1.5 sm:space-y-2">
          <li className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-red-500 font-bold mt-0.5">•</span>
            <span><strong className="text-yellow-400">Bầu Cua:</strong> Xóc đĩa 6 con vật</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-yellow-500 font-bold mt-0.5">•</span>
            <span><strong className="text-yellow-400">Tài Xỉu:</strong> Lắc 3 xúc xắc, đoán tổng điểm</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-red-500 font-bold mt-0.5">•</span>
            <span><strong className="text-yellow-400">Xóc Đĩa:</strong> 4 đồng xu, đoán Chẵn/Lẻ</span>
          </li>
          <li className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-yellow-500 font-bold mt-0.5">•</span>
            <span><strong className="text-yellow-400">Đập Heo:</strong> Cơ hội nổ hũ lên tới 5 triệu!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
