import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

interface UserProfile {
  uid: string;
  email: string;
  avatar?: string;
}

export const SearchUsers: React.FC = () => {
  const { user } = useAuth(); // user.uid là UID hiện tại
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách user (trừ chính mình)
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setAllUsers(
        snap.docs
          .map((doc) => ({
            uid: doc.id,
            email: doc.data().email,
            avatar: doc.data().avatar,
          }))
          .filter((u) => u.uid !== user?.uid)
      );
    };
    fetchUsers();
  }, [user?.uid]);

  // Lọc user theo search
  useEffect(() => {
    if (!search.trim()) {
      // Hiện 10 user ngẫu nhiên nếu chưa nhập gì
      setResults(allUsers.slice(0, 10));
      return;
    }
    setResults(
      allUsers.filter((u) =>
        u.email.toLowerCase().includes(search.trim().toLowerCase())
      )
    );
  }, [search, allUsers]);

  // Gửi lời mời kết bạn
  const sendRequest = async (toUser: UserProfile) => {
    if (!user?.uid) return;
    setSending(toUser.uid);
    setError(null);

    // Kiểm tra đã gửi chưa (theo from-to)
    const q = query(
      collection(db, "friendRequests"),
      where("from", "==", user.uid),
      where("to", "==", toUser.uid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError("Bạn đã gửi lời mời này rồi!");
      setSending(null);
      return;
    }

    // Tạo request mới
    const requestId = `${user.uid}_${toUser.uid}`;
    await setDoc(doc(db, "friendRequests", requestId), {
      from: user.uid,
      to: toUser.uid,
      createdAt: serverTimestamp(),
      status: "pending",
    });
    setSent((prev) => [...prev, toUser.uid]);
    setSending(null);
  };

  return (
    <div className="p-6 sm:p-8 w-[90vw] max-w-2xl mx-auto bg-[#0f172a]/95 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400 drop-shadow-md flex items-center gap-3">
        <span>🔍</span> Tìm & Thêm Bạn Mới
      </h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Nhập email người chơi..."
        className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium mb-6 shadow-inner"
      />
      {results.length === 0 && search.trim() && (
        <div className="text-white/40 text-center py-8 font-medium">Không tìm thấy người chơi nào phù hợp.</div>
      )}
      <ul className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {results.map((u) => (
          <li
            key={u.uid}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 hover:bg-white/10 px-5 py-4 rounded-2xl border border-white/10 hover:border-white/30 transition-all group hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-4 flex-1 w-full min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full border-2 border-white/20 group-hover:border-blue-400/60 shadow-lg overflow-hidden bg-black transition-colors">
                <img
                  src={u.avatar || "/assets/default_avatar.png"}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png"; }}
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white font-bold text-base sm:text-lg truncate pr-2 group-hover:text-blue-300 transition-colors">
                  {u.email.split('@')[0]}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm truncate pr-2 font-medium">
                  {u.email}
                </span>
              </div>
            </div>

            {sent.includes(u.uid) ? (
              <span className="text-green-400 font-bold bg-green-500/10 px-5 py-2.5 rounded-xl border border-green-500/20 shrink-0 text-sm w-full sm:w-auto text-center">
                ✓ Đã Gửi
              </span>
            ) : (
              <button
                className="bg-gradient-to-r w-full sm:w-auto from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-black shadow-[0_5px_15px_rgba(59,130,246,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale shrink-0"
                onClick={() => sendRequest(u)}
                disabled={sending === u.uid}
              >
                {sending === u.uid ? "⏳ Đang gửi..." : "➕ Kết bạn"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <div className="text-red-400 font-bold mt-4 text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,215,0,0.3);
        }
      `}</style>
    </div>
  );
};