import React, { useState, useEffect } from 'react';
import { NotificationType } from '../../types';
import { SHOP_ITEMS } from '../../constants';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface NotificationFormProps {
  adminUserId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface UserOption {
  uid: string;
  email: string;
}

export const NotificationForm: React.FC<NotificationFormProps> = ({
  adminUserId,
  onSuccess,
  onCancel
}) => {
  const { sendNotification, loading } = useAdminNotifications();

  // ⭐ Danh sách user để chọn
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    // Lấy danh sách user (email + uid)
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(
        snap.docs.map(doc => ({
          uid: doc.id,
          email: doc.data().email || doc.id
        }))
      );
    };
    fetchUsers();
  }, []);

  const [formData, setFormData] = useState({
    type: NotificationType.SYSTEM,
    title: '',
    message: '',
    imageUrl: '',
    targetType: 'all' as 'all' | 'specific',
    giftMoney: 0,
    giftItems: [] as { itemId: string; quantity: number }[],
    expiresInDays: 7
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    // ⭐ Map email → UID
    let targetUserIds: string[] | undefined = undefined;
    if (formData.targetType === 'specific') {
      if (selectedEmails.length === 0) {
        alert('Vui lòng chọn ít nhất 1 user!');
        return;
      }
      targetUserIds = allUsers
        .filter(u => selectedEmails.includes(u.email))
        .map(u => u.uid);
      if (targetUserIds.length === 0) {
        alert('Không tìm thấy user phù hợp!');
        return;
      }
    }

    const expiresAt = formData.expiresInDays > 0
      ? Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    const notificationData: any = {
      type: formData.type,
      title: formData.title,
      message: formData.message,
      targetType: formData.targetType,
    };

    if (formData.imageUrl.trim()) notificationData.imageUrl = formData.imageUrl;
    if (formData.giftMoney > 0) notificationData.giftMoney = formData.giftMoney;
    if (formData.giftItems.length > 0) notificationData.giftItems = formData.giftItems;
    if (targetUserIds && targetUserIds.length > 0) notificationData.targetUserIds = targetUserIds;
    if (expiresAt) notificationData.expiresAt = expiresAt;

    const success = await sendNotification(adminUserId, notificationData);

    if (success) {
      alert('✅ Đã gửi thông báo thành công!');
      onSuccess();
    } else {
      alert('❌ Có lỗi xảy ra!');
    }
  };

  const addGiftItem = () => {
    setFormData(prev => ({
      ...prev,
      giftItems: [...prev.giftItems, { itemId: SHOP_ITEMS[0].id, quantity: 1 }]
    }));
  };

  const removeGiftItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      giftItems: prev.giftItems.filter((_, i) => i !== index)
    }));
  };

  const updateGiftItem = (index: number, field: 'itemId' | 'quantity', value: any) => {
    setFormData(prev => ({
      ...prev,
      giftItems: prev.giftItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // ⭐ Tìm kiếm user theo email
  const [search, setSearch] = useState('');
  const filteredUsers = allUsers.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-yellow-400">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-orange-500 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-red-900">📢 Gửi Thông Báo</h2>
          <button onClick={onCancel} className="text-2xl text-red-900 hover:scale-110 transition-transform">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          
          {/* Loại thông báo - ⭐ FIX SELECT */}
          <div>
            <label className="text-white font-bold mb-2 block">Loại thông báo:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
              className="w-full bg-purple-800 text-white rounded-lg p-3 border border-white/20 focus:border-yellow-400 focus:outline-none"
              style={{ color: 'white' }}
            >
              <option value={NotificationType.SYSTEM} className="bg-purple-800">🔔 Hệ thống</option>
              <option value={NotificationType.EVENT} className="bg-purple-800">🎊 Sự kiện</option>
              <option value={NotificationType.GIFT} className="bg-purple-800">🎁 Quà tặng</option>
              <option value={NotificationType.WARNING} className="bg-purple-800">⚠️ Cảnh báo</option>
              <option value={NotificationType.UPDATE} className="bg-purple-800">🔄 Cập nhật</option>
            </select>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="text-white font-bold mb-2 block">Tiêu đề:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Chúc mừng năm mới 2025!"
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg p-3 border border-white/20 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className="text-white font-bold mb-2 block">Nội dung:</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Nhập nội dung thông báo..."
              rows={4}
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg p-3 border border-white/20 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Ảnh (optional) */}
          <div>
            <label className="text-white font-bold mb-2 block">URL Ảnh (optional):</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://... (để trống nếu không cần)"
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg p-3 border border-white/20 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Target */}
          <div>
            <label className="text-white font-bold mb-2 block">Gửi đến:</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  checked={formData.targetType === 'all'}
                  onChange={() => setFormData({ ...formData, targetType: 'all' })}
                  className="w-4 h-4"
                />
                Tất cả user
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  checked={formData.targetType === 'specific'}
                  onChange={() => setFormData({ ...formData, targetType: 'specific' })}
                  className="w-4 h-4"
                />
                User cụ thể
              </label>
            </div>
            {formData.targetType === 'specific' && (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm email user..."
                  className="w-full bg-white/10 text-white rounded-lg p-3 border border-white/20 placeholder-white/50 focus:border-yellow-400 focus:outline-none mb-2"
                />
                <div className="max-h-40 overflow-y-auto bg-white/10 rounded-lg border border-white/10 mb-2">
                  {filteredUsers.map(u => (
                    <label key={u.uid} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-yellow-100/10">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(u.email)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedEmails(prev => [...prev, u.email]);
                          } else {
                            setSelectedEmails(prev => prev.filter(email => email !== u.email));
                          }
                        }}
                      />
                      <span className="text-white">{u.email}</span>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-white/50 px-3 py-2">Không tìm thấy user</div>
                  )}
                </div>
                {selectedEmails.length > 0 && (
                  <div className="text-xs text-yellow-300 mb-2">
                    Đã chọn: {selectedEmails.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tiền thưởng */}
          <div>
            <label className="text-white font-bold mb-2 block">💰 Tiền thưởng (optional):</label>
            <input
              type="number"
              value={formData.giftMoney}
              onChange={(e) => setFormData({ ...formData, giftMoney: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-white/10 text-white rounded-lg p-3 border border-white/20 placeholder-white/50 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Vật phẩm - ⭐ FIX SELECT */}
          <div>
            <label className="text-white font-bold mb-2 block">🎁 Vật phẩm tặng kèm:</label>
            <button
              onClick={addGiftItem}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold mb-2 hover:bg-green-600 active:scale-95 transition-all"
            >
              + Thêm vật phẩm
            </button>

            {formData.giftItems.map((giftItem, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  value={giftItem.itemId}
                  onChange={(e) => updateGiftItem(index, 'itemId', e.target.value)}
                  className="flex-1 bg-purple-800 text-white rounded-lg p-2 border border-white/20 focus:border-yellow-400 focus:outline-none"
                  style={{ color: 'white' }}
                >
                  {SHOP_ITEMS.map(item => (
                    <option key={item.id} value={item.id} className="bg-purple-800">
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={giftItem.quantity}
                  onChange={(e) => updateGiftItem(index, 'quantity', Number(e.target.value))}
                  className="w-20 bg-white/10 text-white rounded-lg p-2 border border-white/20 focus:border-yellow-400 focus:outline-none"
                  min={1}
                />
                <button
                  onClick={() => removeGiftItem(index)}
                  className="bg-red-500 text-white px-3 rounded-lg hover:bg-red-600 active:scale-95 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Hết hạn */}
          <div>
            <label className="text-white font-bold mb-2 block">Hết hạn sau (ngày):</label>
            <input
              type="number"
              value={formData.expiresInDays}
              onChange={(e) => setFormData({ ...formData, expiresInDays: Number(e.target.value) })}
              className="w-full bg-white/10 text-white rounded-lg p-3 border border-white/20 focus:border-yellow-400 focus:outline-none"
              min={0}
            />
            <p className="text-white/50 text-xs mt-1">0 = không hết hạn</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : '📤 Gửi ngay'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-lg hover:scale-105 active:scale-95 transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};