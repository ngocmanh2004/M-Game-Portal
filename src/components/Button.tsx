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
  const baseStyle = "font-bold rounded-full shadow-lg transition-transform active:scale-95 border-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-tet-yellow text-tet-darkRed border-tet-gold hover:bg-yellow-300",
    secondary: "bg-tet-cream text-tet-darkRed border-tet-yellow hover:bg-white",
    danger: "bg-red-600 text-white border-red-400 hover:bg-red-500",
    outline: "bg-transparent text-white border-white hover:bg-white/10"
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
