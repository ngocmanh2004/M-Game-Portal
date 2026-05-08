import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  MessageCircle,
  Gift,
  UserCircle,
  Loader2,
  Inbox,
  X,
} from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { ChatWindow } from './ChatWindow';
import { SearchUsers } from './SearchUsers';
import { UserProfileModal } from './UserProfileModal';
import { FriendRequests } from './FriendRequests';

export const Friends: React.FC = () => {
  const { user } = useAuth();
  const { friends, loading } = useFriends(user?.uid);
  const [chatFriend, setChatFriend] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0d1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center ring-2 ring-yellow-400/30">
              <Loader2 className="w-7 h-7 text-yellow-400 animate-spin" />
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#0d0d1a] pb-28">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(234,179,8,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(249,115,22,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <FriendRequests />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/20">
                <Users className="w-5 h-5 text-black" />
              </span>
              Bạn Bè
            </h1>
            <p className="text-gray-500 text-sm mt-1 ml-[52px]">
              {friends.length > 0 ? `${friends.length} người bạn` : 'Chưa có bạn bè'}
            </p>
          </div>

          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-yellow-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Thêm Bạn
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Inbox className="w-9 h-9 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Chưa có bạn bè nào</p>
              <p className="text-gray-500 text-sm mt-1">Tìm kiếm và thêm bạn để bắt đầu trò chuyện</p>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Tìm bạn ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-5 transition-all duration-300 overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 0%, rgba(234,179,8,0.04) 0%, transparent 70%)',
                  }}
                />

                <div className="relative flex items-center gap-4 mb-5">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-yellow-400/30 transition-all duration-300">
                      <img
                        src={friend.avatar || '/assets/default_avatar.png'}
                        alt={friend.email}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/default_avatar.png';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-[#0d0d1a]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-base truncate group-hover:text-yellow-400 transition-colors duration-200">
                      {friend.email.split('@')[0]}
                    </p>
                    <p className="text-gray-500 text-xs truncate mt-0.5">{friend.email}</p>
                  </div>
                </div>

                <div className="relative grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setChatFriend(friend.uid)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-400/40 text-blue-400 transition-all duration-200 active:scale-95 group/btn"
                  >
                    <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold">Chat</span>
                  </button>
                  <button className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 hover:border-pink-400/40 text-pink-400 transition-all duration-200 active:scale-95 group/btn">
                    <Gift className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold">Quà</span>
                  </button>
                  <button
                    onClick={() => setShowProfile(friend.uid)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-400/40 text-yellow-400 transition-all duration-200 active:scale-95 group/btn"
                  >
                    <UserCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold">Hồ sơ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatFriend && user?.uid && (
        <ChatWindow
          userId={user.uid}
          friendId={chatFriend}
          onClose={() => setChatFriend(null)}
        />
      )}

      {showSearch && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <SearchUsers />
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-[#0f0f1e] border border-white/10 rounded-2xl p-5 w-full max-w-lg shadow-2xl">
            <button
              onClick={() => setShowProfile(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <UserProfileModal userId={showProfile} />
          </div>
        </div>
      )}
    </div>
  );
};