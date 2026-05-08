import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Loader2, CheckCircle2, UserX, RefreshCw } from 'lucide-react';
import { collection, getDocs, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface UserProfile {
  uid: string;
  email: string;
  avatar?: string;
}

export const SearchUsers: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    setFetching(true);
    const [usersSnap, sentSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'friendRequests'), where('from', '==', user.uid))),
    ]);
    setAllUsers(
      usersSnap.docs
        .map((d) => ({ uid: d.id, email: d.data().email, avatar: d.data().avatar }))
        .filter((u) => u.uid !== user.uid)
    );
    setSent(sentSnap.docs.map((d) => d.data().to as string));
    setFetching(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!search.trim()) {
      setResults(allUsers.slice(offset, offset + PAGE_SIZE));
      return;
    }
    setResults(
      allUsers.filter((u) => u.email.toLowerCase().includes(search.trim().toLowerCase()))
    );
  }, [search, allUsers, offset]);

  const handleRefresh = () => {
    if (search.trim()) return;
    setOffset((prev) => (prev + PAGE_SIZE) % Math.max(allUsers.length, 1));
  };

  const sendRequest = async (toUser: UserProfile) => {
    if (!user?.uid) return;
    setSending(toUser.uid);
    setError(null);

    const q = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid),
      where('to', '==', toUser.uid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError('Bạn đã gửi lời mời này rồi!');
      setSending(null);
      return;
    }

    const requestId = `${user.uid}_${toUser.uid}`;
    await setDoc(doc(db, 'friendRequests', requestId), {
      from: user.uid,
      to: toUser.uid,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    setSent((prev) => [...prev, toUser.uid]);
    setSending(null);
  };

  return (
    <div className="w-[92vw] max-w-xl mx-auto bg-[#0f0f1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Tìm người chơi</h2>
          <button
            onClick={handleRefresh}
            disabled={fetching || !!search.trim()}
            title={`Đang hiển thị ${offset + 1}–${Math.min(offset + PAGE_SIZE, allUsers.length)} / ${allUsers.length}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 hover:border-yellow-400/60 text-yellow-400 hover:text-yellow-300 text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] focus:border-yellow-400/40 focus:bg-white/[0.08] text-white placeholder-gray-600 text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="max-h-[52vh] overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {results.length === 0 && search.trim() && (
          <div className="flex flex-col items-center gap-3 py-10">
            <UserX className="w-8 h-8 text-gray-600" />
            <p className="text-gray-500 text-sm">Không tìm thấy người chơi nào</p>
          </div>
        )}

        {results.map((u) => (
          <div
            key={u.uid}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 group-hover:ring-yellow-400/20 transition-all">
              <img
                src={u.avatar || '/assets/default_avatar.png'}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/assets/default_avatar.png';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{u.email.split('@')[0]}</p>
              <p className="text-gray-500 text-xs truncate">{u.email}</p>
            </div>

            {sent.includes(u.uid) ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                Đã gửi
              </div>
            ) : (
              <button
                onClick={() => sendRequest(u)}
                disabled={sending === u.uid}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 hover:border-yellow-400/40 text-yellow-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {sending === u.uid ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Kết bạn
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="px-6 py-3 border-t border-white/[0.06]">
          <p className="text-red-400 text-xs font-medium text-center">{error}</p>
        </div>
      )}

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(234,179,8,0.2); }
      `}</style>
    </div>
  );
};