import React from 'react';
import { PigType } from '../types';
import { formatCurrency } from '../utils';

interface PigCardProps {
  pig: PigType;
  onPurchase: (pig: PigType) => void;
  balance: number;
  disabled: boolean;
}

export const PigCard: React.FC<PigCardProps> = ({ pig, onPurchase, balance, disabled }) => {
  const canAfford = balance >= pig.price;

  const getBorderAnimation = (pigId: string) => {
    // 4 heo cuối dùng rainbow-border-super
    if (['superman', 'thanos', 'doraemon', 'songoku'].includes(pigId)) return 'rainbow-border-super';
    if (pigId === 'diamond') return 'diamond-glow';
    if (pigId === 'golden') return 'golden-glow';
    if (pigId === 'silver') return 'silver-glow';
    if (pigId === 'clay') return 'clay-glow';
    return 'basic-glow';
  };

  const getSilverStyle = (pigId: string) => {
    if (pigId === 'silver') {
      return {
        background: 'linear-gradient(90deg, #c0c0c0 0%, #ffffff 50%, #c0c0c0 100%)',
        backgroundSize: '200% 100%',
      };
    }
    return {};
  };

  // Handler cho nút Mua Ngay
  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn event bubble lên card
    if (canAfford && !disabled) {
      onPurchase(pig);
    }
  };

  return (
    <div
      className={`
        relative group overflow-hidden
        bg-gradient-to-br ${pig.color}
        rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5
        border-4
        shadow-2xl
        transition-all duration-300
        ${disabled ? 'opacity-50' : ''}
        ${canAfford && !disabled ? getBorderAnimation(pig.id) : 'border-white/30'}
      `}
      style={getSilverStyle(pig.id)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]"></div>
      </div>

      {/* Sparkles cho heo kim cương */}
      {pig.id === 'diamond' && canAfford && !disabled && (
        <>
          <div className="absolute top-2 right-2 text-xl animate-ping opacity-70">✨</div>
          <div className="absolute bottom-2 left-2 text-xl animate-ping delay-100 opacity-70">💎</div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
        
        {/* Rarity Badge */}
        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border-2 border-white shadow-lg">
          {pig.rarity}
        </div>

        {/* PIG IMAGE */}
        <div className={`
          relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
          rounded-full overflow-hidden
          border-4 border-white/50
          transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500
          ${pig.id === 'diamond' ? 'shadow-[0_0_30px_rgba(0,255,255,0.8)]' : ''}
          ${pig.id === 'golden' ? 'shadow-[0_0_20px_rgba(255,215,0,0.8)]' : ''}
        `}>
          <img 
            src={pig.image} 
            alt={pig.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/100x100/ff6b6b/ffffff?text=🐷';
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20"></div>
        </div>

        {/* Name */}
        <h3 className="font-festive text-base sm:text-lg md:text-xl text-white drop-shadow-lg">
          {pig.name}
        </h3>

        {/* Price */}
        <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-white/50">
          <p className="text-white font-bold text-[10px] sm:text-xs">
            💵 Giá: {formatCurrency(pig.price)}
          </p>
        </div>

        {/* Reward Range */}
        <div className="bg-yellow-400/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-yellow-600">
          <p className="text-red-900 font-bold text-[9px] sm:text-[10px]">
            💰 Tiền thưởng: {formatCurrency(pig.minReward)} - {formatCurrency(pig.maxReward)}
          </p>
        </div>

        {/* Jackpot */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border-2 border-yellow-600 animate-pulse">
          <p className="text-white font-bold text-[8px] sm:text-[9px] flex items-center justify-center gap-1">
            🎰 Jackpot: {formatCurrency(pig.jackpotReward)}
          </p>
        </div>

        {/* Chances */}
        <div className="flex gap-1 w-full">
          <div className="flex-1 bg-green-600/90 px-1 py-0.5 rounded text-[8px] sm:text-[9px] text-white font-bold">
            🎰 {(pig.jackpotChance * 100).toFixed(0)}%
          </div>
          <div className="flex-1 bg-red-600/90 px-1 py-0.5 rounded text-[8px] sm:text-[9px] text-white font-bold">
            💣 {(pig.boomChance * 100).toFixed(0)}%
          </div>
        </div>

        {/* Buy Button - RIÊNG BIỆT */}
        {canAfford && !disabled ? (
          <button
            onClick={handleBuyClick}
            className="mt-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-green-400 transition-all w-full shadow-lg"
          >
            <span className="text-white font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1">
              ✅ Mua Ngay 💰
            </span>
          </button>
        ) : !canAfford ? (
          <div className="mt-1 bg-red-600/80 px-3 py-1.5 rounded-full border-2 border-red-800 w-full">
            <span className="text-white font-bold text-[9px] sm:text-[10px]">
              Không đủ tiền
            </span>
          </div>
        ) : null}
      </div>

      {/* Shine Effect */}
      {canAfford && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
      )}
    </div>
  );
};