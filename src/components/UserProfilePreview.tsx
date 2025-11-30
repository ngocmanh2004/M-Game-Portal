import React from "react";
import { useUserData } from "../hooks/useUserData";
import { DEFAULT_AVATAR } from "../constants";

export const UserProfilePreview: React.FC<{ userId: string, onViewProfile: () => void }> = ({ userId, onViewProfile }) => {
  const { userData, loading } = useUserData(userId);
  if (loading) return <div className="text-white">Đang tải...</div>;
  if (!userData) return <div className="text-white">Không tìm thấy user</div>;
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={userData.avatar || DEFAULT_AVATAR} alt={userData.email} className="w-16 h-16 rounded-full border-2 border-yellow-400 shadow" />
      <div className="text-white font-bold">{userData.email}</div>
      <button
        className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition mt-2"
        onClick={onViewProfile}
      >
        Xem hồ sơ
      </button>
    </div>
  );
};