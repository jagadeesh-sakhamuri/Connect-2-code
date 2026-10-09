import React from 'react';
import { AdminCard } from '../AdminCard';
import { AdminBadge } from '../AdminBadge';
import { useAppSelector } from '../../../../app/hooks';

export const DashboardOverview: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <AdminCard className="bg-gradient-to-r from-[#121316] via-[#161920] to-[#121316] border-[#A3E635]/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/30 text-[#A3E635] flex items-center justify-center text-xl font-bold font-heading shrink-0 shadow-md">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
                Welcome back, {user?.firstName || 'Administrator'}
              </h2>
              <AdminBadge variant="primary">ROLE: {user?.role || 'ADMIN'}</AdminBadge>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Manage questions, target companies, and platform activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Backend Architecture
            </span>
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              REST API Client
            </span>
          </div>
        </div>
      </div>
    </AdminCard>
  );
};
