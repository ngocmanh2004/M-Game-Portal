require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

// Khởi tạo Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Ưu tiên dùng biến môi trường khi deploy lên Render/Cloud
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Dùng file local khi phát triển
  serviceAccount = require('../serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gametet-vn-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const app = express();

// ⭐ Cấu hình CORS để cho phép các domain của bạn
app.use(cors({
  origin: '*', // Cho phép tất cả các domain gọi vào (Phù hợp để test nhanh)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Cấu hình Mezon
const MEZON_CLIENT_ID = "2031726261864239104";
const MEZON_CLIENT_SECRET = "mGtQINbpnKyOcdSY";
const MEZON_TOKEN_URL = "https://oauth2.mezon.ai/oauth2/token";
const MEZON_USER_INFO_URL = "https://oauth2.mezon.ai/userinfo";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://m-game-portal.vercel.app/mezon-callback"; 
// Lưu ý: Redirect URI này phải trùng khớp với những gì bạn cài đặt trong Mezon Developer Portal

app.post('/api/mezon/exchange', async (req, res) => {
  const { code, state, redirect_uri } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  // Sử dụng redirect_uri từ frontend gửi lên, nếu không có thì dùng mặc định
  const finalRedirectUri = redirect_uri || REDIRECT_URI;

  try {
    console.log('Sending token request to Mezon...');
    
    // Bước 3: Đổi mã Code lấy Access Token
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
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('Access token received');

    // Bước 4: Lấy thông tin người dùng
    const userResponse = await axios.get(MEZON_USER_INFO_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const mezonUser = userResponse.data;
    const mezonUserId = mezonUser.id || mezonUser.sub; // Tùy thuộc cấu trúc trả về của Mezon

    if (!mezonUserId) {
      throw new Error('Could not get Mezon User ID');
    }

    // Tạo Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(String(mezonUserId), {
      mezon_username: mezonUser.username || mezonUser.name
    });

    // Trả token về cho Frontend
    res.json({ customToken });

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
