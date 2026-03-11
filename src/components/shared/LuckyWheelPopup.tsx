import React, { useState, useEffect, useRef } from 'react';
import { useLuckyWheel, WheelPrize } from '../../hooks/useLuckyWheel';
import { SOUNDS } from '../../constants';
import confetti from 'canvas-confetti';

interface Props {
    uid: string;
    onClose: () => void;
}

export const LuckyWheelPopup: React.FC<Props> = ({ uid, onClose }) => {
    const { tickets, spin, loading, WHEEL_PRIZES } = useLuckyWheel(uid);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<WheelPrize | null>(null);
    const spinAudioRef = useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        spinAudioRef.current = new Audio(SOUNDS.spin);
        return () => {
            if (spinAudioRef.current) {
                spinAudioRef.current.pause();
                spinAudioRef.current = null;
            }
        };
    }, []);

    const handleSpin = async () => {
        if (spinning || tickets <= 0) return;

        setSpinning(true);
        setResult(null);

        // Choose result securely via hook
        const prize = await spin();
        if (!prize) {
            setSpinning(false);
            return;
        }

        const prizeIndex = WHEEL_PRIZES.findIndex(p => p.id === prize.id);
        if (prizeIndex === -1) {
            setSpinning(false);
            return;
        }

        // Number of segments
        const numSegments = WHEEL_PRIZES.length;
        // Calculate angle per segment
        const anglePerSegment = 360 / numSegments;
        // Calculate angle to point to the winning segment (center of the segment)
        // -90 degrees because 0 starts at top usually, but depending on CSS we align it.
        // CSS draw rotates clockwise, top is 0. 
        const targetAngle = 360 - (prizeIndex * anglePerSegment) - (anglePerSegment / 2);

        // Add multiple full rotations (e.g., 5-8 rounds)
        const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;

        // Final smooth angle relative to current rotation
        const currentBase = Math.floor(rotation / 360) * 360;
        const nextRotation = currentBase + extraRotations + targetAngle;

        // Play sound
        if (spinAudioRef.current) {
            spinAudioRef.current.currentTime = 0;
            spinAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }

        setRotation(nextRotation);

        // Stop and show result after CSS transition time (5s)
        setTimeout(() => {
            setSpinning(false);
            setResult(prize);

            // Fire confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }, 5100);
    };

    // SVG segments drawing
    const createConicGradients = () => {
        return WHEEL_PRIZES.map((p, i) => {
            const from = i * (360 / WHEEL_PRIZES.length);
            const to = (i + 1) * (360 / WHEEL_PRIZES.length);
            return `${p.color} ${from}deg ${to}deg`;
        }).join(', ');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] flex flex-col items-center py-8">
                {/* Header */}
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onClose} disabled={spinning} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 tracking-wider text-center drop-shadow-md pb-2 uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Vòng Quay May Mắn
                </h2>

                <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-1.5 rounded-full mb-6 mt-1 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-400 font-bold">Bạn có {tickets} lượt quay</span>
                </div>

                {/* Wheel container */}
                <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] flex items-center justify-center">

                    {/* LED Lights Ring */}
                    <div className="absolute inset-0 rounded-full border-[10px] border-[#1e293b] shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${i % 2 === 0 ? 'animate-pulse text-yellow-400 bg-yellow-400' : 'animate-pulse delay-75 text-white bg-white'}`}
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${i * 30}deg) translateY(-145px) translateX(-50%)`,
                                    transformOrigin: '0 0'
                                }}
                            />
                        ))}
                    </div>

                    {/* Outer Ring Glow */}
                    <div className={`absolute inset-[-10px] rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 blur-xl opacity-30 transition-opacity duration-1000 ${spinning ? 'opacity-80 scale-110' : 'opacity-40'}`} />

                    {/* Wheel Pointer - Enhanced */}
                    <div className="absolute top-[-25px] z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                        <div className="relative">
                            <svg width="50" height="60" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 30L2 10C0 6 3 0 12 0C21 0 24 6 22 10L12 30Z" fill="url(#pointerGradient)" />
                                <defs>
                                    <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#991b1b" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full blur-sm"></div>
                        </div>
                    </div>

                    {/* Actual Wheel Wrapper */}
                    <div className={`relative w-[280px] h-[280px] sm:w-[330px] sm:h-[330px] rounded-full border-8 border-[#334155] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center bg-[#1e293b] ${spinning ? 'ring-4 ring-yellow-400/20' : ''}`}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: spinning ? 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
                        }}
                    >
                        {/* Background Conic Gradient */}
                        <div
                            className="absolute inset-0 w-full h-full rounded-full"
                            style={{ background: `conic-gradient(${createConicGradients()})` }}
                        />

                        {/* Shimmer Effect */}
                        <div className={`absolute inset-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none transition-opacity duration-1000 ${spinning ? 'opacity-40' : 'opacity-10'}`} />

                        {/* Labels overlay */}
                        {WHEEL_PRIZES.map((prize, i) => {
                            const angle = (360 / WHEEL_PRIZES.length) * i + (360 / WHEEL_PRIZES.length) / 2;
                            return (
                                <div key={prize.id}
                                    className="absolute w-full h-full flex items-start justify-center pt-[35px]"
                                    style={{ transform: `rotate(${angle}deg)` }}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[12px] sm:text-[15px] font-black uppercase text-black drop-shadow-sm tracking-tighter w-[80px] text-center leading-tight [text-shadow:0_1px_0_rgba(255,255,255,0.5)]">
                                            {prize.label}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-black/20"></div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Center Hub - Extra Shiny */}
                        <div className="absolute w-14 h-14 rounded-full bg-[#1e293b] border-4 border-[#475569] shadow-2xl z-10 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 flex items-center justify-center border border-white/20">
                                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSpin}
                    disabled={spinning || tickets <= 0 || loading}
                    className={`mt-10 px-12 py-3.5 rounded-full font-black text-lg sm:text-xl uppercase tracking-widest shadow-xl transition-all ${spinning
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed transform scale-95'
                        : tickets <= 0
                            ? 'bg-red-500/20 border border-red-500/40 text-red-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 text-black hover:scale-105 active:scale-95 shadow-yellow-600/40'
                        }`}
                >
                    {spinning ? 'Đang quay...' : tickets > 0 ? 'QUAY NGAY' : 'HẾT LƯỢT'}
                </button>

                {/* Result Overlay */}
                {result && !spinning && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-6 z-40 animate-fade-in border-4 border-yellow-500/50">

                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                            <div className="relative w-28 h-28 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.6)] mb-6 animate-bounce border-4 border-white/20">
                                <span className="text-5xl">🎁</span>
                            </div>
                        </div>

                        <h3 className="text-white text-2xl font-black mb-1 uppercase tracking-tighter">Chúc mừng!</h3>
                        <p className="text-gray-400 text-sm mb-4 font-bold">Bạn đã trúng được</p>

                        <div className="relative px-8 py-4 bg-white/5 border border-white/10 rounded-2xl mb-10 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 text-center uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {result.label}
                            </p>
                        </div>

                        <button onClick={() => setResult(null)} className="group relative px-12 py-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 text-black font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                            <span className="relative z-10">NHẬN QUÀ</span>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
        </div>
    );
};
