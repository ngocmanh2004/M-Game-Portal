import React from 'react';
import cn from 'classnames';

interface CardProps {
  card: string; // VD: '3S', 'KH'
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  selected,
  onClick,
  disabled,
  className = '',
}) => {
  return (
    <div
      className={cn(
        "transition-all duration-200 cursor-pointer select-none",
        selected && "transform -translate-y-6 ring-4 ring-yellow-400 z-10",
        !selected && "hover:-translate-y-2",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{
        width: 50,
        height: 70,
        margin: '0 2px',
        userSelect: 'none',
      }}
      onClick={disabled ? undefined : onClick}
      tabIndex={-1}
    >
      <img
        src={`/assets/image/cards/${card}.png`}
        alt={card}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 8,
          boxShadow: selected ? '0 4px 16px #facc15' : '0 2px 8px #0004',
          border: selected ? '2px solid #facc15' : '2px solid transparent',
        }}
      />
    </div>
  );
};