
import React, { useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DEFAULT_AVATAR } from '../../constants';

interface AvatarUploadProps {
    userId: string;
    currentAvatar: string | undefined;
    isMe: boolean;
    sizeClass?: string;
    borderClass?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    userId,
    currentAvatar,
    isMe,
    sizeClass = "w-24 h-24 sm:w-32 sm:h-32",
    borderClass = "border-4 border-[#1a0f0a]"
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const displayUrl = previewUrl || currentAvatar || DEFAULT_AVATAR;

    const handleClick = () => {
        if (!isMe || uploading) return;
        fileInputRef.current?.click();
    };

    const validateFile = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Chỉ chấp nhận file JPG, PNG hoặc WEBP.');
            return false;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Kích thước file tối đa là 2MB.');
            return false;
        }
        return true;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccess(null);
        if (!validateFile(file)) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);
        setSuccess(null);

        try {
            // Cấu hình Cloudinary
            const cloudName = "dsslwpckb"; // Cloud name của bạn 
            const uploadPreset = "mgame_avatar"; // Tên preset bạn cài đặt trên web (vui lòng sửa lại nếu bạn đặt tên khác)

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            // Fetch API trực tiếp đến Cloudinary REST API (Không bị CORS)
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progressValue = (event.loaded / event.total) * 100;
                    setProgress(Math.round(progressValue));
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const downloadURL = response.secure_url; // Link ảnh xịn từ Cloudinary

                        // Lưu link mới vào Firebase
                        const userRef = doc(db, 'users', userId);
                        await updateDoc(userRef, { avatarURL: downloadURL, avatar: downloadURL });

                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';

                        setSuccess("Cập nhật ảnh đại diện thành công!");
                        setTimeout(() => setSuccess(null), 3000);
                    } catch (firestoreErr: any) {
                        console.error("Lỗi cập nhật Firestore:", firestoreErr);
                        setError("Lỗi cập nhật CSDL: " + firestoreErr.message);
                    } finally {
                        setUploading(false);
                        setProgress(100);
                    }
                } else {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.error("Lỗi từ Cloudinary:", errorResponse);
                    setError(
                        errorResponse.error?.message?.includes("preset")
                            ? `Lỗi: Bạn chưa tạo Upload Preset tên "${uploadPreset}" trong mục Setting -> Upload, hoặc chưa để chế độ Unsigned.`
                            : "Lỗi tải ảnh lên Cloudinary: " + (errorResponse.error?.message || "Không rõ")
                    );
                    setUploading(false);
                    setProgress(0);
                }
            };

            xhr.onerror = () => {
                console.error("Lỗi Network Cloudinary");
                setError("Lỗi kết nối mạng khi tải lên ảnh.");
                setUploading(false);
                setProgress(0);
            };

            // Gửi dữ liệu
            xhr.send(formData);

        } catch (err: any) {
            console.error("Lỗi khởi tạo upload:", err);
            setError("Lỗi hệ thống khi khởi tạo tải lên: " + err.message);
            setUploading(false);
        }
    };

    const handleCancel = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setError(null);
    };

    return (
        <div className="flex flex-col items-center">
            <div
                className={`relative ${sizeClass} group ${isMe ? 'cursor-pointer' : ''}`}
                onClick={handleClick}
            >
                <div className={`w-full h-full rounded-full ${borderClass} overflow-hidden bg-[#1a0f0a] shadow-2xl relative transition-transform hover:scale-[1.02] duration-300`}>
                    <img
                        src={displayUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    />

                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-4 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                            <span className="text-[10px] sm:text-xs text-white font-bold">{progress}%</span>
                        </div>
                    )}
                </div>

                {isMe && !uploading && !previewUrl && (
                    <button
                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-7 h-7 sm:w-9 sm:h-9 bg-slate-800 text-white rounded-full flex items-center justify-center border-2 border-[#1a0f0a] shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all z-30 group-hover:bg-slate-700"
                        title="Thay đổi Avatar"
                    >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                />
            </div>

            {error && (
                <div className="absolute top-full mt-4 bg-red-500/90 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-lg z-50 whitespace-nowrap">
                    {error}
                </div>
            )}

            {success && (
                <div className="absolute top-full mt-4 bg-green-500/90 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-lg z-50 whitespace-nowrap">
                    {success}
                </div>
            )}

            {previewUrl && !uploading && (
                <div className="absolute top-full mt-4 flex gap-2 z-50">
                    <button
                        onClick={handleUpload}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg shadow-lg font-bold transition-transform active:scale-95"
                    >
                        Lưu
                    </button>
                    <button
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-1.5 rounded-lg shadow-lg font-bold transition-transform active:scale-95"
                    >
                        Hủy
                    </button>
                </div>
            )}
        </div>
    );
};
