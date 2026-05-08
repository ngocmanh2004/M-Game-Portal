import React, { useEffect, useState } from 'react';
import { Check, X, UserCheck, Loader2 } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const FriendRequests: React.FC = () => {
  const { user } = useAuth();
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, loading } = useFriends(user?.uid);
  const [requestUsers, setRequestUsers] = useState<{ uid: string; email: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await Promise.all(
        friendRequests.map(async (req) => {
          const docSnap = await getDoc(doc(db, 'users', req.from));
          return {
            uid: req.from,
            email: docSnap.exists() ? docSnap.data().email : req.from,
          };
        })
      );
      setRequestUsers(users);
    };
    if (friendRequests.length > 0) fetchUsers();
    else setRequestUsers([]);
  }, [friendRequests]);

  if (loading || requestUsers.length === 0) return null;

  return (
    <div className="mb-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <UserCheck className="w-4 h-4 text-yellow-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Lời mời kết bạn
        </h2>
        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black text-[10px] font-black">
          {requestUsers.length}
        </span>
      </div>

      <ul className="space-y-2">
        {friendRequests.map((req, i) => (
          <li
            key={req.id}
            className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-4 py-3 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 text-xs font-black">
                {(requestUsers[i]?.email || req.from).charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-gray-300 text-sm font-medium flex-1 truncate">
              {requestUsers[i]?.email || req.from}
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => acceptFriendRequest(req.id, req.from)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                Chấp nhận
              </button>
              <button
                onClick={() => rejectFriendRequest(req.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                Từ chối
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};