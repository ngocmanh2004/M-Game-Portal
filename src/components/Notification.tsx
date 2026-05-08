import React, { useEffect } from 'react';
import { Trophy, TrendingDown, Info, X } from 'lucide-react';

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
      icon: <Trophy className="w-5 h-5" />,
      iconBg: 'bg-yellow-400/20 text-yellow-400',
      bar: 'bg-yellow-400',
      border: 'border-yellow-400/30',
      glow: 'shadow-yellow-500/20',
    },
    loss: {
      icon: <TrendingDown className="w-5 h-5" />,
      iconBg: 'bg-gray-400/20 text-gray-400',
      bar: 'bg-gray-500',
      border: 'border-gray-600/30',
      glow: 'shadow-black/20',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      iconBg: 'bg-orange-400/20 text-orange-400',
      bar: 'bg-orange-400',
      border: 'border-orange-400/30',
      glow: 'shadow-orange-500/20',
    },
  };

  const c = config[type];

  return (
    <div className="fixed top-20 right-4 z-[60] w-[90vw] max-w-sm animate-slide-in-right">
      <div
        className={`relative bg-[#0f0f1e] border ${c.border} rounded-2xl shadow-2xl ${c.glow} overflow-hidden`}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${c.bar} rounded-l-2xl`} />

        <div className="flex items-center gap-3 px-5 py-4 pl-6">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
            {c.icon}
          </div>
          <p className="text-white font-semibold text-sm flex-1 leading-snug">{message}</p>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-0.5 bg-white/[0.04]">
          <div
            className={`h-full ${c.bar} opacity-60 animate-shrink-x`}
            style={{ animation: 'shrink 3s linear forwards' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
};