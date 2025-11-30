import React, { useState, useEffect } from "react";
import { useUserData } from "../hooks/useUserData";
import { useAuth } from "../hooks/useAuth";
import { useFriends } from "../hooks/useFriends";
import { DEFAULT_AVATAR } from "../constants";
import { formatCurrency } from "../utils";

export const UserProfileModal: React.FC<{ userId: string }> = ({ userId }) => {
  const { userData, loading } = useUserData(userId);
  const { user } = useAuth();
  const { friends, sendFriendRequest, removeFriend } = useFriends(user?.uid);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isFriendState, setIsFriendState] = useState(false);

  useEffect(() => {
    setIsFriendState(friends.some(f => f.uid === userId));
  }, [friends, userId]);

  if (loading) return <div className="text-white">Đang tải...</div>;
  if (!userData) return <div className="text-white">Không tìm thấy user</div>;

  const isMe = user?.uid === userId;
  const isFriend = friends.some(f => f.uid === userId);

  const handleSendRequest = async () => {
    const res = await sendFriendRequest(userId);
    setRequestStatus(res.message);
    if (res.success) setIsRequestSent(true);
  };

  const handleRemoveFriend = async () => {
    await removeFriend(userId);
    setIsFriendState(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-2">
      <img
        src={userData.avatar || DEFAULT_AVATAR}
        alt={userData.email}
        className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg object-cover mb-2"
      />
      <div className="text-white text-lg font-bold">{userData.email}</div>
      <div className="text-yellow-300 font-semibold mb-1">
        💰 {formatCurrency(userData.money)}
      </div>
      {/* Nút kết bạn */}
      {!isMe && !isFriendState && !isRequestSent && (
        <button
          className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition"
          onClick={handleSendRequest}
        >
          + Gửi lời mời kết bạn
        </button>
      )}
      {!isMe && isRequestSent && !isFriendState && (
        <button
          className="bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-bold opacity-60 cursor-not-allowed"
          disabled
        >
          Đã gửi lời mời kết bạn
        </button>
      )}
      {!isMe && isFriendState && (
        <div className="relative">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold"
            onClick={handleRemoveFriend}
          >
            Bạn Bè
          </button>
          {/* Có thể thêm dropdown xác nhận hủy kết bạn nếu muốn */}
        </div>
      )}
      {requestStatus && (
        <div className="text-white text-sm mt-2">{requestStatus}</div>
      )}
    </div>
  );
};