import React from 'react';
import { GameType } from '../types';

interface FooterProps {
    onNavigate: (game: GameType) => void;
    onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSupport }) => {
    return (
        <footer className="bg-[#080810] border-t border-white/10 pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">

                    {/* Column 1: Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/assets/image/logos/logoWeb.png" alt="M-GAME Logo" className="w-10 h-10 rounded-xl object-contain" />
                            <span className="text-xl font-black text-white tracking-tight">M-GAME PORTAL</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            M-Game Portal là nền tảng mini game trực tuyến dành cho giải trí và giao lưu giữa người chơi.
                        </p>
                        <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest">
                            Play for fun. Compete with friends.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Khám Phá</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Trang chủ', id: GameType.HOME },
                                { label: 'Nhiệm vụ', id: GameType.DASHBOARD },
                                { label: 'Shop', id: GameType.SHOP },
                                { label: 'Túi đồ', id: GameType.INVENTORY },
                                { label: 'BXH', id: GameType.LEADERBOARD },
                                { label: 'Hồ sơ', id: GameType.PROFILE },
                            ].map((link) => (
                                <li key={link.id}>
                                    <button
                                        onClick={() => onNavigate(link.id)}
                                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Popular Games */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Trò Chơi</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Tiến Lên', id: GameType.TIEN_LEN },
                                { label: 'Xì Dách', id: GameType.XI_DACH },
                                { label: 'Bầu Cua', id: GameType.BAU_CUA },
                                { label: 'Tài Xỉu', id: GameType.TAI_XIU },
                                { label: 'Xóc Đĩa', id: GameType.XOC_DIA },
                                { label: 'Đập Heo', id: GameType.DAP_HEO },
                            ].map((game) => (
                                <li key={game.id}>
                                    <button
                                        onClick={() => onNavigate(game.id)}
                                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        {game.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Contact Information */}
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Liên Hệ</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-400 text-sm">
                                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                0779421219
                            </li>
                            <li className="flex items-center gap-3 text-gray-400 text-sm">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <a href="mailto:ngocmanh04092004@gmail.com" className="hover:text-white transition-colors">nnm04092004@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3 text-gray-400 text-sm">
                                <svg className="w-6 h-6 text-indigo-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Quy Nhơn, Việt Nam</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 5: Support the Project */}
                    <div className="lg:col-span-1">
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Support the Project</h4>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">
                                Nếu bạn yêu thích M-Game Portal và muốn hỗ trợ dự án duy trì server cũng như phát triển thêm các tính năng mới, bạn có thể đóng góp tùy tâm tại đây.
                            </p>

                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-white p-2 rounded-lg w-32 h-32 overflow-hidden shadow-lg">
                                    <img
                                        src="/assets/image/QR/qr-donate.png"
                                        alt="Vietcombank QR"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-[10px] uppercase">Vietcombank</p>
                                    <p className="text-indigo-400 font-mono text-xs font-bold">1028750976</p>
                                    <p className="text-gray-500 text-[10px]">NGUYEN NGOC MANH</p>
                                </div>
                                <button
                                    onClick={onOpenSupport}
                                    className="w-full py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Support the Project
                                </button>
                            </div>

                            <p className="text-[10px] text-gray-500 mt-3 text-center leading-tight">
                                Mọi đóng góp đều là tự nguyện và giúp duy trì nền tảng.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Area */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                <strong className="text-white block mb-1">CẢNH BÁO GIẢI TRÍ TRÁCH NHIỆM</strong>
                                M-Game Portal là nền tảng giải trí trực tuyến. Hệ thống không hỗ trợ quy đổi tiền thật dưới mọi hình thức.
                                Chúng tôi không khuyến khích các hoạt động cờ bạc. Người chơi cần tự chịu trách nhiệm với thời gian và hành vi của mình.
                                Xây dựng cộng đồng game lành mạnh và tích cực.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-xs">
                        © 2026 <span className="text-white font-bold tracking-tight">M-GAME PORTAL</span>. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-medium">Chính sách bảo mật</a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-medium">Điều khoản sử dụng</a>
                        <span className="text-gray-700">|</span>
                        <p className="text-gray-500 text-xs">
                            Powered by <span className="text-indigo-400 font-bold">M-Game Team</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
