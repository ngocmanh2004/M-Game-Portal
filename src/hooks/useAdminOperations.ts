import { useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { AdminUser, UserFilter, AdminStats } from '../types/admin.types';

export const useAdminOperations = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMoney: 0,
    activeUsers: 0,
    lockedUsers: 0
  });

  // ⭐ GET ALL USERS
  const getAllUsers = useCallback(async (pageSize: number = 100) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('money', 'desc'), limit(pageSize));
      const snapshot = await getDocs(q);

      const loadedUsers: AdminUser[] = [];
      let totalMoney = 0;
      let activeCount = 0;
      let lockedCount = 0;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const user: AdminUser = {
          uid: docSnap.id,
          email: data.email || 'Unknown',
          money: data.money || 0,
          avatar: data.avatar,
          background: data.background,
          isAdmin: data.isAdmin || false,
          isLocked: data.isLocked || false,
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          lastLogin: data.lastLogin?.toMillis?.() || Date.now(),
          lastCheckin: data.lastCheckin,
          tasks: data.tasks || { followTiktok: false, subscribeYoutube: false }
        };

        loadedUsers.push(user);
        totalMoney += user.money;
        if (user.lastLogin > sevenDaysAgo) activeCount++;
        if (user.isLocked) lockedCount++;
      });

      setUsers(loadedUsers);
      setFilteredUsers(loadedUsers);
      setStats({
        totalUsers: loadedUsers.length,
        totalMoney,
        activeUsers: activeCount,
        lockedUsers: lockedCount
      });

      console.log('✅ Loaded users:', loadedUsers.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⭐ SEARCH USERS
  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = users.filter(user =>
      user.email.toLowerCase().includes(lowerQuery) ||
      user.uid.toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(results);
  }, [users]);

  // ⭐ FILTER USERS
  const filterUsers = useCallback((filter: UserFilter) => {
    let result = [...users];

    switch (filter.type) {
      case 'admins':
        result = result.filter(u => u.isAdmin);
        break;
      case 'locked':
        result = result.filter(u => u.isLocked);
        break;
      case 'active':
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        result = result.filter(u => u.lastLogin > sevenDaysAgo);
        break;
    }

    switch (filter.sortBy) {
      case 'money_desc':
        result.sort((a, b) => b.money - a.money);
        break;
      case 'money_asc':
        result.sort((a, b) => a.money - b.money);
        break;
      case 'lastLogin':
        result.sort((a, b) => b.lastLogin - a.lastLogin);
        break;
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
    }

    setFilteredUsers(result);
  }, [users]);

  // ⭐ UPDATE MONEY - FIX LỖI CHÍNH
  const updateUserMoney = async (userId: string, newAmount: number): Promise<boolean> => {
    try {
      console.log('💰 Updating money:', userId, newAmount);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        money: newAmount
      });

      // Update local state
      setUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, money: newAmount } : u
      ));
      setFilteredUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, money: newAmount } : u
      ));

      console.log('✅ Money updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating money:', error);
      return false;
    }
  };

  // ⭐ TOGGLE ADMIN - FIX LỖI CHÍNH
  const toggleAdminStatus = async (userId: string, isAdmin: boolean): Promise<boolean> => {
    try {
      console.log('👑 Toggling admin:', userId, isAdmin);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isAdmin: isAdmin
      });

      setUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, isAdmin } : u
      ));
      setFilteredUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, isAdmin } : u
      ));

      console.log('✅ Admin status updated');
      return true;
    } catch (error) {
      console.error('❌ Error toggling admin:', error);
      return false;
    }
  };

  // ⭐ LOCK/UNLOCK - FIX LỖI CHÍNH
  const lockUnlockAccount = async (userId: string, isLocked: boolean): Promise<boolean> => {
    try {
      console.log('🔒 Locking account:', userId, isLocked);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isLocked: isLocked
      });

      setUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, isLocked } : u
      ));
      setFilteredUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, isLocked } : u
      ));

      console.log('✅ Lock status updated');
      return true;
    } catch (error) {
      console.error('❌ Error locking account:', error);
      return false;
    }
  };

  // ⭐ DELETE USER - FIX LỖI CHÍNH
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting user:', userId);
      
      await deleteDoc(doc(db, 'users', userId));

      setUsers(prev => prev.filter(u => u.uid !== userId));
      setFilteredUsers(prev => prev.filter(u => u.uid !== userId));

      console.log('✅ User deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  };

  return {
    users,
    filteredUsers,
    loading,
    stats,
    getAllUsers,
    searchUsers,
    filterUsers,
    updateUserMoney,
    toggleAdminStatus,
    lockUnlockAccount,
    deleteUser
  };
};