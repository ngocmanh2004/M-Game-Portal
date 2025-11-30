import React, { useState } from 'react';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { ChatWindow } from './ChatWindow';
import { SearchUsers } from './SearchUsers';
import { UserProfileModal } from './UserProfileModal';
import { FriendRequests } from './FriendRequests'; // Thêm dòng này

export const Friends: React.FC = () => {
  const { user } = useAuth();
  const { friends, loading } = useFriends(user?.uid);
  const [chatFriend, setChatFriend] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState<string | null>(null);

  if (loading) return <div className="text-white text-center py-8">Đang tải bạn bè...</div>;

  return (
    <>
      <div className="max-w-lg mx-auto py-4">
        {/* ⭐ Thêm dòng này để hiển thị lời mời kết bạn */}
        <FriendRequests />

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl text-yellow-400 font-bold">Bạn bè</h2>
          <button
            className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg font-bold hover:bg-yellow-300 shadow-lg transition"
            onClick={() => setShowSearch(true)}
            title="Thêm bạn mới"
          >
            <span className="text-xl">➕</span>
            <span>Thêm bạn</span>
          </button>
        </div>
        {friends.length === 0 ? (
          <div className="text-white text-center py-8">Bạn chưa có bạn bè nào.</div>
        ) : (
          <ul className="space-y-3">
            {friends.map(friend => (
              <li key={friend.uid} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="text-white text-sm">{friend.email}</span>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => setChatFriend(friend.uid)}
                  >Chat</button>
                  <button
                    className="bg-pink-500 text-white px-3 py-1 rounded hover:bg-pink-600"
                  >Tặng quà</button>
                  <button
                    className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded hover:bg-yellow-300"
                    onClick={() => setShowProfile(friend.uid)}
                  >Xem hồ sơ</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Chat Window */}
      {chatFriend && user?.uid && (
        <ChatWindow
          userId={user.uid}
          friendId={chatFriend}
          onClose={() => setChatFriend(null)}
        />
      )}
      {/* Search Users Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-red-500 text-xl font-bold z-10"
              onClick={() => setShowSearch(false)}
            >
              ✖
            </button>
            <SearchUsers />
          </div>
        </div>
      )}
      {/* User Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-white/10 rounded-xl p-4 max-w-lg w-full">
            <button
              className="absolute top-2 right-2 text-red-500 text-xl font-bold z-10"
              onClick={() => setShowProfile(null)}
            >✖</button>
            <UserProfileModal userId={showProfile} />
          </div>
        </div>
      )}
    </>
  );
};