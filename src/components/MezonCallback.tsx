import React, { useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  clearAutoLoginInProgress,
  isPopupCallbackWindow,
  mezonStorageKeys,
  persistAuthToken,
  setAutoLoginBlock,
} from '../utils/mezonOAuth';

interface MezonCallbackProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const MezonCallback: React.FC<MezonCallbackProps> = ({ onSuccess, onError }) => {
  useEffect(() => {
    const isPopupFlow = isPopupCallbackWindow();

    const finalizePopup = (payload: Record<string, string>) => {
      if (!isPopupFlow || !window.opener || window.opener.closed) return;

      window.opener.postMessage(
        {
          source: 'mezon-oauth',
          ...payload,
        },
        window.location.origin
      );

      window.close();
    };

    const redirectToHome = () => {
      window.location.replace('/');
    };

    const handleFailure = (message: string) => {
      clearAutoLoginInProgress();
      setAutoLoginBlock(60 * 1000);

      if (isPopupFlow) {
        finalizePopup({ status: 'error', message });
        return;
      }

      onError(message);
      redirectToHome();
    };

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const oauthError = urlParams.get('error');

      if (oauthError) {
        handleFailure('Mezon OAuth failed.');
        return;
      }

      if (!code || !state) {
        handleFailure('Missing OAuth code/state.');
        return;
      }

      const savedState = sessionStorage.getItem(mezonStorageKeys.state);
      if (state !== savedState) {
        handleFailure('Invalid OAuth state.');
        return;
      }

      try {
        const configuredApiBase = process.env.REACT_APP_API_BASE_URL;
        const defaultApiBase = window.location.hostname === 'localhost'
          ? 'http://localhost:5000'
          : 'https://m-game-portal.vercel.app';
        const backendUrl = (configuredApiBase || defaultApiBase).replace(/\/$/, '');
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

        const responseText = await response.text();
        let data: any = {};

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            if (!response.ok) {
              throw new Error(responseText);
            }

            throw new Error('Phản hồi từ server không đúng định dạng JSON.');
          }
        }

        if (!response.ok) {
          const detailMessage = typeof data.details === 'string'
            ? data.details
            : data.details?.error_description || data.details?.error;

          throw new Error(detailMessage || data.error || 'Lỗi khi trao đổi token');
        }

        const { customToken } = data;
        if (!customToken || typeof customToken !== 'string') {
          throw new Error('Missing custom token from backend.');
        }

        persistAuthToken(customToken);
        const userCredential = await signInWithCustomToken(auth, customToken);

        // Sync profile fields from Mezon userinfo so UI can display avatar immediately.
        const backendUser = data?.user || {};
        const profilePatch: Record<string, any> = {
          lastLogin: serverTimestamp(),
        };
        if (backendUser.email) {
          profilePatch.email = backendUser.email;
        }
        if (backendUser.username) {
          profilePatch.nickname = backendUser.username;
        }
        if (backendUser.avatar) {
          profilePatch.avatar = backendUser.avatar;
        }
        if (backendUser.uid) {
          profilePatch.mezonUid = String(backendUser.uid);
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), profilePatch, { merge: true });

        sessionStorage.removeItem(mezonStorageKeys.state);
        clearAutoLoginInProgress();

        if (isPopupFlow) {
          finalizePopup({ status: 'success' });
          return;
        }

        onSuccess();
      } catch (err: any) {
        console.error('Mezon Callback Error:', err);
        handleFailure(err?.message || 'OAuth callback failed.');
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0a0a14 0%, #13131f 50%, #0e0e1c 100%)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6 px-8 text-center">
        {/* Logo */}
        <img
          src="/assets/image/logos/logoWeb.png"
          alt="M-GAME"
          className="w-16 h-16 rounded-2xl object-contain"
          style={{ boxShadow: '0 8px 30px rgba(139,92,246,0.4)' }}
        />

        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: '3px solid rgba(139,92,246,0.15)',
              borderTopColor: '#8b5cf6',
            }}
          />
          <div
            className="absolute inset-2 rounded-full animate-spin"
            style={{
              border: '2px solid rgba(236,72,153,0.15)',
              borderTopColor: '#ec4899',
              animationDirection: 'reverse',
              animationDuration: '0.7s',
            }}
          />
        </div>

        <div>
          <p className="text-white font-bold text-lg tracking-wide">Đang xác thực Mezon</p>
          <p className="text-white/40 text-sm mt-1">Vui lòng đợi trong giây lát...</p>
        </div>

        {/* Dots animation */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#8b5cf6',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
