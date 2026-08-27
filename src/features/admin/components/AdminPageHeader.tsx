import React from 'react';
import { AdminBreadcrumb } from './AdminBreadcrumb';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-2.5 pb-2 font-sans text-left">
      <AdminBreadcrumb />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
