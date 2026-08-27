import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../core/guards/ProtectedRoute';
import { GuestRoute } from '../core/guards/GuestRoute';
import { AdminRoute } from '../core/guards/AdminRoute';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Skeleton } from '../shared/components/ui/Skeleton';

// Lazy-loaded Pages for Production Code Splitting
const Landing = lazy(() => import('../features/landing/pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('../features/auth/pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('../features/auth/pages/Signup').then((m) => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('../features/auth/pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));

const PracticePage = lazy(() => import('../features/problems/pages/PracticePage').then((m) => ({ default: m.PracticePage })));
const ProblemList = lazy(() => import('../features/problems/pages/ProblemList').then((m) => ({ default: m.ProblemList })));
const ProblemDetails = lazy(() => import('../features/problems/pages/ProblemDetails').then((m) => ({ default: m.ProblemDetails })));
const CompanyList = lazy(() => import('../features/companies/pages/CompanyList').then((m) => ({ default: m.CompanyList })));
const CompanyDetails = lazy(() => import('../features/companies/pages/CompanyDetails').then((m) => ({ default: m.CompanyDetails })));
const CompanyPatterns = lazy(() => import('../features/companies/pages/CompanyPatterns').then((m) => ({ default: m.CompanyPatterns })));
const CompanyPatternDetails = lazy(() => import('../features/companies/pages/CompanyPatternDetails').then((m) => ({ default: m.CompanyPatternDetails })));

const RoadmapList = lazy(() => import('../features/roadmaps/pages/RoadmapList').then((m) => ({ default: m.RoadmapList })));
const RoadmapDetails = lazy(() => import('../features/roadmaps/pages/RoadmapDetails').then((m) => ({ default: m.RoadmapDetails })));

const AptitudePrep = lazy(() => import('../features/aptitude/pages/AptitudePrep').then((m) => ({ default: m.AptitudePrep })));
const LogicalPrep = lazy(() => import('../features/logical/pages/LogicalPrep').then((m) => ({ default: m.LogicalPrep })));
const VerbalPrep = lazy(() => import('../features/verbal/pages/VerbalPrep').then((m) => ({ default: m.VerbalPrep })));
const InterviewPrep = lazy(() => import('../features/interviews/pages/InterviewPrep').then((m) => ({ default: m.InterviewPrep })));

const BookmarksList = lazy(() => import('../features/bookmarks/pages/BookmarksList').then((m) => ({ default: m.BookmarksList })));
const ProfileSettings = lazy(() => import('../features/profile/pages/ProfileSettings').then((m) => ({ default: m.ProfileSettings })));
const AppSettings = lazy(() => import('../features/settings/pages/AppSettings').then((m) => ({ default: m.AppSettings })));

// Admin Pages
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminQuestions = lazy(() => import('../features/admin/pages/AdminQuestions').then((m) => ({ default: m.AdminQuestions })));
const AdminCompanies = lazy(() => import('../features/admin/pages/AdminCompanies').then((m) => ({ default: m.AdminCompanies })));

const NotFound = lazy(() => import('../shared/components/errors/NotFound').then((m) => ({ default: m.NotFound })));
const ServerError = lazy(() => import('../shared/components/errors/ServerError').then((m) => ({ default: m.ServerError })));

const PageLoader: React.FC = () => (
  <div className="p-8 flex flex-col gap-4 max-w-5xl mx-auto font-sans">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(Landing),
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: withSuspense(Login) },
          { path: '/signup', element: withSuspense(Signup) },
          { path: '/forgot-password', element: withSuspense(ForgotPassword) },
        ],
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      // ONLY DSA Sheet is accessible without login!
      { path: '/dsa-sheet', element: withSuspense(ProblemList) },

      // ALL other user features REQUIRE LOGIN (ProtectedRoute)
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <Navigate to="/practice" replace /> },
          { path: '/practice', element: withSuspense(PracticePage) },
          { path: '/problems', element: <Navigate to="/practice" replace /> },
          { path: '/roadmaps', element: withSuspense(RoadmapList) },
          { path: '/roadmaps/:slug', element: withSuspense(RoadmapDetails) },
          { path: '/problems/:slug', element: withSuspense(ProblemDetails) },
          { path: '/companies', element: withSuspense(CompanyList) },
          { path: '/companies/:slug', element: withSuspense(CompanyDetails) },
          { path: '/company-patterns', element: withSuspense(CompanyPatterns) },
          { path: '/company-patterns/:slug', element: withSuspense(CompanyPatternDetails) },
          { path: '/aptitude', element: withSuspense(AptitudePrep) },
          { path: '/logical', element: withSuspense(LogicalPrep) },
          { path: '/verbal', element: withSuspense(VerbalPrep) },
          { path: '/interviews', element: withSuspense(InterviewPrep) },
          { path: '/bookmarks', element: withSuspense(BookmarksList) },
          { path: '/profile', element: withSuspense(ProfileSettings) },
          { path: '/settings', element: withSuspense(AppSettings) },
        ],
      },
    ],
  },
  // ADMIN FRONTEND ROUTE BRANCH
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { path: '', element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(AdminDashboard) },
          { path: 'questions', element: withSuspense(AdminQuestions) },
          { path: 'companies', element: withSuspense(AdminCompanies) },
        ],
      },
    ],
  },
  {
    path: '/500',
    element: withSuspense(ServerError),
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  },
]);
