import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { DashboardMetricsGrid } from '../components/dashboard/DashboardMetricsGrid';
import { DashboardSystemInfo } from '../components/dashboard/DashboardSystemInfo';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { adminQuestionService } from '../../../services/admin/adminQuestionService';
import { adminCompanyService } from '../../../services/admin/adminCompanyService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<{
    totalProblems: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    totalCompanies: number;
  }>({
    totalProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    totalCompanies: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [probRes, compRes] = await Promise.allSettled([
        adminQuestionService.getQuestions({ pageRequest: { pageNumber: 0, pageSize: 100 } }),
        adminCompanyService.getCompanies(),
      ]);

      let totalProblems = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;
      let totalCompanies = 0;

      if (probRes.status === 'fulfilled' && probRes.value) {
        const questionsList = probRes.value.content || (Array.isArray(probRes.value) ? probRes.value : []);
        if (Array.isArray(questionsList)) {
          totalProblems = probRes.value.totalElements || questionsList.length;
          questionsList.forEach((q: any) => {
            const diff = String(q.difficultyRefName || q.difficultyName || q.difficultyRefCode || q.difficulty || '').toUpperCase();
            if (diff.includes('EASY') || diff.includes('BASIC')) easyCount++;
            else if (diff.includes('MEDIUM')) mediumCount++;
            else if (diff.includes('HARD')) hardCount++;
          });
        }
      }

      if (compRes.status === 'fulfilled' && compRes.value) {
        const compList = compRes.value.data || (Array.isArray(compRes.value) ? compRes.value : []);
        if (Array.isArray(compList)) {
          totalCompanies = compList.length;
        }
      }

      setStats({
        totalProblems,
        easyCount,
        mediumCount,
        hardCount,
        totalCompanies,
      });
    } catch {
      setStats({
        totalProblems: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        totalCompanies: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 font-sans text-left pb-12">
      {/* Top Page Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview of questions, companies, and platform activity"
        actions={
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-[#121316] hover:bg-[#1a1c22] text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            title="Refresh Data"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${loading ? 'animate-spin text-[#14B8A6]' : ''}`}></i>
            <span>Refresh</span>
          </button>
        }
      />

      {/* 1. Operational Welcome & Role Overview */}
      <DashboardOverview />

      {/* 2. Real-Time Platform Metrics Grid */}
      <DashboardMetricsGrid stats={stats} loading={loading} />

      {/* 3. System Configuration & Security Overview */}
      <DashboardSystemInfo />

      {/* 4. Admin Module Navigation Shortcuts */}
      <DashboardQuickActions />
    </div>
  );
};
