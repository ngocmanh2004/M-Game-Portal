import React, { useEffect } from 'react';

interface ResultPopupProps {
  reward: number;
  onClose: () => void;
}

export const ResultPopup: React.FC<ResultPopupProps> = ({ reward, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-fade-in">
      
      {/* Money Rain - ÍT HƠN */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-money-rain opacity-30"
            style={{
              left: `${10 + i * 10}%`,
              animationDuration: `${2.5 + Math.random() * 1}s`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            💰
          </div>
        ))}
      </div>

      {/* Main Card - NHỎ GỌN */}
      <div className="relative w-full max-w-sm">
        
        {/* Viền Tết đỏ-vàng */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-2xl blur opacity-80 animate-shine"></div>

        {/* Card Content */}
        <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-yellow-950 rounded-2xl p-6 shadow-2xl border border-yellow-600/30">
          
          {/* Góc trang trí Tết - NHỎ */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-red-500 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-yellow-500 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-yellow-500 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-red-500 rounded-br-2xl"></div>

          {/* Icon - NHỎ */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 w-16 h-16 bg-yellow-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-red-600 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title - COMPACT */}
          <h2 className="text-center text-2xl font-bold text-yellow-400 mb-4">
            Chúc Mừng!
          </h2>

          {/* Reward - VỪA PHẢI */}
          <div className="bg-gradient-to-br from-red-900/40 to-yellow-900/40 rounded-xl p-5 border border-yellow-600/40 mb-4">
            <p className="text-center text-yellow-500/70 text-[10px] mb-2 uppercase tracking-widest">
              Phần Thưởng
            </p>
            
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold bg-gradient-to-b from-yellow-300 to-red-500 bg-clip-text text-transparent">
                {reward.toLocaleString('vi-VN')}
              </span>
              <span className="text-2xl font-bold text-yellow-400">đ</span>
            </div>
          </div>

          {/* Button - COMPACT */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg active:scale-95"
          >
            Tiếp Tục Chơi
          </button>
        </div>
      </div>
    </div>
  );
};