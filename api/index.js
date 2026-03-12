require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

// Khởi tạo Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // File này nằm ở root, api/index.js cũng ở root (cấu trúc monorepo vercel)
  try {
    serviceAccount = require('../serviceAccountKey.json');
  } catch (e) {
    serviceAccount = require('./serviceAccountKey.json');
  }
}

// Tránh khởi tạo nhiều lần khi hot reload trên Vercel
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gametet-vn-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const app = express();

// Cho phép CORS từ mọi nơi để test, Vercel sẽ xử lý preflight
app.use(cors({
  origin: true, // Tự động cho phép domain gọi vào (trả về header origin của request)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MEZON_CLIENT_ID = "2031726261864239104";
const MEZON_CLIENT_SECRET = "mGtQINbpnKyOcdSY";
const MEZON_TOKEN_URL = "https://oauth2.mezon.ai/oauth2/token";
const MEZON_USER_INFO_URL = "https://oauth2.mezon.ai/userinfo";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://m-game-portal.vercel.app/mezon-callback"; 

app.post('/api/mezon/exchange', async (req, res) => {
  const { code, state, redirect_uri } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  const finalRedirectUri = redirect_uri || REDIRECT_URI;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('state', state);
    params.append('client_id', MEZON_CLIENT_ID);
    params.append('client_secret', MEZON_CLIENT_SECRET);
    params.append('redirect_uri', finalRedirectUri);

    const tokenResponse = await axios.post(MEZON_TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get(MEZON_USER_INFO_URL, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const mezonUser = userResponse.data;
    const mezonUserId = mezonUser.id || mezonUser.sub; 

    if (!mezonUserId) throw new Error('Could not get Mezon User ID');

    const customToken = await admin.auth().createCustomToken(String(mezonUserId), {
      mezon_username: mezonUser.username || mezonUser.name
    });

    res.json({ customToken });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to exchange token', 
      details: error.response?.data || error.message 
    });
  }
});

// Vercel không cần app.listen, nó sẽ dùng module.exports
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
