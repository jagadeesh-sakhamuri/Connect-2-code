import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser, closeAuthModal, initializeAuth, silentRefreshSession } from '../features/auth/redux/authSlice';
import { tokenStorage } from '../core/security/tokenStorage';
import { NeetCodeNavbar } from '../shared/components/ui/NeetCodeNavbar';
import { Footer } from '../shared/components/ui/Footer';
import { Login } from '../features/auth/pages/Login';
import { toast } from 'react-hot-toast';

export const MainLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthModalOpen } = useAppSelector((state) => state.auth);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const showModal = isAuthModalOpen || isAuthRoute;

  // Sync auth state on mount and silently replenish tokens if refreshToken exists
  useEffect(() => {
    dispatch(initializeAuth());
    if (tokenStorage.getRefreshToken()) {
      dispatch(silentRefreshSession());
    }
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
  };

  const handleCloseModal = () => {
    dispatch(closeAuthModal());
    if (isAuthRoute) {
      navigate('/dsa-sheet');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#f4f4f4] flex flex-col font-sans relative m-0 p-0 overflow-x-hidden">
      {/* Top Navbar */}
      <NeetCodeNavbar user={user} onLogout={handleLogout} />

      {/* Main Content View (Full-width centered layout, no sidebar) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <Footer />

      {/* Global Floating GFG Auth Modal Overlay */}
      {showModal && (
        <Login onCloseModal={handleCloseModal} />
      )}
    </div>
  );
};
