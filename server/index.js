require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

let firebaseInitError = null;

function resolveServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${error.message}`);
    }
  }

  try {
    return require('../serviceAccountKey.json');
  } catch (error) {
    throw new Error('Missing Firebase service account. Add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT.');
  }
}

function ensureFirebaseInitialized() {
  if (admin.apps.length) return;
  if (firebaseInitError) throw firebaseInitError;

  try {
    const serviceAccount = resolveServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://gametet-vn-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
  } catch (error) {
    firebaseInitError = error;
    throw error;
  }
}

const app = express();

const defaultOrigins = [
  'https://m-game.web.app',
  'https://m-game-portal.vercel.app',
  'http://localhost:3000'
];

const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const MEZON_CLIENT_ID = process.env.MEZON_CLIENT_ID;
const MEZON_CLIENT_SECRET = process.env.MEZON_CLIENT_SECRET;
const MEZON_TOKEN_URL = process.env.MEZON_TOKEN_URL || 'https://oauth2.mezon.ai/oauth2/token';
const MEZON_USER_INFO_URL = process.env.MEZON_USER_INFO_URL || 'https://oauth2.mezon.ai/userinfo';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://m-game-portal.vercel.app/mezon-callback';

app.post('/api/mezon/exchange', async (req, res) => {
  const { code, state, redirect_uri } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  const finalRedirectUri = redirect_uri || REDIRECT_URI;

  if (!MEZON_CLIENT_ID || !MEZON_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Server OAuth configuration is missing',
      details: 'Set MEZON_CLIENT_ID and MEZON_CLIENT_SECRET environment variables.'
    });
  }

  try {
    ensureFirebaseInitialized();

    console.log('Sending token request to Mezon...');
    
     const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('state', state);
    params.append('client_id', MEZON_CLIENT_ID);
    params.append('client_secret', MEZON_CLIENT_SECRET);
    params.append('redirect_uri', finalRedirectUri);

    const tokenResponse = await axios.post(MEZON_TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });

    const { access_token } = tokenResponse.data;
    console.log('Access token received');

    const userResponse = await axios.get(MEZON_USER_INFO_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
      timeout: 15000
    });

    const mezonUser = userResponse.data || {};
    const mezonUserId = mezonUser.user_id || mezonUser.id || mezonUser.sub;
    const mezonEmail = mezonUser.email || null;
    const mezonAvatar =
      mezonUser.avatar ||
      mezonUser.avatar_url ||
      mezonUser.picture ||
      mezonUser.image_url ||
      null;
    const mezonUsername =
      mezonUser.username ||
      mezonUser.display_name ||
      mezonUser.name ||
      mezonUser.global_name ||
      (mezonEmail ? String(mezonEmail).split('@')[0] : `mezon_${String(mezonUserId || '').slice(0, 8)}`);

    if (!mezonUserId) {
      throw new Error('Could not get Mezon User ID');
    }

    const customToken = await admin.auth().createCustomToken(String(mezonUserId), {
      mezon_username: mezonUsername,
      mezon_avatar: mezonAvatar || ''
    });

    res.json({
      customToken,
      user: {
        uid: String(mezonUserId),
        email: mezonEmail,
        username: mezonUsername,
        avatar: mezonAvatar
      },
      mezonUser
    });

  } catch (error) {
    console.error('Mezon Login Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to exchange token', 
      details: error.response?.data || error.message 
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
