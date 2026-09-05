import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'success' | 'warning' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    easy: 'badge-easy font-mono font-semibold',
    medium: 'badge-medium font-mono font-semibold',
    hard: 'badge-hard font-mono font-semibold',
    success: 'bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/20',
    warning: 'bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    neutral: 'bg-white/5 text-gray-400 border border-white/10',
    primary: 'bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
