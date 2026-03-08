import React, { useState, useEffect } from 'react';
import cn from 'classnames';

interface CardProps {
  card: string;          // e.g. "AH", "KD", "cardback"
  faceDown?: boolean;    // hiển thị mặt úp
  small?: boolean;       // size nhỏ hơn
  className?: string;
  animated?: boolean;    // animation khi lật bài
}

export const Card: React.FC<CardProps> = ({ card, faceDown = false, small = false, className = '', animated = false }) => {
  const [revealed, setRevealed] = useState(!faceDown);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!faceDown && !revealed && animated) {
      setFlipping(true);
      const t = setTimeout(() => {
        setRevealed(true);
        setFlipping(false);
      }, 300);
      return () => clearTimeout(t);
    }
    if (!faceDown) setRevealed(true);
    if (faceDown) setRevealed(false);
  }, [faceDown]);

  const w = small ? 44 : 56;
  const h = small ? 62 : 78;
  const src = faceDown ? '/assets/image/cards/cardback.png' : `/assets/image/cards/${card}.png`;

  return (
    <div
      className={cn('inline-block select-none', flipping && 'scale-x-0', className)}
      style={{
        width: w,
        height: h,
        margin: '0 2px',
        transition: flipping ? 'transform 0.15s ease-in' : 'transform 0.15s ease-out',
      }}
    >
      <img
        src={src}
        alt={faceDown ? 'card-back' : card}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 7,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          border: '1.5px solid rgba(255,255,255,0.15)',
        }}
      />
    </div>
  );
};
