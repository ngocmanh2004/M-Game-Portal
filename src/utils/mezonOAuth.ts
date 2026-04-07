const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const MEZON_AUTH_STATE_KEY = 'mezon_auth_state';
const AUTO_LOGIN_IN_PROGRESS_KEY = 'mezon_auto_login_in_progress_at';
const AUTO_LOGIN_BLOCK_UNTIL_KEY = 'mezon_auto_login_block_until';
const AUTH_TOKEN_KEY = 'auth_token';
const AUTO_LOGIN_IN_PROGRESS_TTL_MS = 5 * 60 * 1000;
const MEZON_POPUP_WINDOW_NAME = 'mezon-oauth-login';

type MezonOAuthConfig = {
  clientId: string;
  authorizeUrl: string;
  redirectUri: string;
  scope: string;
};

type MezonOAuthStartMode = 'auto' | 'popup' | 'redirect';

type StartMezonOAuthLoginOptions = {
  mode?: MezonOAuthStartMode;
};

export const mezonStorageKeys = {
  state: MEZON_AUTH_STATE_KEY,
  autoLoginInProgress: AUTO_LOGIN_IN_PROGRESS_KEY,
  autoLoginBlockUntil: AUTO_LOGIN_BLOCK_UNTIL_KEY,
  authToken: AUTH_TOKEN_KEY,
};

export const mezonPopupWindowName = MEZON_POPUP_WINDOW_NAME;

export const isPopupCallbackWindow = (): boolean => {
  return window.name === MEZON_POPUP_WINDOW_NAME && !!window.opener && window.opener !== window;
};

export const isMobileDevice = (userAgent: string = navigator.userAgent): boolean => {
  return MOBILE_USER_AGENT_REGEX.test(userAgent);
};

export const getStoredAuthToken = (): string | null => {
  const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (sessionToken) return sessionToken;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const hasStoredAuthToken = (): boolean => {
  return Boolean(getStoredAuthToken());
};

export const persistAuthToken = (token: string): void => {
  if (!token) return;

  if (localStorage.getItem(AUTH_TOKEN_KEY)) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
};

const getMezonOAuthConfig = (): MezonOAuthConfig => {
  const clientId = process.env.REACT_APP_MEZON_CLIENT_ID || '2031726261864239104';
  const authorizeUrl = process.env.REACT_APP_MEZON_AUTHORIZE_URL || 'https://oauth2.mezon.ai/oauth2/auth';
  const redirectUri = process.env.REACT_APP_MEZON_REDIRECT_URI || `${window.location.origin}/mezon-callback`;
  const scope = process.env.REACT_APP_MEZON_SCOPE || 'openid';

  return {
    clientId,
    authorizeUrl,
    redirectUri,
    scope,
  };
};

const generateRandomState = (length: number = 11): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join('');
};

export const buildMezonAuthorizeUrl = (): string => {
  const { clientId, authorizeUrl, redirectUri, scope } = getMezonOAuthConfig();
  const state = generateRandomState(11);

  sessionStorage.setItem(MEZON_AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope,
    redirect_uri: redirectUri,
    state,
  });

  return `${authorizeUrl}?${params.toString()}`;
};

export const markAutoLoginInProgress = (): void => {
  sessionStorage.setItem(AUTO_LOGIN_IN_PROGRESS_KEY, String(Date.now()));
};

export const clearAutoLoginInProgress = (): void => {
  sessionStorage.removeItem(AUTO_LOGIN_IN_PROGRESS_KEY);
};

export const isAutoLoginInProgress = (): boolean => {
  const value = sessionStorage.getItem(AUTO_LOGIN_IN_PROGRESS_KEY);
  if (!value) return false;

  const startedAt = Number(value);
  if (!Number.isFinite(startedAt)) {
    sessionStorage.removeItem(AUTO_LOGIN_IN_PROGRESS_KEY);
    return false;
  }

  const isStale = Date.now() - startedAt > AUTO_LOGIN_IN_PROGRESS_TTL_MS;
  if (isStale) {
    sessionStorage.removeItem(AUTO_LOGIN_IN_PROGRESS_KEY);
    return false;
  }

  return true;
};

export const setAutoLoginBlock = (durationMs: number): void => {
  sessionStorage.setItem(AUTO_LOGIN_BLOCK_UNTIL_KEY, String(Date.now() + durationMs));
};

export const isAutoLoginBlocked = (): boolean => {
  const value = sessionStorage.getItem(AUTO_LOGIN_BLOCK_UNTIL_KEY);
  if (!value) return false;

  const blockUntil = Number(value);
  if (!Number.isFinite(blockUntil)) {
    sessionStorage.removeItem(AUTO_LOGIN_BLOCK_UNTIL_KEY);
    return false;
  }

  if (Date.now() > blockUntil) {
    sessionStorage.removeItem(AUTO_LOGIN_BLOCK_UNTIL_KEY);
    return false;
  }

  return true;
};

const getPopupFeatures = (): string => {
  const width = 520;
  const height = 720;
  const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
};

export const startMezonOAuthLogin = (options: StartMezonOAuthLoginOptions = {}): Window | null => {
  markAutoLoginInProgress();
  const authorizeUrl = buildMezonAuthorizeUrl();
  const mode = options.mode ?? 'auto';
  const shouldUsePopup = mode === 'popup' || (mode === 'auto' && !isMobileDevice());

  if (shouldUsePopup) {
    const popup = window.open(authorizeUrl, MEZON_POPUP_WINDOW_NAME, getPopupFeatures());
    if (popup && !popup.closed) {
      popup.focus();
      return popup;
    }
  }

  window.location.assign(authorizeUrl);
  return null;
};