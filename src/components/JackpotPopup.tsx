import React, { useEffect } from 'react';

interface JackpotPopupProps {
  reward: number;
  onClose: () => void;
}

export const JackpotPopup: React.FC<JackpotPopupProps> = ({ reward, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-fade-in">
      
      {/* Sparkle Rain - ÍT HƠN */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-money-rain"
            style={{
              left: `${5 + i * 8}%`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div className="text-2xl opacity-40">
              {['🧧', '💰', '✨'][i % 3]}
            </div>
          </div>
        ))}
      </div>

      {/* Main Card - NHỎ GỌN */}
      <div className="relative w-full max-w-sm">
        
        {/* Viền Tết sang trọng */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-yellow-400 to-red-600 rounded-2xl blur-md opacity-90 animate-shine"></div>

        {/* Card Content */}
        <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-yellow-950 rounded-2xl p-6 shadow-2xl border border-yellow-500/40">
          
          {/* Góc Tết - NHỎ */}
          <div className="absolute top-0 left-0 w-14 h-14 border-t-2 border-l-2 border-red-500 rounded-tl-2xl opacity-70"></div>
          <div className="absolute top-0 right-0 w-14 h-14 border-t-2 border-r-2 border-yellow-500 rounded-tr-2xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-14 h-14 border-b-2 border-l-2 border-yellow-500 rounded-bl-2xl opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-14 h-14 border-b-2 border-r-2 border-red-500 rounded-br-2xl opacity-70"></div>

          {/* Icon - NHỎ */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 w-20 h-20 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute inset-0 w-20 h-20 border-2 border-yellow-400/30 rounded-full animate-spin-slow"></div>
              
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-600 via-yellow-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="text-4xl">🏆</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300 bg-clip-text text-transparent mb-4">
            JACKPOT!
          </h2>

          {/* Reward - VỪA PHẢI */}
          <div className="bg-gradient-to-br from-red-900/40 to-yellow-900/40 rounded-xl p-6 border-2 border-yellow-500/40 mb-4">
            <p className="text-center text-yellow-400/70 text-[10px] mb-3 uppercase tracking-[0.3em]">
              Phần Thưởng Jackpot
            </p>
            
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-bold bg-gradient-to-b from-yellow-200 via-yellow-400 to-red-500 bg-clip-text text-transparent">
                {reward.toLocaleString('vi-VN')}
              </span>
              <span className="text-3xl font-bold text-yellow-400">đ</span>
            </div>
            
            <p className="text-center text-red-400 text-xs font-medium">
              Thưởng Tối Đa!
            </p>
          </div>

          {/* Stats - COMPACT */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-2 text-center">
              <p className="text-yellow-400/60 text-[9px]">Tỷ Lệ</p>
              <p className="text-white text-xs font-bold">Hiếm</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-2 text-center">
              <p className="text-red-400/60 text-[9px]">Hạng</p>
              <p className="text-white text-xs font-bold">SSS+</p>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-2 text-center">
              <p className="text-yellow-400/60 text-[9px]">Loại</p>
              <p className="text-white text-xs font-bold">Jackpot</p>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 hover:from-red-700 hover:via-yellow-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-xl active:scale-95"
          >
            Nhận Thưởng! 🎁
          </button>
        </div>
      </div>
    </div>
  );
};