import React from 'react';

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-[#121316] border border-white/10 rounded-2xl my-4 font-sans">
      <div className="p-4 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-full text-[#14B8A6] mb-4">
        {icon || <i className="fa-solid fa-inbox text-2xl"></i>}
      </div>
      <h4 className="text-lg font-bold text-white font-heading tracking-tight mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
