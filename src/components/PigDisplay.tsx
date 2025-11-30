import React from 'react';
import { PigType } from '../types';

interface PigDisplayProps {
  pig: PigType | null;
  isSmashing: boolean;
}

export const PigDisplay: React.FC<PigDisplayProps> = ({ pig, isSmashing }) => {
  if (!pig) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64 md:h-80">
        <div className="text-center text-white/60">
          <div className="text-5xl sm:text-6xl md:text-7xl mb-3 opacity-30 animate-bounce">🐷</div>
          <p className="text-base sm:text-lg md:text-xl font-bold">
            Chọn heo để bắt đầu!
          </p>
        </div>
      </div>
    );
  }

  // ⭐ Border animation theo loại heo
  const getBorderClass = () => {
    if (isSmashing) return 'border-red-500 animate-ping';
    switch(pig.id) {
      case 'diamond': return 'rainbow-border'; // ⭐ Viền 7 màu động
      case 'golden': return 'golden-glow';
      case 'silver': return 'silver-glow';
      case 'clay': return 'clay-glow';
      default: return 'basic-glow';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
      <div className="relative">
        <div 
          className={`
            relative
            w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64
            rounded-full overflow-hidden
            border-8
            shadow-2xl
            transition-all duration-300
            ${getBorderClass()}
            ${isSmashing && pig.id !== 'diamond' ? 'animate-shake-hard scale-110' : pig.id !== 'diamond' ? 'animate-bounce-slow' : ''}
          `}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${pig.color} opacity-30`}></div>
          
          {/* Pig Image */}
          <img 
            src={pig.image}
            alt={pig.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300/ff6b6b/ffffff?text=🐷';
            }}
          />

          {/* Sparkles overlay cho Diamond */}
          {pig.id === 'diamond' && !isSmashing && (
            <>
              <div className="absolute top-4 right-4 text-3xl animate-ping">✨</div>
              <div className="absolute bottom-4 left-4 text-3xl animate-ping delay-150">💎</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl animate-pulse">👑</div>
            </>
          )}

          {/* Golden glow cho Golden */}
          {pig.id === 'golden' && !isSmashing && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-transparent animate-pulse"></div>
          )}
        </div>

        {/* ⭐ SMASH EFFECT - ĐẸP HƠN */}
        {isSmashing && (
          <>
            {/* Explosion Ring */}
            <div className="absolute inset-0 border-8 border-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-8 border-orange-500 rounded-full animate-ping delay-75"></div>
            <div className="absolute inset-0 border-8 border-red-500 rounded-full animate-ping delay-150"></div>
            
            {/* Hammer */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-6xl sm:text-7xl md:text-8xl animate-bounce">
                🔨
              </div>
            </div>

            {/* Particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 text-3xl sm:text-4xl animate-smash-particle"
                style={{
                  '--tx': `${Math.cos((i * Math.PI) / 4) * 100}px`,
                  '--ty': `${Math.sin((i * Math.PI) / 4) * 100}px`,
                  animationDelay: `${i * 0.05}s`
                } as React.CSSProperties}
              >
                💥
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pig Name */}
      <div className="bg-white/20 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-full border-4 border-tet-gold/50">
        <h2 className="font-festive text-xl sm:text-2xl md:text-3xl text-tet-yellow drop-shadow-lg">
          {pig.name}
        </h2>
      </div>

      {/* Reward Hint */}
      <div className="text-center">
        <p className="text-white/80 text-xs sm:text-sm">
          💰 Có thể nhận:
        </p>
        <p className="text-tet-yellow font-bold text-base sm:text-lg md:text-xl drop-shadow-lg">
          {pig.minReward.toLocaleString('vi-VN')}đ - {pig.maxReward.toLocaleString('vi-VN')}đ
        </p>
        <p className="text-green-300 font-bold text-sm sm:text-base mt-1 animate-pulse">
          🎰 Jackpot: {pig.jackpotReward.toLocaleString('vi-VN')}đ
        </p>
      </div>
    </div>
  );
};