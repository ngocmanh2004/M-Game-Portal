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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" aria-label="Loading" />
    </div>
  );
};
