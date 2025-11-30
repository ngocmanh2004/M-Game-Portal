import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserPublicProfile, FriendRequest } from '../types';

export const useFriends = (userId: string | undefined) => {
  const [friends, setFriends] = useState<UserPublicProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ REALTIME: Lắng nghe danh sách bạn bè
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const friendIds = userData.friends || [];
        
        if (friendIds.length > 0) {
          // Fetch friend profiles
          const friendProfiles = await Promise.all(
            friendIds.map(async (friendId: string) => {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                const data = friendDoc.data();
                return {
                  uid: friendId,
                  email: data.email,
                  avatar: data.avatar,
                  money: data.money,
                  onlineStatus: data.onlineStatus || false,
                  lastSeen: data.lastSeen
                } as UserPublicProfile;
              }
              return null;
            })
          );
          
          setFriends(friendProfiles.filter(f => f !== null) as UserPublicProfile[]);
        } else {
          setFriends([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // ⭐ REALTIME: Lắng nghe lời mời kết bạn
  useEffect(() => {
    if (!userId) return;

    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('to', '==', userId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests: FriendRequest[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            from: data.from,
            to: data.to,
            status: data.status,
            createdAt: data.createdAt?.toMillis() || Date.now()
          } as FriendRequest;
        })
      );
      
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [userId]);

  // ⭐ Tìm kiếm người dùng theo email
  const searchUsers = async (searchTerm: string): Promise<UserPublicProfile[]> => {
    if (!searchTerm || searchTerm.length < 3) return [];

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const users: UserPublicProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
          doc.id !== userId // Không hiện chính mình
        ) {
          users.push({
            uid: doc.id,
            email: data.email,
            avatar: data.avatar,
            money: data.money,
            onlineStatus: data.onlineStatus || false
          });
        }
      });
      
      return users.slice(0, 10); // Giới hạn 10 kết quả
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // ⭐ Gửi lời mời kết bạn
  const sendFriendRequest = async (toUserId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập' };
    
    try {
      // Check xem đã là bạn chưa
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (userData?.friends?.includes(toUserId)) {
        return { success: false, message: 'Đã là bạn bè rồi!' };
      }

      // Check xem đã gửi lời mời chưa
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', userId),
        where('to', '==', toUserId),
        where('status', '==', 'pending')
      );
      
      const existingRequests = await getDocs(existingRequestQuery);
      if (!existingRequests.empty) {
        return { success: false, message: 'Đã gửi lời mời rồi!' };
      }

      // Tạo lời mời mới
      const requestRef = doc(collection(db, 'friendRequests'));
      await setDoc(requestRef, {
        from: userId,
        to: toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Thêm vào friendRequests array của người nhận
      await updateDoc(doc(db, 'users', toUserId), {
        friendRequests: arrayUnion(requestRef.id)
      });

      return { success: true, message: 'Đã gửi lời mời kết bạn!' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // ⭐ Chấp nhận lời mời kết bạn
  const acceptFriendRequest = async (requestId: string, fromUserId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập' };

    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted'
      });

      // Thêm vào danh sách bạn bè của cả 2
      await updateDoc(doc(db, 'users', userId), {
        friends: arrayUnion(fromUserId),
        friendRequests: arrayRemove(requestId)
      });

      await updateDoc(doc(db, 'users', fromUserId), {
        friends: arrayUnion(userId)
      });

      // Tạo friendship document
      const friendshipRef = doc(collection(db, 'friendships'));
      await setDoc(friendshipRef, {
        users: [userId, fromUserId].sort(), // Sort để dễ query
        createdAt: serverTimestamp()
      });

      return { success: true, message: 'Đã kết bạn thành công!' };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // ⭐ Từ chối lời mời
  const rejectFriendRequest = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập' };

    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected'
      });

      await updateDoc(doc(db, 'users', userId), {
        friendRequests: arrayRemove(requestId)
      });

      // Xóa request sau 1 giây
      setTimeout(async () => {
        await deleteDoc(doc(db, 'friendRequests', requestId));
      }, 1000);

      return { success: true, message: 'Đã từ chối!' };
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  // ⭐ Hủy kết bạn
  const removeFriend = async (friendId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Chưa đăng nhập' };

    try {
      // Xóa khỏi danh sách bạn bè của cả 2
      await updateDoc(doc(db, 'users', userId), {
        friends: arrayRemove(friendId)
      });

      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(userId)
      });

      // Xóa friendship document
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', userId)
      );
      
      const snapshot = await getDocs(friendshipsQuery);
      snapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.users.includes(friendId)) {
          await deleteDoc(doc.ref);
        }
      });

      return { success: true, message: 'Đã hủy kết bạn!' };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, message: 'Có lỗi xảy ra!' };
    }
  };

  return {
    friends,
    friendRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  };
};