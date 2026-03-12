import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';

interface MezonCallbackProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const MezonCallback: React.FC<MezonCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState('Đang xác thực với Mezon...');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code || !state) {
        onError('Không tìm thấy mã xác thực từ Mezon.');
        return;
      }

      const savedState = sessionStorage.getItem('mezon_auth_state');
      if (state !== savedState) {
        onError('Xác thực chuỗi State không khớp. Có thể là một cuộc tấn công CSRF.');
        return;
      }

      try {
        setStatus('Đang trao đổi token...');
        const backendUrl = 'https://m-game-portal.vercel.app';
        const currentRedirectUri = `${window.location.origin}/mezon-callback`;

        const response = await fetch(`${backendUrl}/api/mezon/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code, 
            state,
            redirect_uri: currentRedirectUri 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Lỗi khi trao đổi token');
        }

        const { customToken } = data;

        setStatus('Đang đăng nhập vào Minigame...');
        await signInWithCustomToken(auth, customToken);
        
        sessionStorage.removeItem('mezon_auth_state');
        
        window.history.replaceState({}, document.title, "/");
        
        onSuccess();
      } catch (err: any) {
        console.error('Mezon Callback Error:', err);
        onError(err.message || 'Có lỗi xảy ra trong quá trình đăng nhập.');
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white p-6">
      <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold mb-2">Vui lòng đợi</h2>
      <p className="text-blue-200/70">{status}</p>
      
      <div className="mt-8 text-xs text-gray-500 italic">
        Đang xử lý luồng bảo mật của Mezon OAuth2...
      </div>
    </div>
  );
};
