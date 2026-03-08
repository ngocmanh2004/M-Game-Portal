import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = "font-bold rounded-full shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border border-yellow-200 hover:brightness-110 shadow-[0_4px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_4px_25px_rgba(251,191,36,0.5)]",
    secondary: "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400 hover:brightness-110 shadow-[0_4px_15px_rgba(239,68,68,0.4)]",
    outline: "bg-transparent text-white border-2 border-white/50 hover:bg-white/10"
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-xl"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
