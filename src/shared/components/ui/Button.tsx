import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#A3E635]/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-[0.98]';

  const variantStyles = {
    primary: 'bg-[#A3E635] hover:bg-[#84CC16] text-black font-bold shadow-md shadow-[#A3E635]/20 border border-[#A3E635]/30',
    secondary: 'bg-[#202225] hover:bg-[#2f3136] text-gray-200 border border-white/10',
    outline: 'border border-white/10 hover:border-white/20 text-gray-300 hover:bg-[#202225]',
    ghost: 'text-gray-400 hover:text-white hover:bg-[#202225]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20',
    success: 'bg-[#A3E635] hover:bg-[#3ec487] text-white shadow-md shadow-[#A3E635]/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <i className="fa-solid fa-circle-notch fa-spin text-current text-sm"></i>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
