import React from 'react';

interface DiceProps {
  value: number | string;
  isRolling: boolean;
  type: 'numeric' | 'icon';
  game?: 'taixiu' | 'baucua';
}

export const Dice: React.FC<DiceProps> = ({ value, isRolling, type, game = 'baucua' }) => {
  
  const renderStandardDie = (num: number) => {
      const dot = "w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-black rounded-full";
      const center = "flex justify-center items-center";
      
      const dotsMap: Record<number, React.ReactNode> = {
        1: <div className={`${center} w-full h-full`}><div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-600 rounded-full"></div></div>,
        2: <div className="flex justify-between p-1 sm:p-2 w-full h-full"><div className={dot}></div><div className={`${dot} self-end`}></div></div>,
        3: <div className="flex justify-between p-1 sm:p-2 w-full h-full"><div className={dot}></div><div className={`${dot} self-center`}></div><div className={`${dot} self-end`}></div></div>,
        4: <div className="flex justify-between p-1 sm:p-2 w-full h-full flex-wrap"><div className="w-full flex justify-between"><div className={dot}></div><div className={dot}></div></div><div className="w-full flex justify-between self-end"><div className={dot}></div><div className={dot}></div></div></div>,
        5: <div className="flex justify-between p-1 sm:p-2 w-full h-full flex-wrap relative"><div className="w-full flex justify-between"><div className={dot}></div><div className={dot}></div></div><div className="absolute inset-0 flex justify-center items-center"><div className={dot}></div></div><div className="w-full flex justify-between self-end"><div className={dot}></div><div className={dot}></div></div></div>,
        6: <div className="flex justify-between p-1 sm:p-2 w-full h-full flex-wrap"><div className="w-full flex justify-between"><div className={dot}></div><div className={dot}></div></div><div className="w-full flex justify-between"><div className={dot}></div><div className={dot}></div></div><div className="w-full flex justify-between"><div className={dot}></div><div className={dot}></div></div></div>
      };
      return dotsMap[num] || null;
  }

  const animationClass = game === 'taixiu' ? 'animate-spin-dice-taixiu' : 'animate-spin-dice-baucua';

  // ⭐ Khác nhau giữa game Bầu Cua (icon) và Tài Xỉu (numeric)
  const isIconDice = type === 'icon';

  return (
    <div 
      className={`
        ${isIconDice 
          ? 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'  // ⭐ TO HƠN cho Bầu Cua
          : 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20'  // Giữ nguyên cho Tài Xỉu
        }
        ${isIconDice 
          ? 'bg-transparent'  // ⭐ TRANSPARENT cho icon Bầu Cua
          : 'bg-white'        // Giữ trắng cho số Tài Xỉu
        }
        rounded-lg sm:rounded-xl shadow-xl 
        ${isIconDice ? 'border-0' : 'border-2 border-gray-300'}
        flex items-center justify-center select-none overflow-visible
        transition-transform
        ${isRolling ? animationClass : 'hover:scale-105'}
      `}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {type === 'icon' ? (
          <img 
            src={value as string} 
            alt="dice-face" 
            className="w-full h-full object-contain dice-icon-no-bg" // ⭐ THÊM CLASS
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'  // Shadow thay vì border
            }}
          />
        ) : (
          <div>
            {typeof value === 'number' ? renderStandardDie(value) : value}
          </div>
        )}
      </div>
    </div>
  );
};