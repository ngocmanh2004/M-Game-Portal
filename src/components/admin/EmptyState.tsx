import React from 'react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'Không tìm thấy người dùng nào' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-8xl mb-4 animate-bounce">😢</div>
      <h3 className="text-white font-bold text-xl mb-2">Trống rỗng!</h3>
      <p className="text-white/70 text-center">{message}</p>
    </div>
  );
};