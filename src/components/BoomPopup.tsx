import React, { useEffect } from 'react';

interface BoomPopupProps {
  onClose: () => void;
}

export const BoomPopup: React.FC<BoomPopupProps> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-fade-in">
      
      {/* Explosion Particles - ÍT HƠN */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(16)].map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const distance = 120 + Math.random() * 80;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                animation: `explosion 0.8s ease-out ${i * 0.03}s forwards`,
                '--random-x': 0.5 + Math.cos(angle) * distance / 350,
                '--random-y': 0.5 + Math.sin(angle) * distance / 350,
              } as React.CSSProperties}
            >
              <div className={`w-2 h-2 rounded-full ${['bg-red-500', 'bg-orange-500', 'bg-yellow-400'][i % 3]} blur-sm`}></div>
            </div>
          );
        })}
      </div>

      {/* Main Card - NHỎ GỌN */}
      <div className="relative w-full max-w-sm">
        
        {/* Viền đỏ nguy hiểm */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-700 via-orange-600 to-red-700 rounded-2xl blur opacity-90 animate-shine"></div>

        {/* Card Content */}
        <div className="relative bg-gradient-to-br from-red-950 via-orange-950 to-red-950 rounded-2xl p-6 shadow-2xl border border-red-600/40">
          
          {/* Góc nguy hiểm - NHỎ */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-red-500 rounded-tl-2xl opacity-60"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-orange-500 rounded-tr-2xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-orange-500 rounded-bl-2xl opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-red-500 rounded-br-2xl opacity-60"></div>

          {/* Icon - NHỎ */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 w-16 h-16 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute inset-0 w-16 h-16 border-2 border-red-400/30 rounded-full animate-ping"></div>
              
              <div className="relative w-16 h-16 bg-gradient-to-br from-red-700 to-orange-700 rounded-full flex items-center justify-center shadow-xl animate-shake">
                <div className="text-3xl">💣</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-red-300 via-orange-400 to-red-300 bg-clip-text text-transparent mb-4">
            BOOM!
          </h2>

          {/* Loss Display - COMPACT */}
          <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-xl p-6 border-2 border-red-600/40 mb-4">
            <p className="text-center text-red-400/70 text-[10px] mb-3 uppercase tracking-[0.3em]">
              Số Tiền Mất
            </p>
            
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold bg-gradient-to-b from-red-300 to-orange-500 bg-clip-text text-transparent line-through decoration-2 decoration-red-500">
                0
              </span>
              <span className="text-3xl font-bold text-red-400">đ</span>
            </div>
            
            <p className="text-center text-orange-400 text-xs mt-3">
              Mất Trắng!
            </p>
          </div>

          {/* Warning - COMPACT */}
          <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-center text-red-300 text-xs">
              Cẩn thận lần sau nhé!
            </p>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-800 hover:to-orange-800 text-white font-semibold py-3 rounded-lg transition-all shadow-lg active:scale-95"
          >
            Thử Lại 🔄
          </button>
        </div>
      </div>
    </div>
  );
};