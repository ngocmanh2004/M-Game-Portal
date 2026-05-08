import React, { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';
import {
  clearAutoLoginInProgress,
  hasStoredAuthToken,
  isAutoLoginBlocked,
  isAutoLoginInProgress,
  isMobileDevice,
  startMezonOAuthLogin,
} from '../utils/mezonOAuth';

export const Auth: React.FC = () => {
  const POPUP_FLOW_TIMEOUT_MS = 2 * 60 * 1000;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoLoginTriggeredRef = useRef(false);
  const mezonPopupRef = useRef<Window | null>(null);
  const popupMonitorRef = useRef<number | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);

  const { register, login, loginWithGoogle } = useAuth();
  const enableAutoMezonLogin = (process.env.REACT_APP_AUTO_MEZON_LOGIN ?? 'false') === 'true';

  useEffect(() => {
    if (autoLoginTriggeredRef.current) return;
    if (!enableAutoMezonLogin) return;
    if (!isMobileDevice()) return;
    if (hasStoredAuthToken()) return;
    if (isAutoLoginInProgress()) return;
    if (isAutoLoginBlocked()) return;

    autoLoginTriggeredRef.current = true;
    setLoading(true);
    startMezonOAuthLogin({ mode: 'redirect' });
  }, [enableAutoMezonLogin]);

  useEffect(() => {
    const handleMezonMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || data.source !== 'mezon-oauth') return;

      if (popupMonitorRef.current) {
        window.clearInterval(popupMonitorRef.current);
        popupMonitorRef.current = null;
      }
      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      mezonPopupRef.current = null;

      if (data.status === 'success') {
        setError('');
        setLoading(false);
        window.location.assign('/');
        return;
      }

      setError(typeof data.message === 'string' ? data.message : 'Đăng nhập Mezon thất bại.');
      setLoading(false);
    };

    window.addEventListener('message', handleMezonMessage);

    return () => {
      window.removeEventListener('message', handleMezonMessage);
      if (popupMonitorRef.current) {
        window.clearInterval(popupMonitorRef.current);
        popupMonitorRef.current = null;
      }
      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự');
          setLoading(false);
          return;
        }
        await register(email, password);
      }
    } catch (err: any) {
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'Email đã được sử dụng',
        'auth/invalid-email': 'Email không hợp lệ',
        'auth/user-not-found': 'Tài khoản không tồn tại',
        'auth/wrong-password': 'Sai mật khẩu',
        'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
        'auth/too-many-requests': 'Quá nhiều lần thử, vui lòng thử lại sau',
        'auth/network-request-failed': 'Lỗi kết nối mạng'
      };

      setError(errorMessages[err.code] || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleMezonLogin = () => {
    setError('');
    setLoading(true);

    const mode = isMobileDevice() ? 'redirect' : 'popup';
    const popup = startMezonOAuthLogin({ mode });

    if (mode === 'popup') {
      if (!popup) {
        clearAutoLoginInProgress();
        setError('Trình duyệt đã chặn popup. Đang chuyển sang đăng nhập trực tiếp...');
        return;
      }

      mezonPopupRef.current = popup;

      if (popupMonitorRef.current) {
        window.clearInterval(popupMonitorRef.current);
      }
      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
      }

      popupMonitorRef.current = window.setInterval(() => {
        if (!mezonPopupRef.current || !mezonPopupRef.current.closed) return;

        window.clearInterval(popupMonitorRef.current!);
        popupMonitorRef.current = null;
        mezonPopupRef.current = null;
        setLoading(false);
      }, 500);

      popupTimeoutRef.current = window.setTimeout(() => {
        if (!mezonPopupRef.current || mezonPopupRef.current.closed) return;

        mezonPopupRef.current.close();
        mezonPopupRef.current = null;

        if (popupMonitorRef.current) {
          window.clearInterval(popupMonitorRef.current);
          popupMonitorRef.current = null;
        }

        setLoading(false);
        setError('Đăng nhập Mezon quá thời gian chờ. Vui lòng thử lại.');
      }, POPUP_FLOW_TIMEOUT_MS);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google',
        'auth/popup-blocked': 'Trình duyệt đã chặn popup, vui lòng cho phép popup và thử lại',
        'auth/cancelled-popup-request': 'Yêu cầu đăng nhập Google đã bị hủy',
        'auth/account-exists-with-different-credential': 'Email này đã tồn tại với phương thức đăng nhập khác',
        'auth/network-request-failed': 'Lỗi kết nối mạng'
      };

      setError(errorMessages[err.code] || 'Không thể đăng nhập bằng Google, vui lòng thử lại');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0a1a]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
      <div
        className="absolute top-[40%] right-[-10%] w-[30%] h-[40%] bg-purple-600/30 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute bottom-[-10%] left-[20%] w-[40%] h-[30%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: '4s' }}
      ></div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in-down">
          <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 animate-bounce-slow drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🎮</div>
          <h1 className="font-black tracking-tight text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-lg mb-2">
            M-GAME
          </h1>
          <p className="text-blue-200/80 text-sm sm:text-base italic drop-shadow-md">
            Thế giới giải trí đỉnh cao
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-6 sm:p-8 md:p-10 border border-white/20 animate-fade-in-up">
          <div className="flex bg-black/30 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base ${isLogin
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transform scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base ${!isLogin
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] transform scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Đăng Ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 sm:py-4 bg-black/20 border border-white/10 rounded-xl focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-gray-500 text-base shadow-inner"
                placeholder="Nhập email của bạn"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base ml-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 sm:py-4 bg-black/20 border border-white/10 rounded-xl focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-base shadow-inner"
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-center text-sm font-medium backdrop-blur-sm animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className={`w-full text-base sm:text-lg mt-2 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] !border-none ${isLogin ? '!from-blue-500 !to-indigo-600' : '!from-purple-500 !to-pink-600'}`}
              disabled={loading}
            >
              {loading ? '⏳ Đang xử lý...' : (isLogin ? 'VÀO CỔNG GAME' : 'TẠO TÀI KHOẢN MỚI')}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-gray-500 text-sm">Hoặc</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold transition-all border border-gray-200 shadow-lg group disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.5-.2-2.2H12z" />
                <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3-2.3c-.9.6-2.1 1-3.6 1-2.8 0-5.2-1.9-6-4.5l-3.1 2.4C4.4 19.7 7.9 22 12 22z" />
                <path fill="#4A90E2" d="M6 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L2.9 7.9C2.3 9.1 2 10.5 2 12s.3 2.9.9 4.1L6 13.7z" />
                <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.9 14.7 2 12 2 7.9 2 4.4 4.3 2.9 7.9L6 10.3c.8-2.6 3.2-4.5 6-4.5z" />
              </svg>
              {loading ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}
            </button>

            <button
              type="button"
              onClick={handleMezonLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#4B2991] hover:bg-[#5D35B0] text-white rounded-xl font-bold transition-all border border-[#7C4DFF]/30 shadow-lg group disabled:opacity-50"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH3DI4Aqenhf8x4Si2IWRveQ5zYCqIJlCkUg&s"
                alt="Mezon"
                className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
              />
              {loading ? 'Đang chuyển hướng...' : 'Đăng nhập bằng App Mezon'}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-sm sm:text-base text-purple-100 text-center flex items-center justify-center gap-2">
                <span>🎁</span>
                <span>Tạo tài khoản nhận ngay <strong className="text-yellow-400 font-black">1.000.000đ</strong> khởi nghiệp!</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center space-y-3 animate-fade-in-up">
          <div className="bg-white/5 backdrop-blur-md inline-block px-6 py-2.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
            <p className="text-gray-300 text-xs sm:text-sm flex items-center gap-2 justify-center flex-wrap tracking-wide">
              <span>Developed by</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-base sm:text-lg">Mạnh Mơ Màng</span>
              <span className="animate-pulse">👾</span>
            </p>
          </div>
          <p className="text-gray-500 text-[10px] sm:text-xs tracking-wider">
            © {new Date().getFullYear()} M-GAME PORTAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
};
