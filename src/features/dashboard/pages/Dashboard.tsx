import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchDashboardOverview } from '../redux/dashboardSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { Badge } from '../../../shared/components/ui/Badge';

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: dashboard, loading } = useAppSelector((state) => state.dashboard);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
  }, [dispatch]);

  if (loading || !dashboard) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" count={4} />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="p-6 bg-[#202225] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
            Welcome back, {user?.fullName || 'Developer'}! 👋
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl font-sans">
            You've solved <span className="text-[#A3E635] font-semibold font-mono">{dashboard.totalSolved} problems</span> across DSA and company question sets. Keep up the momentum!
          </p>
        </div>
        <Link to="/problems" className="btn-neetcode-primary text-xs">
          <span>Resume Practice</span>
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#202225] border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Solved</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white font-mono">{dashboard.totalSolved}</span>
              <span className="text-xs text-gray-500 font-mono">/ {dashboard.totalProblems}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635]">
            <i className="fa-solid fa-circle-check text-lg"></i>
          </div>
        </div>

        <div className="p-5 bg-[#202225] border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Active Streak</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-amber-400 font-mono">{dashboard.streakDays}</span>
              <span className="text-xs text-gray-400">Days</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <i className="fa-solid fa-fire text-lg"></i>
          </div>
        </div>

        <div className="p-5 bg-[#202225] border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Global Rank</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#A3E635] font-mono">#{dashboard.globalRank}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635]">
            <i className="fa-solid fa-trophy text-lg"></i>
          </div>
        </div>

        <div className="p-5 bg-[#202225] border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Completion</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#A3E635] font-mono">{dashboard.completionPercentage}%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#A3E635]">
            <i className="fa-solid fa-bullseye text-lg"></i>
          </div>
        </div>
      </div>

      {/* Breakdown & Target Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Breakdown Card */}
        <div className="p-6 bg-[#202225] border border-white/10 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-4 font-mono">Difficulty Breakdown</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#A3E635]">Easy</span>
                  <span className="text-gray-400">{dashboard.easySolved} Solved</span>
                </div>
                <div className="w-full h-2 bg-[#121113] rounded-full overflow-hidden">
                  <div className="h-full bg-[#A3E635]" style={{ width: `${(dashboard.easySolved / 50) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#f5a623]">Medium</span>
                  <span className="text-gray-400">{dashboard.mediumSolved} Solved</span>
                </div>
                <div className="w-full h-2 bg-[#121113] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f5a623]" style={{ width: `${(dashboard.mediumSolved / 70) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#f87171]">Hard</span>
                  <span className="text-gray-400">{dashboard.hardSolved} Solved</span>
                </div>
                <div className="w-full h-2 bg-[#121113] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f87171]" style={{ width: `${(dashboard.hardSolved / 30) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-400 font-mono">
            <span>Progress Goal</span>
            <span className="font-bold text-white">{dashboard.completionPercentage}%</span>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/problems"
            className="p-6 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-[#A3E635]/40 rounded-2xl transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] flex items-center justify-center mb-4 text-base">
                <i className="fa-solid fa-code"></i>
              </div>
              <h4 className="text-base font-bold text-gray-100 group-hover:text-[#A3E635] transition-colors font-heading">
                DSA Problem Roadmap
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Filter by Arrays, Sliding Window, Trees, and DP.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#A3E635] font-semibold font-mono">
              <span>Open Roadmap</span>
              <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </div>
          </Link>

          <Link
            to="/companies"
            className="p-6 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-[#A3E635]/40 rounded-2xl transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] flex items-center justify-center mb-4 text-base">
                <i className="fa-solid fa-building"></i>
              </div>
              <h4 className="text-base font-bold text-gray-100 group-hover:text-[#A3E635] transition-colors font-heading">
                Company Hiring Guides
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Google, Amazon, Meta & Microsoft targeted questions.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#A3E635] font-semibold font-mono">
              <span>Explore Companies</span>
              <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Feed Table */}
      <div className="p-6 bg-[#202225] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-[#A3E635]"></i>
            <h3 className="text-sm font-semibold text-gray-100 font-mono">Recent Activity</h3>
          </div>
          <Link to="/problems" className="text-xs text-[#A3E635] hover:underline font-mono">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-mono">
                <th className="pb-3 font-medium">Problem</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Language</th>
                <th className="pb-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashboard.recentActivities.map((act) => (
                <tr key={act.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-gray-200">
                    <Link to={`/problems/${act.problemId}`} className="hover:text-[#A3E635]">
                      {act.problemTitle}
                    </Link>
                  </td>
                  <td className="py-3">
                    <Badge variant={act.status === 'Solved' ? 'success' : 'warning'}>
                      {act.status}
                    </Badge>
                  </td>
                  <td className="py-3 font-mono text-gray-400">{act.language}</td>
                  <td className="py-3 text-gray-500">{act.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
