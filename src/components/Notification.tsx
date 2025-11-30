import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'win' | 'loss' | 'info';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    win: {
      bg: 'from-red-600 via-yellow-500 to-red-600',
      border: 'border-yellow-400',
      shadow: 'shadow-[0_0_30px_rgba(234,179,8,0.6)]'
    },
    loss: {
      bg: 'from-gray-800 via-gray-700 to-gray-900',
      border: 'border-gray-600',
      shadow: 'shadow-[0_0_20px_rgba(107,114,128,0.4)]'
    },
    info: {
      bg: 'from-orange-600 via-yellow-500 to-orange-600',
      border: 'border-orange-400',
      shadow: 'shadow-[0_0_25px_rgba(249,115,22,0.5)]'
    }
  };

  const style = config[type];

  return (
    <div className="fixed top-20 right-4 z-[60] max-w-[85vw] sm:max-w-sm animate-slide-in-right">
      <div className="relative">
        {/* Animated Glow */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${style.bg} blur-xl opacity-75 animate-pulse rounded-xl`}></div>
        
        {/* Main Card */}
        <div className={`relative bg-gradient-to-r ${style.bg} rounded-xl border-4 ${style.border} ${style.shadow}`}>
          
          {/* Decorative corners - TẾT */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-yellow-300 rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-yellow-300 rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-yellow-300 rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-yellow-300 rounded-br-lg"></div>

          {/* Content */}
          <div className="relative px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-white font-black text-lg sm:text-xl break-words flex-1 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {message}
              </p>
              
              <button 
                onClick={onClose}
                className="shrink-0 w-7 h-7 bg-white/30 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors border-2 border-white/50"
              >
                <svg className="w-4 h-4 text-white font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom shine line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-b-lg"></div>
        </div>
      </div>
    </div>
  );
};