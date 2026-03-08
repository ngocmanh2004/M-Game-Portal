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

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#1a0f0a]">
        <div className="text-white text-xl animate-pulse flex flex-col items-center">
          <span className="text-4xl mb-3">⏳</span>
          Đang tải bạn bè...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#1a0f0a] pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Lời mời kết bạn */}
        <FriendRequests />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl sm:text-3xl text-yellow-400 font-black tracking-wide drop-shadow-md flex items-center gap-2">
            <span>👥</span> Danh Sách Bạn Bè
          </h2>
          <button
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95"
            onClick={() => setShowSearch(true)}
            title="Thêm bạn mới"
          >
            <span className="text-xl">➕</span>
            <span>Thêm Bạn Mới</span>
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 text-center text-gray-400 flex flex-col items-center">
            <span className="text-6xl mb-4 opacity-50">📭</span>
            <p className="text-lg font-medium">Bạn chưa có bạn bè nào.</p>
            <p className="text-sm mt-1 opacity-70">Hãy nhấn "Thêm Bạn Mới" để tìm kiếm nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {friends.map(friend => (
              <div key={friend.uid} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all shadow-xl group">
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 overflow-hidden bg-black p-0.5 group-hover:border-yellow-400/50 transition-colors">
                      <img
                        src={friend.avatar || '/assets/default_avatar.png'}
                        alt={friend.email}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/assets/default_avatar.png'; }}
                      />
                    </div>
                    {/* Assuming online status isn't directly available without more hooks, using a placeholder subtle indicator */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1a0f0a]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg truncate group-hover:text-yellow-400 transition-colors">
                      {friend.email.split('@')[0]}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{friend.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/50 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                    onClick={() => setChatFriend(friend.uid)}
                  >
                    <span>💬</span> <span className="hidden sm:inline">Nhắn Tin</span>
                  </button>
                  <button
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 border border-pink-500/50 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                  >
                    <span>🎁</span> <span className="hidden sm:inline">Tặng Quà</span>
                  </button>
                  <button
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-500/50 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
                    onClick={() => setShowProfile(friend.uid)}
                  >
                    <span>👤</span> <span className="hidden sm:inline">Hồ Sơ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
};