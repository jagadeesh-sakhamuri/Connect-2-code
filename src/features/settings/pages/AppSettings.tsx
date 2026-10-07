import React from 'react';
import { BASE_URL } from '../../../core/api/apiClient';

export const AppSettings: React.FC = () => {
  const apiBase = BASE_URL;

  return (
    <div className="flex flex-col gap-6 max-w-3xl font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-heading">
          Platform & API Integration Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Inspect your architecture status, API transportation layer, and backend readiness.
        </p>
      </div>

      <div className="p-6 bg-[#202225] border border-white/10 rounded-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] rounded-xl text-base">
              <i className="fa-solid fa-server"></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100 font-heading">Data Source Mode</h3>
              <p className="text-xs text-gray-400">
                Connected to Java Spring Boot REST APIs
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 rounded-full">
            Live Spring Boot REST API
          </span>
        </div>

        <div className="flex flex-col gap-3 text-xs font-mono">
          <div className="flex justify-between items-center p-3 bg-[#121113] border border-white/10 rounded-xl">
            <span className="text-gray-400">Backend Base URL</span>
            <span className="text-gray-200">{apiBase}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-[#121113] border border-white/10 rounded-xl">
            <span className="text-gray-400">Auth Token Strategy</span>
            <span className="text-[#A3E635]">JWT Bearer Cookie & Header</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-[#121113] border border-white/10 rounded-xl">
            <span className="text-gray-400">Protocol</span>
            <span className="text-[#A3E635]">REST JSON</span>
          </div>
        </div>

        <div className="p-4 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-xl text-xs text-gray-300 flex items-start gap-3">
          <i className="fa-solid fa-shield-halved text-[#A3E635] text-base shrink-0 mt-0.5"></i>
          <div>
            <span className="font-bold text-white block mb-0.5 font-heading">Live API Connection Active</span>
            All data requests are communicated directly with the live Java Spring Boot backend server.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
