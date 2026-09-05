import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050607] text-[#98A2B3] border-t border-[#1C1F26] font-sans relative overflow-hidden">
      {/* Top subtle glow line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#A3E635]/50 to-transparent"></div>

      <div className="mx-auto max-w-7xl px-6 pt-12 pb-8 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#1C1F26]">
          
          {/* Column 1: Brand & Tagline */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2.5 w-fit group">
              <img
                src="/logo-mark-transparent.png"
                alt="Connect 2 Code Logo"
                className="h-9 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="hero-font text-[20px] font-extrabold text-white leading-none">Connect 2 Code</span>
                <span className="text-[9.5px] font-black uppercase tracking-[.2em] text-[#A3E635] mt-0.5">
                  YOUR CAREER STARTS HERE
                </span>
              </div>
            </Link>

            <p className="text-[13.5px] text-[#98A2B3] leading-relaxed max-w-sm font-normal mt-1">
              Empowering engineering students across India to crack campus placement drives with topic-wise lessons, DSA sheets, and company-pattern mocks.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl bg-[#121316] border border-[#22252C] flex items-center justify-center text-[#98A2B3] hover:text-white hover:border-[#A3E635] hover:bg-[#A3E635]/10 transition-all cursor-pointer"
              >
                <i className="fa-brands fa-github text-sm"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-[#121316] border border-[#22252C] flex items-center justify-center text-[#98A2B3] hover:text-white hover:border-[#A3E635] hover:bg-[#A3E635]/10 transition-all cursor-pointer"
              >
                <i className="fa-brands fa-linkedin-in text-sm"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-xl bg-[#121316] border border-[#22252C] flex items-center justify-center text-[#98A2B3] hover:text-white hover:border-[#A3E635] hover:bg-[#A3E635]/10 transition-all cursor-pointer"
              >
                <i className="fa-brands fa-x-twitter text-sm"></i>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="w-9 h-9 rounded-xl bg-[#121316] border border-[#22252C] flex items-center justify-center text-[#98A2B3] hover:text-white hover:border-[#A3E635] hover:bg-[#A3E635]/10 transition-all cursor-pointer"
              >
                <i className="fa-brands fa-discord text-sm"></i>
              </a>
            </div>
          </div>

          {/* Column 2: Placement Prep */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-black uppercase tracking-[.14em] text-white font-heading">
              Placement Prep
            </h3>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link to="/practice" className="hover:text-white transition-colors">
                  Practice Problems
                </Link>
              </li>
              <li>
                <Link to="/aptitude" className="hover:text-white transition-colors">
                  Aptitude Preparation
                </Link>
              </li>
              <li>
                <Link to="/logical" className="hover:text-white transition-colors">
                  Logical Reasoning
                </Link>
              </li>
              <li>
                <Link to="/verbal" className="hover:text-white transition-colors">
                  Verbal Ability
                </Link>
              </li>
              <li>
                <Link to="/dsa-sheet" className="hover:text-white transition-colors">
                  DSA Striver Sheet
                </Link>
              </li>
              <li>
                <Link to="/roadmaps" className="hover:text-white transition-colors">
                  Tech Roadmaps
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company Patterns */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-black uppercase tracking-[.14em] text-white font-heading">
              Exam Patterns
            </h3>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              <li>
                <Link to="/company-patterns" className="text-[#A3E635] font-bold hover:underline transition-colors flex items-center gap-1.5">
                  <span>Explore All Patterns</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-white transition-colors">
                  Company Guides &amp; PYQs
                </Link>
              </li>
              <li>
                <Link to="/company-patterns" className="hover:text-white transition-colors">
                  TCS NQT Pattern
                </Link>
              </li>
              <li>
                <Link to="/company-patterns" className="hover:text-white transition-colors">
                  Infosys Specialist Drive
                </Link>
              </li>
              <li>
                <Link to="/company-patterns" className="hover:text-white transition-colors">
                  Accenture ASE Pattern
                </Link>
              </li>
              <li>
                <Link to="/company-patterns" className="hover:text-white transition-colors">
                  Cognizant &amp; Wipro Mocks
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Readiness & Status */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-black uppercase tracking-[.14em] text-white font-heading">
              Placement Status
            </h3>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/25 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse"></span>
              <span className="text-[11.5px] font-bold text-[#A3E635]">Drive Season 2026 Active</span>
            </div>

            <p className="text-[12.5px] text-[#98A2B3] leading-relaxed">
              Find your topic gaps first with structured practice before appearing for real company tests.
            </p>

            <Link
              to="/practice"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] px-4 py-2.5 text-[13px] font-black text-black shadow-[0_4px_16px_rgba(163,230,53,0.35)] transition active:translate-y-0.5 cursor-pointer"
            >
              <span>Explore Practice Sheet</span>
              <svg aria-hidden="true" className="lucide lucide-arrow-right" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#667085]">
          <p className="font-mono text-center sm:text-left">
            © {new Date().getFullYear()} Connect 2 Code — Campus Placement Preparation. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[#98A2B3]">
            <Link to="/company-patterns" className="hover:text-white transition-colors">
              Exam Patterns
            </Link>
            <Link to="/practice" className="hover:text-white transition-colors">
              Practice
            </Link>
            <Link to="/dsa-sheet" className="hover:text-white transition-colors">
              DSA Sheet
            </Link>
            <Link to="/companies" className="hover:text-white transition-colors">
              Companies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
