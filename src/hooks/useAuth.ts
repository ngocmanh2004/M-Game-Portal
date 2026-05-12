import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserProfile = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const email = firebaseUser.email || '';
      const fallbackName = firebaseUser.displayName || `mezon_${firebaseUser.uid.slice(0, 8)}`;

      await setDoc(userRef, {
        email,
        nickname: fallbackName,
        money: 1000000,
        tickets: 0,
        isAdmin: email.toLowerCase() === 'admin@gametet.vn' || email.toLowerCase() === 'admin',
        tasks: {
          followTiktok: false,
          subscribeYoutube: false
        },
        lastCheckin: '',
        avatar: firebaseUser.photoURL || '',
        background: '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });

      return;
    }

    const existingData = userSnap.data() as {
      email?: string;
      nickname?: string;
      avatar?: string;
    };
    const providerIds = firebaseUser.providerData.map((provider) => provider.providerId);
    const isGoogleUser = providerIds.includes('google.com');

    const updates: Record<string, any> = {
      lastLogin: serverTimestamp()
    };

    if (!existingData.email && firebaseUser.email) {
      updates.email = firebaseUser.email;
    }

    if (!existingData.nickname && firebaseUser.displayName) {
      updates.nickname = firebaseUser.displayName;
    }

    if (isGoogleUser && firebaseUser.photoURL && existingData.avatar !== firebaseUser.photoURL) {
      updates.avatar = firebaseUser.photoURL;
    }

    await updateDoc(userRef, updates);
  };

  useEffect(() => {
    // Xử lý kết quả Google redirect login trên mobile
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureUserProfile(result.user);
        }
      })
      .catch((err) => {
        console.warn('getRedirectResult:', err?.code);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        ensureUserProfile(firebaseUser).catch((error) => {
          console.error('Failed to ensure user profile:', error);
        });
      }
    });

    return unsubscribe;
  }, []);

  // ⭐ Sửa hàm register - Tự động tạo Admin
  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ⭐ Check nếu là Admin
    const isAdmin = email.toLowerCase() === 'admin@gametet.vn' || email.toLowerCase() === 'admin';
    const initialMoney = isAdmin ? 1000000000000000 : 1000000; // 1 triệu tỷ hoặc 1 triệu

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      money: initialMoney,
      isAdmin: isAdmin,  // ⭐ Đánh dấu Admin
      tasks: {
        followTiktok: false,
        subscribeYoutube: false
      },
      lastCheckin: '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    return user;
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    await ensureUserProfile(userCredential.user);

    return userCredential.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    const userCredential = await signInWithPopup(auth, provider);
    await ensureUserProfile(userCredential.user);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  // ⭐ Hàm tạo Admin thủ công (dùng 1 lần)
  const createAdminAccount = async () => {
    try {
      const adminEmail = 'admin@gametet.vn';
      const adminPassword = 'Manhdz123';

      // Check xem admin đã tồn tại chưa
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: adminEmail,
        money: 1000000000000000, // 1 triệu tỷ
        isAdmin: true,
        tasks: {
          followTiktok: true,
          subscribeYoutube: true
        },
        lastCheckin: new Date().toLocaleDateString('vi-VN'),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      console.log('✅ Tài khoản Admin đã được tạo!');
      return { success: true, message: 'Admin account created!' };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin đã tồn tại');
        return { success: false, message: 'Admin already exists' };
      }
      throw error;
    }
  };

  return { user, loading, register, login, loginWithGoogle, logout, createAdminAccount };
};
