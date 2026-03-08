import React, { useEffect } from 'react';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl lg:max-w-4xl max-h-full bg-[#0d0d15] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-5 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-tight uppercase">Support the Project</h2>
                        <p className="text-gray-500 text-[10px] lg:text-xs font-medium">Help keep M-Game Portal running.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 lg:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                        {/* Left Side: Mission & Reasons */}
                        <div className="space-y-8">
                            <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full"></div>
                                <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-widest text-indigo-400">Lời ngỏ</h3>
                                <p className="text-gray-300 text-sm leading-relaxed font-medium relative z-10 italic">
                                    "M-Game Portal là dự án tâm huyết được xây dựng để kết nối mọi người qua các trò chơi trí tuệ.
                                    Sự hỗ trợ của bạn là nguồn động lực lớn nhất để chúng tôi duy trì và không ngừng phát triển."
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { title: "Duy trì Server", desc: "Máy chủ 24/7 mượt mà", icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" },
                                    { title: "Game Mới", desc: "Cập nhật trò chơi lạ", icon: "M11 4a2 2 0 114 0v1a2 2 0 01-2 2H3a2 2 0 01-2-2V4a2 2 0 114 0v1a2 2 0 01-2 2h8a2 2 0 01-2-2V4z M7 15l-3 3m0 0l3 3m-3-3h12a2 2 0 002-2v-3" },
                                    { title: "Tối ưu hóa", desc: "Nâng cấp UX/UI đẹp", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
                                    { title: "Sự kiện", desc: "Nhiều quà tặng to", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
                                ].map((reason, i) => (
                                    <div key={i} className="flex flex-col gap-1 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/item">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit group-hover/item:scale-110 transition-transform">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d={reason.icon} />
                                            </svg>
                                        </div>
                                        <span className="text-white text-xs font-black mt-2 leading-none uppercase">{reason.title}</span>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">{reason.desc}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden lg:block pt-4 border-t border-white/5">
                                <p className="text-gray-500 text-[10px] leading-relaxed font-medium italic">
                                    "Mọi sự ủng hộ dù nhỏ nhất đều là động lực hâm nóng ngọn lửa nhiệt huyết của đội ngũ phát triển. Chân thành cảm ơn bạn!"
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Featured Vietcombank QR Card */}
                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[3rem] p-8 lg:p-10 text-center relative overflow-hidden group shadow-2xl">
                            {/* Glow decorative element */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] -ml-24 -mb-24 group-hover:bg-purple-500/20 transition-all duration-700"></div>

                            <div className="relative z-10">
                                <h3 className="text-indigo-400 font-black mb-6 uppercase text-xs tracking-[0.3em] opacity-80">VIETCOMBANK Official</h3>

                                <div className="bg-white p-5 rounded-[2.5rem] w-56 h-56 lg:w-64 lg:h-64 mx-auto mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-700 overflow-hidden ring-8 ring-white/5 relative bg-gradient-to-tr from-white to-gray-50">
                                    <img
                                        src="/assets/image/QR/qr-donate.png"
                                        alt="Vietcombank QR"
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Số tài khoản</p>
                                    <div className="relative inline-block">
                                        <p className="text-white font-mono text-3xl lg:text-4xl font-black tracking-widest bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
                                            1028750976
                                        </p>
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mt-1"></div>
                                    </div>
                                    <p className="text-white font-black text-lg lg:text-xl uppercase tracking-widest mt-2 drop-shadow-xl">NGUYEN NGOC MANH</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 lg:px-8 lg:py-5 bg-white/5 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center lg:text-left opacity-60">Thank you for being part of our community</p>
                    <button
                        onClick={onClose}
                        className="w-full lg:w-auto px-10 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest transform hover:-translate-y-1"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};
