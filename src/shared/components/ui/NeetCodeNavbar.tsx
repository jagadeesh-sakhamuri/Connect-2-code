import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logoutUser, openAuthModal } from '../../../features/auth/redux/authSlice';
import { useTheme } from '../../context/ThemeContext';

export interface NeetCodeNavbarProps {
  user?: any;
  onLogout?: () => void;
}

export const NeetCodeNavbar: React.FC<NeetCodeNavbarProps> = ({
  user,
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user: reduxUser } = useAppSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const isLoggedIn = user !== undefined ? user !== null : (isAuthenticated && reduxUser !== null);
  const currentUser = user || reduxUser || {
    fullName: 'Alex Developer',
    email: 'alex.dev@Connect 2 Code.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logoutUser());
    }
  };

  const navItems = [
    { to: '/practice', label: 'Practice', icon: 'fa-solid fa-code' },
    { to: '/aptitude', label: 'Aptitude', icon: 'fa-solid fa-brain' },
    { to: '/companies', label: 'Companies', icon: 'fa-solid fa-building' },
    { to: '/roadmaps', label: 'Roadmaps', icon: 'fa-solid fa-map' },
    { to: '/dsa-sheet', label: 'DSA Sheet', icon: 'fa-solid fa-file-code' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121316]/95 border-b border-white/10 shadow-lg backdrop-blur-md font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          
          {/* BRAND LOGO */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 sm:gap-2.5 group transition-opacity hover:opacity-90 shrink-0"
          >
            <img
              src="/logo-mark-transparent.png"
              alt="Connect 2 Code Logo"
              className="h-7 sm:h-9 w-auto object-contain shrink-0"
            />
            <span className="text-sm sm:text-lg font-bold text-white font-sans tracking-tight">
              Connect <span className="text-[#A3E635]">2</span> Code
            </span>
          </Link>

          {/* DESKTOP NAVIGATION LINKS (Visible on lg and larger) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs sm:text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border border-white/20 shadow-xs'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <i className={`${item.icon} text-xs`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* RIGHT SIDE: AUTH / PROFILE + MOBILE MENU TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-all focus:outline-none cursor-pointer group"
                  aria-label="User menu"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                      alt={currentUser.fullName || 'User Profile'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-[#A3E635] group-hover:border-[#84CC16] transition-colors shadow-md shadow-[#A3E635]/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#A3E635] rounded-full ring-2 ring-[#090A0C]"></span>
                  </div>
                  <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180 text-[#A3E635]' : ''}`}></i>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-52 bg-[#121316] border border-white/15 rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.7)] backdrop-blur-md z-50 animate-fade-in flex flex-col p-2 gap-1 font-sans">
                    <div className="px-2.5 py-2 bg-[#090A0C] border border-white/10 rounded-lg flex items-center gap-2.5">
                      <img
                        src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
                        alt={currentUser?.fullName || 'User'}
                        className="w-7 h-7 rounded-full object-cover border border-[#A3E635] shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate font-heading">
                          {currentUser?.fullName || 'Alex Developer'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">
                          {currentUser?.email || 'alex.dev@Connect 2 Code.io'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 pt-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-sans"
                      >
                        <i className="fa-regular fa-user text-xs text-[#A3E635] w-4 text-center"></i>
                        <span>Profile Settings</span>
                      </Link>

                      <Link
                        to="/bookmarks"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-sans"
                      >
                        <i className="fa-regular fa-bookmark text-xs text-amber-400 w-4 text-center"></i>
                        <span>My Bookmarks</span>
                      </Link>

                      <div className="my-1 border-t border-white/10"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors font-sans w-full text-left cursor-pointer"
                      >
                        <i className="fa-solid fa-right-from-bracket text-xs text-rose-400 w-4 text-center"></i>
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => dispatch(openAuthModal({ mode: 'signup' }))}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#A3E635] hover:bg-[#84CC16] px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-black shadow-sm transition-all active:translate-y-0.5 cursor-pointer font-sans shrink-0"
              >
                <i className="fa-solid fa-user-plus text-xs text-black"></i>
                <span>Sign up</span>
              </button>
            )}

            {/* THEME TOGGLE BUTTON - Placed to the RIGHT of Profile/Signup */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-[#090A0C] border border-white/15 hover:border-[#A3E635]/50 text-gray-300 hover:text-white transition-all focus:outline-none cursor-pointer shrink-0 shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-400'} text-xs`}></i>
              <span className="text-xs font-bold text-gray-300">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* HAMBURGER TOGGLE BUTTON FOR MOBILE (< lg screens) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg bg-[#090A0C] border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-all focus:outline-none cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm w-4 text-center`}></i>
            </button>
          </div>

        </div>
      </div>

      {/* SLEEK MOBILE NAVIGATION PANEL (Visible when mobile menu is toggled) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 light:border-gray-200 bg-[#090A0C]/98 light:bg-white/98 backdrop-blur-xl px-4 py-3 shadow-2xl animate-fade-in font-sans">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#A3E635] text-black shadow-sm'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <i className={`${item.icon} text-sm w-5 text-center`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
