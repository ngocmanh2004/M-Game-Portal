import React, { useEffect, useState } from 'react';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const FriendRequests: React.FC = () => {
  const { user } = useAuth();
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, loading } = useFriends(user?.uid);
  const [requestUsers, setRequestUsers] = useState<{ uid: string, email: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await Promise.all(
        friendRequests.map(async (req) => {
          const docSnap = await getDoc(doc(db, 'users', req.from));
          return {
            uid: req.from,
            email: docSnap.exists() ? docSnap.data().email : req.from
          };
        })
      );
      setRequestUsers(users);
    };
    if (friendRequests.length > 0) fetchUsers();
    else setRequestUsers([]);
  }, [friendRequests]);

  if (loading) return <div className="text-white text-center py-8">Đang tải lời mời...</div>;

  if (requestUsers.length === 0) {
    return <div className="text-white text-center py-8">Không có lời mời kết bạn nào.</div>;
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-xl text-yellow-400 font-bold mb-3">Lời mời kết bạn</h2>
      <ul className="space-y-3">
        {friendRequests.map((req, i) => (
          <li key={req.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-white text-sm">{requestUsers[i]?.email || req.from}</span>
            <div className="flex gap-2">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={() => acceptFriendRequest(req.id, req.from)}
              >Chấp nhận</button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                onClick={() => rejectFriendRequest(req.id)}
              >Từ chối</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};