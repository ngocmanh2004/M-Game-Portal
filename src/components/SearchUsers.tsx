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
    <div className="p-4 max-w-lg mx-auto bg-white/10 rounded-xl border border-yellow-400">
      <h2 className="text-xl font-bold mb-3 text-yellow-300">🔍 Tìm bạn để kết bạn</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Nhập email user..."
        className="w-full p-2 rounded-lg border border-yellow-400 mb-4 bg-white/20 text-white"
      />
      {results.length === 0 && search.trim() && (
        <div className="text-white/60 text-center">Không tìm thấy user phù hợp.</div>
      )}
      <ul>
        {results.map((u) => (
          <li key={u.uid} className="flex items-center gap-3 mb-3 bg-white/5 p-2 rounded-lg">
            <img
              src={u.avatar || "/assets/image/avatar-default.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-yellow-400"
            />
            <span className="flex-1 text-white">{u.email}</span>
            {sent.includes(u.uid) ? (
              <span className="text-green-400 font-bold">Đã gửi</span>
            ) : (
              <button
                className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg font-bold hover:bg-yellow-300 disabled:opacity-50"
                onClick={() => sendRequest(u)}
                disabled={sending === u.uid}
              >
                {sending === u.uid ? "Đang gửi..." : "Kết bạn"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <div className="text-red-400 mt-2">{error}</div>}
    </div>
  );
};