import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser, closeAuthModal } from '../features/auth/redux/authSlice';
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
  const isProblemWorkspace = location.pathname.startsWith('/problems/');
  const showModal = isAuthModalOpen || isAuthRoute;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
  };

  // Preserve user navigation context on modal close (F-019)
  const handleCloseModal = () => {
    dispatch(closeAuthModal());
    if (isAuthRoute) {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/practice');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#f4f4f4] flex flex-col font-sans relative m-0 p-0 overflow-x-hidden">
      {/* Top Navbar */}
      <NeetCodeNavbar user={user} onLogout={handleLogout} />

      {/* Main Content View (Full-width centered layout, no sidebar) */}
      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 mx-auto w-full ${
          isProblemWorkspace ? 'max-w-[1750px] px-2 sm:px-4' : 'max-w-6xl'
        }`}
      >
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
