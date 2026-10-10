import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AppRouterLayout } from '../layouts/AppRouterLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../core/guards/ProtectedRoute';
import { GuestRoute } from '../core/guards/GuestRoute';
import { AdminRoute } from '../core/guards/AdminRoute';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Skeleton } from '../shared/components/ui/Skeleton';

// Static imports for Auth (already shared via MainLayout)
import { Login } from '../features/auth/pages/Login';
import { Signup } from '../features/auth/pages/Signup';
import { ForgotPassword } from '../features/auth/pages/ForgotPassword';

// Lazy-loaded Pages for Production Code Splitting
const Landing = lazy(() => import('../features/landing/pages/Landing').then((m: any) => ({ default: m.Landing || m.default })));
const OAuthCallback = lazy(() => import('../features/auth/pages/OAuthCallback').then((m: any) => ({ default: m.OAuthCallback || m.default })));

const PracticePage = lazy(() => import('../features/problems/pages/PracticePage').then((m: any) => ({ default: m.PracticePage || m.default })));
const ProblemList = lazy(() => import('../features/problems/pages/ProblemList').then((m: any) => ({ default: m.ProblemList || m.default })));
const ProblemDetails = lazy(() => import('../features/problems/pages/ProblemDetails').then((m: any) => ({ default: m.ProblemDetails || m.default })));
const CompanyList = lazy(() => import('../features/companies/pages/CompanyList').then((m: any) => ({ default: m.CompanyList || m.default })));
const CompanyDetails = lazy(() => import('../features/companies/pages/CompanyDetails').then((m: any) => ({ default: m.CompanyDetails || m.default })));
const CompanyPatterns = lazy(() => import('../features/companies/pages/CompanyPatterns').then((m: any) => ({ default: m.CompanyPatterns || m.default })));
const CompanyPatternDetails = lazy(() => import('../features/companies/pages/CompanyPatternDetails').then((m: any) => ({ default: m.CompanyPatternDetails || m.default })));

const RoadmapList = lazy(() => import('../features/roadmaps/pages/RoadmapList').then((m: any) => ({ default: m.RoadmapList || m.default })));
const RoadmapDetails = lazy(() => import('../features/roadmaps/pages/RoadmapDetails').then((m: any) => ({ default: m.RoadmapDetails || m.default })));

const AptitudePrep = lazy(() => import('../features/aptitude/pages/AptitudePrep').then((m: any) => ({ default: m.AptitudePrep || m.default })));
const LogicalPrep = lazy(() => import('../features/logical/pages/LogicalPrep').then((m: any) => ({ default: m.LogicalPrep || m.default })));
const VerbalPrep = lazy(() => import('../features/verbal/pages/VerbalPrep').then((m: any) => ({ default: m.VerbalPrep || m.default })));
const InterviewPrep = lazy(() => import('../features/interviews/pages/InterviewPrep').then((m: any) => ({ default: m.InterviewPrep || m.default })));

const BookmarksList = lazy(() => import('../features/bookmarks/pages/BookmarksList').then((m: any) => ({ default: m.BookmarksList || m.default })));
const ProfileSettings = lazy(() => import('../features/profile/pages/ProfileSettings').then((m: any) => ({ default: m.ProfileSettings || m.default })));
const AppSettings = lazy(() => import('../features/settings/pages/AppSettings').then((m: any) => ({ default: m.AppSettings || m.default })));

// Admin Pages
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard').then((m: any) => ({ default: m.AdminDashboard || m.default })));
const AdminQuestions = lazy(() => import('../features/admin/pages/AdminQuestions').then((m: any) => ({ default: m.AdminQuestions || m.default })));
const AdminCompanies = lazy(() => import('../features/admin/pages/AdminCompanies').then((m: any) => ({ default: m.AdminCompanies || m.default })));
const AdminLanguages = lazy(() => import('../features/admin/pages/AdminLanguages').then((m: any) => ({ default: m.AdminLanguages || m.default })));

const NotFound = lazy(() => import('../shared/components/errors/NotFound').then((m: any) => ({ default: m.NotFound || m.default })));
const ServerError = lazy(() => import('../shared/components/errors/ServerError').then((m: any) => ({ default: m.ServerError || m.default })));
const ComingSoon = lazy<React.ComponentType<any>>(() => import('../shared/components/ComingSoon').then((m: any) => ({ default: m.ComingSoon || m.default })));

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

// Feature toggle to route to the native Coming Soon UI while preserving all existing implementations (F-020).
// Defaults to true preserving existing baseline; can be disabled via VITE_SHOW_COMING_SOON=false.
const SHOW_COMING_SOON = import.meta.env.VITE_SHOW_COMING_SOON !== 'false';

const renderFeature = (Component: React.LazyExoticComponent<React.FC>, featureName: string) => {
  if (SHOW_COMING_SOON) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ComingSoon featureName={featureName} />
      </Suspense>
    );
  }
  return withSuspense(Component);
};

const appRoutes = [
  {
    path: '/',
    element: withSuspense(Landing),
  },
  {
    path: '/oauth/callback',
    element: withSuspense(OAuthCallback),
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/signup', element: <Signup /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
        ],
      },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      // Practice & Companies Pages (Publicly accessible with in-app tracking for logged-in users)
      { path: '/dsa-sheet', element: withSuspense(ProblemList) },
      { path: '/practice', element: withSuspense(PracticePage) },
      { path: '/problems', element: <Navigate to="/practice" replace /> },
      { path: '/problems/:slug', element: withSuspense(ProblemDetails) },
      { path: '/companies', element: withSuspense(CompanyList) },
      { path: '/companies/:slug', element: withSuspense(CompanyDetails) },

      // Temporarily Hidden Feature Pages -> Reusable Coming Soon UI
      { path: '/roadmaps', element: renderFeature(RoadmapList, 'Roadmaps') },
      { path: '/roadmaps/:slug', element: renderFeature(RoadmapDetails, 'Roadmaps') },
      { path: '/company-patterns', element: renderFeature(CompanyPatterns, 'Company Exam Patterns') },
      { path: '/company-patterns/:slug', element: renderFeature(CompanyPatternDetails, 'Company Exam Patterns') },
      { path: '/aptitude', element: renderFeature(AptitudePrep, 'Aptitude') },
      { path: '/logical', element: renderFeature(LogicalPrep, 'Logical Reasoning') },
      { path: '/verbal', element: renderFeature(VerbalPrep, 'Verbal Ability') },
      { path: '/interviews', element: renderFeature(InterviewPrep, 'Interview Questions') },

      // Active User Features (Require Login)
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <Navigate to="/practice" replace /> },
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
          { path: 'languages', element: withSuspense(AdminLanguages) },
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
];

export const router = createBrowserRouter([
  {
    element: <AppRouterLayout />,
    children: appRoutes,
  },
]);
