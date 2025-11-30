import React, { useState } from 'react';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();

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

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tet-darkRed via-red-800 to-tet-red p-4 relative bg-cover bg-center"
      style={{ 
        backgroundImage: "url('/assets/image/background/bg1.png')",
        backgroundColor: '#960018'
      }}
    >
      
      {/* Lớp phủ */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Background dự phòng */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-700 to-red-900 opacity-80"></div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 animate-bounce-slow drop-shadow-2xl">🏮</div>
          <h1 className="font-festive text-4xl sm:text-5xl md:text-6xl text-tet-yellow drop-shadow-lg mb-2">
            Trò Chơi Tết
          </h1>
          <p className="text-tet-cream text-sm sm:text-base opacity-90 italic drop-shadow-md">
            Chúc Mừng Năm Mới - Phát Tài Phát Lộc 🧧
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border-4 border-tet-gold">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${
                isLogin 
                  ? 'bg-tet-red text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base ${
                !isLogin 
                  ? 'bg-tet-red text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:border-tet-red focus:outline-none transition-colors text-sm sm:text-base"
                placeholder="example@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:border-tet-red focus:outline-none transition-colors text-sm sm:text-base"
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-2 sm:py-3 rounded-xl text-center text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-base sm:text-lg"
              disabled={loading}
            >
              {loading ? '⏳ Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký Ngay')}
            </Button>
          </form>

          {!isLogin && (
            <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
              <p className="text-xs sm:text-sm text-gray-700 text-center">
                🎁 Đăng ký nhận ngay <span className="font-bold text-tet-red">1.000.000đ</span> khởi đầu!
              </p>
            </div>
          )}
        </div>

        {/* Credits */}
        <div className="mt-6 text-center space-y-2">
          <div className="bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full border-2 border-tet-gold/50">
            <p className="text-white/90 text-xs sm:text-sm flex items-center gap-2 justify-center flex-wrap">
              <span>Developed by</span>
              <span className="font-bold text-tet-yellow text-base sm:text-lg">Mạnh</span>
              <span>💻</span>
            </p>
          </div>
          <p className="text-white/60 text-[10px] sm:text-xs">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};
