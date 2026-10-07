import React, { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { DashboardMetricsGrid } from '../components/dashboard/DashboardMetricsGrid';
import { DashboardSystemInfo } from '../components/dashboard/DashboardSystemInfo';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { DashboardCodeRunner } from '../components/dashboard/DashboardCodeRunner';
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
        adminQuestionService.getQuestions({
          level: null,
          companies: null,
          topic: null,
          searchText: null,
          pageRequest: {
            pageNumber: 0,
            pageSize: 1000,
            sortBy: 'id',
            sortDirection: 'ASC',
          },
        }),
        adminCompanyService.getCompanies(),
      ]);

      let totalProblems = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;
      let totalCompanies = 0;

      if (probRes.status === 'fulfilled' && probRes.value) {
        const rawData = probRes.value?.data || probRes.value;
        const questionsList = Array.isArray(rawData?.content)
          ? rawData.content
          : (Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []));

        totalProblems = rawData?.totalElements !== undefined ? rawData.totalElements : questionsList.length;

        questionsList.forEach((q: any) => {
          const diffName = String(q.difficultyName || q.difficultyRefName || q.difficulty || q.level || '').toUpperCase();
          const diffId = q.difficultyId || q.levelId;

          if (diffId === 1 || diffName.includes('EASY') || diffName.includes('BASIC')) {
            easyCount++;
          } else if (diffId === 2 || diffName.includes('MEDIUM') || diffName.includes('MED')) {
            mediumCount++;
          } else if (diffId === 3 || diffName.includes('HARD')) {
            hardCount++;
          } else {
            mediumCount++;
          }
        });
      }

      if (compRes.status === 'fulfilled' && compRes.value) {
        const rawCompData = compRes.value?.data || compRes.value;
        const compList = Array.isArray(rawCompData?.content)
          ? rawCompData.content
          : (Array.isArray(rawCompData) ? rawCompData : (Array.isArray(rawCompData?.data) ? rawCompData.data : []));

        totalCompanies = rawCompData?.totalElements !== undefined ? rawCompData.totalElements : compList.length;
      }

      setStats({
        totalProblems,
        easyCount,
        mediumCount,
        hardCount,
        totalCompanies,
      });
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
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
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const el = document.getElementById('dashboard-code-runner');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-[#A3E635]/20 font-sans"
            >
              <i className="fa-solid fa-play text-xs text-black"></i>
              <span>Test &amp; Submit Code</span>
            </button>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-[#121316] hover:bg-[#1a1c22] text-gray-300 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              title="Refresh Data"
            >
              <i className={`fa-solid fa-rotate-right text-xs ${loading ? 'animate-spin text-[#A3E635]' : ''}`}></i>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 1. Operational Welcome & Role Overview */}
      <DashboardOverview />

      {/* 2. Real-Time Platform Metrics Grid */}
      <DashboardMetricsGrid stats={stats} loading={loading} />

      {/* 3. Interactive Problem Code Runner & Test Suite */}
      <div id="dashboard-code-runner">
        <DashboardCodeRunner />
      </div>

      {/* 4. System Configuration & Security Overview */}
      <DashboardSystemInfo />

      {/* 5. Admin Module Navigation Shortcuts */}
      <DashboardQuickActions />
    </div>
  );
};

export default AdminDashboard;
