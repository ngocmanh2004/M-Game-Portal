import React from 'react';
import { CHIP_VALUES } from '../constants';
import { formatCurrency } from '../utils';
import { SoundType } from '../types';

interface BettingControlsProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  balance: number;
  playSound: (type: SoundType) => void;
  onQuickBet?: (amount: number) => void; // Thêm callback cho đặt nhanh
}

export const BettingControls: React.FC<BettingControlsProps> = ({
  selectedChip,
  onSelectChip,
  balance,
  playSound,
  onQuickBet
}) => {
  const [showQuickBet, setShowQuickBet] = React.useState(false);
  const [quickBetAmount, setQuickBetAmount] = React.useState('');

  const handleQuickBet = () => {
    const amount = parseInt(quickBetAmount);
    if (amount > 0 && amount <= balance) {
      onQuickBet?.(amount);
      playSound('money');
      setShowQuickBet(false);
      setQuickBetAmount('');
    }
  };

  const quickAmounts = [1000000, 5000000, 10000000, 50000000, 100000000]; // 1tr, 5tr, 10tr, 50tr, 100tr
  return (
    <div className="w-full max-w-4xl">
      
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-0.5 w-6 bg-gradient-to-r from-transparent via-yellow-400 to-yellow-400 rounded"></div>
        <p className="text-yellow-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
          Chọn mệnh giá tiền:
        </p>
        <div className="h-0.5 w-6 bg-gradient-to-r from-yellow-400 via-yellow-400 to-transparent rounded"></div>
      </div>

      {/* Chips Grid */}
      <div className="relative">
        <div className="flex flex-wrap justify-center gap-1.5 px-1">
          {CHIP_VALUES.map((chip, index) => {
            const isSelected = selectedChip === chip.value;
            const canAfford = balance >= chip.value;
            // 5 tờ hàng đầu, 4 tờ hàng sau
            const isFirstRow = index < 5;

            return (
              <button
                key={chip.value}
                onClick={() => {
                  if (canAfford) {
                    onSelectChip(chip.value);
                    playSound('money');
                  }
                }}
                disabled={!canAfford}
                className={`
                  group relative transition-all duration-200
                  ${isFirstRow ? 'w-[18%]' : 'w-[23%]'}
                  ${!canAfford ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}
                `}
              >
                {/* Glow effect nhẹ khi selected */}
                {isSelected && (
                  <div className="absolute -inset-0.5 bg-yellow-400/20 rounded-lg blur-sm"></div>
                )}

                {/* Chip Image Container */}
                <div className={`
                  relative rounded-lg overflow-hidden transition-all
                  ${isSelected 
                    ? 'ring-1 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                    : 'ring-1 ring-transparent'
                  }
                `}>
                  {/* Image */}
                  <img 
                    src={chip.image} 
                    alt={chip.label}
                    className="w-full aspect-[3/2] object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/150x100/dc2626/ffffff?text=${chip.label}`;
                    }}
                  />

                  {/* Label - MỎNG */}
                  <div className={`
                    absolute inset-x-0 bottom-0 text-center font-bold text-[10px] sm:text-xs py-0.5
                    ${isSelected 
                      ? 'bg-yellow-400/80 text-red-900' 
                      : 'bg-black/60 text-white'
                    }
                  `}>
                    {chip.label}
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Balance Info & Quick Bet Button */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <p className="text-white/70 text-xs sm:text-sm">
          Số dư: <span className="font-bold text-yellow-400">{formatCurrency(balance)}</span>
        </p>
        
        {onQuickBet && (
          <button
            onClick={() => {
              setShowQuickBet(true);
              playSound('money');
            }}
            className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold rounded-full hover:from-yellow-600 hover:to-yellow-700 active:scale-95 transition-all shadow-lg"
          >
            ⚡ Đặt nhanh
          </button>
        )}
      </div>

      {/* Quick Bet Modal */}
      {showQuickBet && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickBet(false)}
        >
          <div 
            className="bg-gradient-to-br from-red-900 to-red-950 rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-yellow-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-yellow-400 text-xl font-bold mb-1">⚡ Đặt Cược Nhanh</h3>
              <p className="text-white/70 text-sm">
                Số dư: <span className="text-yellow-400 font-bold">{formatCurrency(balance)}</span>
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickAmounts.map((amount) => {
                const canAfford = balance >= amount;
                return (
                  <button
                    key={amount}
                    onClick={() => {
                      if (canAfford) {
                        setQuickBetAmount(amount.toString());
                      }
                    }}
                    disabled={!canAfford}
                    className={`
                      py-3 px-4 rounded-lg font-bold text-sm transition-all
                      ${canAfford 
                        ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 hover:bg-yellow-500/30 active:scale-95' 
                        : 'bg-gray-700/20 text-gray-500 border-2 border-gray-600/30 cursor-not-allowed opacity-50'
                      }
                      ${quickBetAmount === amount.toString() ? 'ring-2 ring-yellow-400 bg-yellow-500/40' : ''}
                    `}
                  >
                    {formatCurrency(amount)}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="mb-4">
              <label className="block text-white/80 text-sm mb-2 font-semibold">Hoặc nhập số tiền:</label>
              <input
                type="number"
                value={quickBetAmount}
                onChange={(e) => setQuickBetAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full px-4 py-3 bg-black/40 border-2 border-yellow-500/50 rounded-lg text-white text-center font-bold focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuickBet(false);
                  setQuickBetAmount('');
                }}
                className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 active:scale-95 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleQuickBet}
                disabled={!quickBetAmount || parseInt(quickBetAmount) <= 0 || parseInt(quickBetAmount) > balance}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};