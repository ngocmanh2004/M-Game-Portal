/**
 * GameReactions — Hệ thống emoji & ném đồ vật dùng chung cho Tiến Lên và Xì Dách.
 *
 * Integration:
 *  1. Gắn `data-player-uid={uid}` lên container của avatar mỗi người chơi.
 *  2. const { anims, sendReaction } = useGameReactions(gamePath, gameId, myUid)
 *  3. <GameReactionsOverlay anims={anims} /> trong return JSX.
 *  4. <EmojiPickerButton onSend={e => sendReaction('emoji', e)} /> gần local player.
 *  5. Click avatar khác → <ThrowMenu ... onThrow={item => sendReaction('throw', item, uid)} />.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getDatabase, ref, onValue, update } from 'firebase/database';

// ─── Constants ────────────────────────────────────────────────────────────────

export const REACTION_EMOJIS = [
  '😂', '😱', '🤬', '😭', '🔥', '👏', '😤', '😴',
  '👍', '👎', '❤️', '💔', '😎', '🤔', '🤯', '🥳',
  '🤢', '🤮', '🙄', '🥶', '🥵', '🤡', '👽', '💩',
  '👀', '🧠', '🙏', '💯', '🖕', '💦'
];

export const THROW_ITEMS: { value: string; emoji: string; label: string }[] = [
  { value: 'brick', emoji: '🧱', label: 'Ném gạch' },
  { value: 'bomb', emoji: '💣', label: 'Ném bom' },
  { value: 'flower', emoji: '💐', label: 'Tặng hoa' },
  { value: 'tomato', emoji: '🍅', label: 'Cà chua' },
  { value: 'egg', emoji: '🥚', label: 'Ném trứng' },
  { value: 'banana', emoji: '🍌', label: 'Vỏ chuối' },
  { value: 'pan', emoji: '🍳', label: 'Chảo' },
  { value: 'slipper', emoji: '🩴', label: 'Ném dép' },
  { value: 'water_balloon', emoji: '🎈', label: 'Bóng nước' },
  { value: 'chicken', emoji: '🐔', label: 'Gà la hét' },
];

const THROW_SOUNDS: Record<string, string> = {
  bomb: '/assets/audio/boom.mp3',
  flower: '/assets/audio/wow.mp3',
  brick: '/assets/audio/nemgach.mp3',
  tomato: '/assets/audio/nemdovat2.mp3',
  egg: '/assets/audio/nemdovat2.mp3',
  banana: '/assets/audio/nemdovat.mp3',
  pan: '/assets/audio/nemchao.mp3',
  slipper: '/assets/audio/nemdovat.mp3',
  water_balloon: '/assets/audio/nemdovat2.mp3',
  chicken: '/assets/audio/chicken.mp3',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveAnim {
  id: number;
  type: 'emoji' | 'throw';
  senderUid: string;
  receiverUid?: string;
  value: string;
}

// ─── CSS Keyframe injection (once) ───────────────────────────────────────────

let _keyframesInjected = false;
function injectVfxKeyframes() {
  if (_keyframesInjected || typeof document === 'undefined') return;
  _keyframesInjected = true;
  const style = document.createElement('style');
  style.id = 'game-reactions-vfx';
  style.textContent = `
    /* Xoay thuận chiều kim đồng hồ trong lúc bay */
    @keyframes vfxSpinCW {
      from { transform: scale(1.5) rotate(0deg); }
      to   { transform: scale(1.5) rotate(720deg); }
    }
    /* Xoay ngược chiều kim đồng hồ */
    @keyframes vfxSpinCCW {
      from { transform: scale(1.5) rotate(0deg); }
      to   { transform: scale(1.5) rotate(-360deg); }
    }
    /* Vụ nổ bom */
    @keyframes vfxExplode {
      0%   { transform: scale(2);   opacity: 1; filter: brightness(1); }
      25%  { transform: scale(5);   opacity: 1; filter: brightness(2.5); }
      60%  { transform: scale(7);   opacity: 0.8; filter: brightness(3); }
      100% { transform: scale(8.5); opacity: 0; filter: brightness(1); }
    }
    /* Chóp đỏ ném gạch / dép */
    @keyframes vfxRedFlash {
      0%,100% { box-shadow: none; filter: none; }
      20%     { box-shadow: 0 0 0 3px rgba(255,40,40,1), 0 0 20px 8px rgba(255,0,0,0.5); filter: saturate(2) brightness(1.3); }
      50%     { box-shadow: 0 0 0 5px rgba(255,80,20,0.9), 0 0 30px 12px rgba(255,60,0,0.4); filter: hue-rotate(-20deg) brightness(1.2); }
      80%     { box-shadow: 0 0 0 2px rgba(255,40,40,0.5); filter: none; }
    }
    /* Splash: bóng nước, cà chua, trứng */
    @keyframes vfxSplash {
      0%   { transform: scale(1); opacity: 1; filter: sepia(1); }
      30%  { transform: scale(4); opacity: 1; filter: saturate(2); }
      100% { transform: scale(6) translateY(20px); opacity: 0; filter: blur(2px); }
    }
    /* Bounce: cục giấy */
    @keyframes vfxBounceOnce {
      0%   { transform: scale(3) translateY(0); opacity: 1; }
      30%  { transform: scale(3) translateY(-40px); opacity: 0.8; }
      100% { transform: scale(2) translateY(80px); opacity: 0; }
    }
    /* Rung lắc avatar */
    @keyframes vfxShake {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      12%     { transform: translate(-7px, 2px) rotate(-4deg); }
      25%     { transform: translate(7px, -2px) rotate(4deg); }
      37%     { transform: translate(-6px, 2px) rotate(-3deg); }
      50%     { transform: translate(6px, 1px) rotate(3deg); }
      62%     { transform: translate(-5px, -1px) rotate(-2deg); }
      75%     { transform: translate(4px, 1px) rotate(1deg); }
      87%     { transform: translate(-3px, 0) rotate(0deg); }
    }
    /* Hoa phóng to khi đáp */
    @keyframes vfxFlowerBloom {
      0%   { transform: scale(2); opacity: 1; }
      40%  { transform: scale(5); opacity: 1; }
      100% { transform: scale(6); opacity: 0; }
    }
    /* Trái tim nổi lên rồi mờ */
    @keyframes vfxHeartFloat {
      0%   { transform: translate(var(--hx,0px), 0) scale(0.7); opacity: 1; }
      60%  { opacity: 1; }
      100% { transform: translate(var(--hx,0px), -75px) scale(1.4); opacity: 0; }
    }
    /* Gạch vụn văng ra */
    @keyframes vfxBrickShatter {
      0%   { transform: scale(2) rotate(0deg); opacity: 1; }
      30%  { transform: scale(3) rotate(20deg); opacity: 1; }
      70%  { transform: scale(2.5) rotate(-10deg); opacity: 0.7; }
      100% { transform: scale(0.5) rotate(30deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _animCounter = 0;

/** Trả về bounding rect của avatar img (ưu tiên) hoặc container nếu không tìm thấy img. */
function getAvatarRect(uid: string): DOMRect | null {
  const container = document.querySelector(`[data-player-uid="${uid}"]`);
  if (!container) return null;
  const img = container.querySelector('img');
  return (img ?? container).getBoundingClientRect();
}

function playThrowSound(value: string) {
  const src = THROW_SOUNDS[value];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.play().catch(() => { });
}

function applyAvatarImpact(uid: string, throwType: string) {
  const container = document.querySelector(`[data-player-uid="${uid}"]`);
  if (!container) return;
  // Ưu tiên set animation lên thẻ img; nếu không có thì dùng container
  const target = (container.querySelector('img') ?? container) as HTMLElement;

  const animMap: Record<string, string> = {
    bomb: 'vfxShake 0.7s ease-in-out',
    brick: 'vfxRedFlash 0.7s ease-in-out',
    slipper: 'vfxRedFlash 0.5s ease-in-out',
    pan: 'vfxShake 0.6s ease-in-out',
    tomato: 'vfxShake 0.4s ease-in-out',
    egg: 'vfxShake 0.4s ease-in-out',
    water_balloon: 'vfxShake 0.5s ease-in-out',
    snowball: 'vfxShake 0.5s ease-in-out',
    banana: 'vfxShake 0.5s ease-in-out',
    chicken: 'vfxShake 0.8s ease-in-out',
    paper: '',
    flower: '', // hoa không shake, chỉ phóng to hiệu ứng overlay
  };
  const anim = animMap[throwType] ?? 'vfxRedFlash 0.5s ease';
  if (!anim) return;

  // Xóa animation cũ (nếu đang chạy từ lần ném trước)
  target.style.animation = 'none';
  // Force reflow để reset
  void target.offsetWidth;
  target.style.animation = anim;
  target.addEventListener('animationend', () => {
    target.style.animation = '';
  }, { once: true });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameReactions(gamePath: string, gameId: string, myUid: string) {
  const [anims, setAnims] = useState<ActiveAnim[]>([]);
  const seenTs = useRef<Set<number>>(new Set());
  const db = getDatabase();

  useEffect(() => {
    if (!gameId) return;
    const reactRef = ref(db, `${gamePath}/games/${gameId}/reactions`);
    const unsub = onValue(reactRef, snap => {
      const data = snap.val() as Record<string, any> | null;
      if (!data) return;
      const newAnims: ActiveAnim[] = [];
      Object.values(data).forEach((r: any) => {
        if (!r || seenTs.current.has(r.ts)) return;
        seenTs.current.add(r.ts);
        const anim: ActiveAnim = {
          id: ++_animCounter,
          type: r.type,
          senderUid: r.senderUid,
          receiverUid: r.receiverUid || undefined,
          value: r.value,
        };
        newAnims.push(anim);
        // Âm thanh ném đồ vật
        if (r.type === 'throw') playThrowSound(r.value);
      });
      if (newAnims.length === 0) return;
      setAnims(prev => [...prev, ...newAnims]);
      // Xóa khỏi state sau khi animation hoàn tất (3s)
      newAnims.forEach(a => {
        setTimeout(() => setAnims(prev => prev.filter(x => x.id !== a.id)), 3000);
      });
    });
    return () => unsub();
  }, [gamePath, gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendReaction = useCallback(async (
    type: 'emoji' | 'throw',
    value: string,
    receiverUid?: string,
  ) => {
    const ts = Date.now();
    const slot = ts % 32;
    await update(ref(db, `${gamePath}/games/${gameId}/reactions`), {
      [slot]: { type, senderUid: myUid, receiverUid: receiverUid || null, value, ts },
    });
    setTimeout(() => {
      update(ref(db, `${gamePath}/games/${gameId}/reactions`), { [slot]: null }).catch(() => { });
    }, 8000);
  }, [gamePath, gameId, myUid]); // eslint-disable-line react-hooks/exhaustive-deps

  return { anims, sendReaction };
}

// ─── Flying item animation ────────────────────────────────────────────────────

interface HeartParticle { id: number; hx: number; delay: number }

const FlyingItem: React.FC<{ anim: ActiveAnim }> = ({ anim }) => {
  // Vị trí container ngoài (dùng CSS transition để bay từ A → B)
  const [outerStyle, setOuterStyle] = useState<React.CSSProperties>({
    position: 'fixed', opacity: 0, left: -200, top: -200, pointerEvents: 'none', zIndex: 9999,
  });
  // Giai đoạn: 'fly' = đang bay, 'impact' = đã đáp, 'done' = ẩn hoàn toàn
  const [phase, setPhase] = useState<'fly' | 'impact' | 'done'>('fly');
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  // Vị trí nơi đáp (dùng cho overlay impact)
  const impactPos = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  const isThrow = anim.type === 'throw';
  const valInfo = THROW_ITEMS.find(x => x.value === anim.value);
  const flyEmoji = isThrow ? (valInfo?.emoji || anim.value) : anim.value;

  const impactEmojis: Record<string, string> = {
    bomb: '💥',
    flower: '💐',
    tomato: '🍅',
    egg: '🥚',
    paper: '📄',
    banana: '🍌',
    pan: '💥',
    slipper: '🩴',
    water_balloon: '💦',
    snowball: '❄️',
    chicken: '🐔',
    brick: '💢',
  };
  const impactEmoji = isThrow ? (impactEmojis[anim.value] || '💢') : '';

  // Parabolic tracking state
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const flyRef = useRef<number>();

  useEffect(() => {
    injectVfxKeyframes();

    const sRect = getAvatarRect(anim.senderUid);
    const rRect = anim.receiverUid ? getAvatarRect(anim.receiverUid) : null;

    const startX = sRect ? sRect.left + sRect.width / 2 - 20 : window.innerWidth / 2 - 20;
    const startY = sRect ? sRect.top + sRect.height / 2 - 20 : window.innerHeight / 2 - 20;

    // ─ Set ngay tại vị trí bắt đầu ─
    setPosX(startX);
    setPosY(startY);
    setOuterStyle(prev => ({ ...prev, opacity: 1, fontSize: '2rem', transition: 'none' }));

    if (!rRect || anim.type === 'emoji') {
      // ── Emoji: nổi lên 2s rồi mờ dần ──────────────────────────────────────
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setOuterStyle(prev => ({
          ...prev,
          transition: 'transform 2s ease-out',
          transform: 'scale(1.6)',
        }));
        setPosY(startY - 65);

        setTimeout(() => {
          setOuterStyle(prev => ({ ...prev, transition: 'opacity 0.4s ease-in', opacity: 0 }));
        }, 2000);
        setTimeout(() => setPhase('done'), 2500);
      }));
      return;
    }

    // ── Throw: bay từ sender → receiver (Parabolic + Transform Scaling) ────
    const endX = rRect.left + rRect.width / 2 - 20;
    const endY = rRect.top + rRect.height / 2 - 20;
    impactPos.current = { left: endX, top: endY };

    const duration = 800;
    const startTime = performance.now();
    // Peak height of parabola (curve upward)
    const arcHeight = Math.min(Math.abs(endX - startX) * 0.4, 250);

    const animateFly = (time: number) => {
      let progress = (time - startTime) / duration;
      if (progress > 1) progress = 1;

      // X translates linearly
      const currentX = startX + (endX - startX) * progress;
      // Y uses a quadratic bezier easing for parabola shape
      // y = startY + progress*(endY-startY) - sin(progress*pi)*arcHeight
      const currentY = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * arcHeight;

      setPosX(currentX);
      setPosY(currentY);

      if (progress < 1) {
        flyRef.current = requestAnimationFrame(animateFly);
      } else {
        // Impact Phase
        setOuterStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.1s' }));
        setPhase('impact');

        if (anim.receiverUid) applyAvatarImpact(anim.receiverUid, anim.value);

        // Sinh hearts cho hoa
        if (anim.value === 'flower') {
          setHearts([
            { id: 0, hx: -30, delay: 0 },
            { id: 1, hx: -8, delay: 80 },
            { id: 2, hx: 15, delay: 160 },
            { id: 3, hx: -20, delay: 50 },
            { id: 4, hx: 28, delay: 120 },
            { id: 5, hx: 3, delay: 240 },
          ]);
        }

        // Dọn dẹp sau khi impact xong
        const impactDuration = anim.value === 'bomb' ? 900 : anim.value === 'flower' ? 1400 : 700;
        setTimeout(() => setPhase('done'), impactDuration);
      }
    };
    flyRef.current = requestAnimationFrame(animateFly);

    return () => { if (flyRef.current) cancelAnimationFrame(flyRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'done') return null;

  const { left, top } = impactPos.current;

  // Cấu hình style va chạm
  let impactStyle = '';
  if (anim.value === 'bomb') impactStyle = 'vfxExplode 0.85s ease-out forwards';
  else if (anim.value === 'flower') impactStyle = 'vfxFlowerBloom 0.9s ease-out forwards';
  else if (anim.value === 'paper') impactStyle = 'vfxBounceOnce 0.65s cubic-bezier(0.5, 0, 0.5, 1) forwards';
  else if (['tomato', 'egg', 'water_balloon', 'snowball', 'banana', 'chicken'].includes(anim.value)) impactStyle = 'vfxSplash 0.65s ease-out forwards';
  else /* brick */ impactStyle = 'vfxBrickShatter 0.65s ease-out forwards';

  // Inner spin animation
  const innerSpinStyle = isThrow && anim.receiverUid
    ? (['flower', 'paper', 'chicken'].includes(anim.value) ? 'vfxSpinCCW 0.8s ease-in-out infinite' : 'vfxSpinCW 0.6s linear infinite')
    : 'none';

  return typeof document !== 'undefined' ? createPortal(
    <>
      {/* ── Item đang bay ─────────────────────────────────────────────────── */}
      {phase === 'fly' && (
        <div style={{ ...outerStyle, left: posX, top: posY }}>
          <span style={{ display: 'inline-block', animation: innerSpinStyle }}>{flyEmoji}</span>
        </div>
      )}

      {/* ── Impact overlay ────────────────────────────────────────────────── */}
      {phase === 'impact' && (
        <div style={{ position: 'fixed', left, top, fontSize: '2rem', zIndex: 9999, pointerEvents: 'none', lineHeight: 1 }}>
          <span style={{
            display: 'inline-block',
            animation: impactStyle,
          }}>
            {impactEmoji}
          </span>
        </div>
      )}

      {/* ── Trái tim nổi lên (chỉ khi tặng hoa) ─────────────────────────── */}
      {phase === 'impact' && anim.value === 'flower' && hearts.map(h => (
        <div
          key={h.id}
          style={{
            position: 'fixed',
            left: left + 10,
            top: top + 5,
            fontSize: '1.3rem',
            zIndex: 9999,
            pointerEvents: 'none',
            lineHeight: 1,
            ['--hx' as string]: `${h.hx}px`,
            animation: `vfxHeartFloat 1.1s ease-out ${h.delay}ms forwards`,
            opacity: 0,
          }}
        >
          ❤️
        </div>
      ))}
    </>,
    document.body
  ) : null;
};

// ─── Overlay ──────────────────────────────────────────────────────────────────

export const GameReactionsOverlay: React.FC<{ anims: ActiveAnim[] }> = ({ anims }) => (
  <>{anims.map(a => <FlyingItem key={a.id} anim={a} />)}</>
);

// ─── Emoji Picker Button ──────────────────────────────────────────────────────

export const EmojiPickerButton: React.FC<{ onSend: (emoji: string) => void }> = ({ onSend }) => {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const style: React.CSSProperties = { position: 'fixed', zIndex: 9998 };

      // Horizontal placement
      if (r.left < window.innerWidth / 2) {
        style.left = r.left; // Align left
      } else {
        style.right = window.innerWidth - r.right; // Align right
      }

      // Vertical placement - Create an anchor point directly above the button
      style.top = r.top - 8;

      setPopupStyle(style);
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="text-base bg-black/60 border border-white/20 rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/80 hover:border-white/40 active:scale-90 transition-all shadow-lg"
        title="Cảm xúc"
      >
        😊
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9997]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} onTouchStart={(e) => { e.stopPropagation(); setOpen(false); }} />
          {/* Zero-size anchor point */}
          <div style={popupStyle} className="pointer-events-none">
            {/* The actual popup grows upward (bottom-0) from the anchor point */}
            <div
              className={`absolute bottom-0 ${popupStyle.left !== undefined ? 'left-0' : 'right-0'} pointer-events-auto bg-[#181818] border border-white/20 rounded-2xl p-2 shadow-2xl w-[190px] flex flex-col animate-in fade-in zoom-in duration-150`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Close Button */}
              <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-white/10 px-1">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Cảm xúc</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Emoji Grid */}
              <div className="grid grid-cols-5 gap-1 max-h-[104px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
                {REACTION_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={(ev) => { ev.stopPropagation(); onSend(e); setOpen(false); }}
                    onTouchStart={(ev) => { ev.stopPropagation(); onSend(e); setOpen(false); }}
                    className="w-7 h-7 text-xl flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// ─── Throw Menu ───────────────────────────────────────────────────────────────

export const ThrowMenu: React.FC<{
  targetUid: string;
  targetName: string;
  anchorRect: DOMRect;
  onThrow: (item: string) => void;
  onClose: () => void;
}> = ({ targetName, anchorRect, onThrow, onClose }) => {
  // Đặt menu gần avatar đối thủ, không vượt ra ngoài màn hình
  const menuW = 144;
  const menuH = 110;
  let left = anchorRect.left + anchorRect.width / 2 - menuW / 2;
  let top = anchorRect.top - menuH - 8;
  if (left < 4) left = 4;
  if (left + menuW > window.innerWidth - 4) left = window.innerWidth - menuW - 4;
  if (top < 4) top = anchorRect.bottom + 8;

  return typeof document !== 'undefined' ? createPortal(
    <>
      <div className="fixed inset-0 z-[9996]" onClick={onClose} />
      <div
        className="fixed bg-[#181818] border border-white/25 rounded-2xl p-2 shadow-2xl overflow-y-auto max-h-[220px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in zoom-in duration-100"
        style={{ left, top, zIndex: 9997, width: menuW }}
      >
        <div className="text-[9px] text-gray-400 mb-1.5 text-center font-bold truncate px-1 pb-1 border-b border-white/10">
          Ném {targetName}
        </div>
        {THROW_ITEMS.map(item => (
          <button
            key={item.value}
            onClick={(ev) => { ev.stopPropagation(); onThrow(item.value); onClose(); }}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-left"
          >
            <span className="text-lg leading-none">{item.emoji}</span>
            <span className="text-[10px] text-white font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body
  ) : null;
};
