import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// ⭐ Firebase config từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAiSbZ-qJ97w1gr0tZvCuJGQmu0BQMZwCU",
  authDomain: "m-game.firebaseapp.com",
  projectId: "gametet-vn",
  storageBucket: "gametet-vn.appspot.com",
  messagingSenderId: "97855747402",
  appId: "1:97855747402:web:d0fe5f169f4e21913c3db3",
  databaseURL: "https://gametet-vn-default-rtdb.asia-southeast1.firebasedatabase.app", // ⭐ Đúng region
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);      // Đăng nhập/Đăng ký
export const db = getFirestore(app);   // Firestore
export const rtdb = getDatabase(app);  // Realtime Database
export const storage = getStorage(app); // Storage

export default app;