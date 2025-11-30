import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useUserData } from '../hooks/useUserData';

interface ChatWindowProps {
  userId: string;
  friendId: string;
  onClose: () => void;
}

const EMOJIS = ['😀', '😂', '😍', '🥳', '😢', '👍', '🎁', '❤️', '🔥', '👏'];

export const ChatWindow: React.FC<ChatWindowProps> = ({ userId, friendId, onClose }) => {
  const { messages, sendMessage, loading } = useChat(userId, friendId);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const { userData: me } = useUserData(userId);
  const { userData: friend } = useUserData(friendId);

  // Helper lấy avatar/email
  const getUserInfo = (uid: string) => {
    if (uid === userId) return { avatar: me?.avatar, email: me?.email };
    return { avatar: friend?.avatar, email: friend?.email };
  };

  // Tặng quà (ví dụ: gửi tin nhắn đặc biệt)
  const handleSendGift = () => {
    sendMessage('🎁 Bạn vừa được tặng một món quà!', userId);
  };

  // Hiển thị ngày cho tin nhắn đầu tiên mỗi ngày
  let lastDate = '';
  const renderMessages = () => {
    return messages.map((msg, idx) => {
      const info = getUserInfo(msg.senderId);
      const isMe = msg.senderId === userId;
      const dateObj = msg.createdAt
        ? new Date(typeof msg.createdAt === 'number' ? msg.createdAt : msg.createdAt.seconds * 1000)
        : null;
      const dateStr = dateObj ? dateObj.toLocaleDateString('vi-VN') : '';
      let showDate = false;
      if (dateStr && dateStr !== lastDate) {
        showDate = true;
        lastDate = dateStr;
      }
      return (
        <React.Fragment key={msg.id}>
          {showDate && (
            <div className="text-center text-xs text-gray-500 my-2 font-semibold">
              {dateStr}
            </div>
          )}
          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
              <img
                src={info.avatar}
                alt="avatar"
                className="w-9 h-9 rounded-full border-2 border-yellow-300 object-cover"
              />
              <div>
                <div className={`text-xs font-bold ${isMe ? 'text-yellow-700 text-right' : 'text-blue-700 text-left'}`}>
                  {info.email}
                </div>
                <div className={`rounded-2xl px-4 py-2 shadow ${isMe ? 'bg-yellow-200 text-right' : 'bg-white text-left'}`}>
                  {msg.text}
                </div>
                <div className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {dateObj
                    ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative border-4 border-yellow-400 animate-fade-in">
        <button className="absolute top-3 right-3 text-red-500 text-2xl font-bold hover:scale-125 transition" onClick={onClose}>✖</button>
        <div className="flex items-center gap-3 mb-4">
          <img src={friend?.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-yellow-400 object-cover" />
          <div>
            <div className="font-bold text-yellow-700">{friend?.email}</div>
            <div className="text-xs text-gray-500">Đang trò chuyện</div>
          </div>
        </div>
        <div className="h-[420px] overflow-y-auto mb-4 bg-yellow-50 rounded-lg p-4 flex flex-col gap-3 scrollbar-hide">
          {loading ? (
            <div className="text-center text-gray-500">Đang tải...</div>
          ) : (
            renderMessages()
          )}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (text.trim()) {
              sendMessage(text, userId);
              setText('');
            }
          }}
        >
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="bg-yellow-200 hover:bg-yellow-300 text-yellow-700 rounded-lg px-3 py-2 font-bold shadow"
              onClick={() => setShowEmoji(v => !v)}
              title="Gửi icon"
            >😊</button>
            {showEmoji && (
              <div className="absolute bottom-20 left-10 bg-white border rounded-xl shadow-lg p-2 flex flex-wrap gap-2 z-50">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    className="text-2xl hover:scale-125 transition"
                    onClick={() => {
                      setText(text + e);
                      setShowEmoji(false);
                    }}
                  >{e}</button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="bg-pink-200 hover:bg-pink-300 text-pink-700 rounded-lg px-3 py-2 font-bold shadow"
              onClick={handleSendGift}
              title="Tặng quà"
            >🎁</button>
            <input
              className="flex-1 border-2 border-yellow-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Nhắn gì đó..."
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow" type="submit">Gửi</button>
          </div>
        </form>
      </div>
    </div>
  );
};