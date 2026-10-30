import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from '../components/layout/RouteGuards';
import { Spinner } from '../components/ui/Spinner';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ChatPage = lazy(() => import('../pages/ChatPage').then(m => ({ default: m.ChatPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-app-bg">
    <Spinner size="lg" label="Loading page…" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/chat" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <Suspense fallback={<PageFallback />}><LoginPage /></Suspense>,
      },
      {
        path: '/register',
        element: <Suspense fallback={<PageFallback />}><RegisterPage /></Suspense>,
      },
      {
        path: '/reset-password',
        element: <Suspense fallback={<PageFallback />}><ResetPasswordPage /></Suspense>,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/chat',
        element: <Suspense fallback={<PageFallback />}><ChatPage /></Suspense>,
      },
      {
        path: '/profile',
        element: <Suspense fallback={<PageFallback />}><ProfilePage /></Suspense>,
      },
      {
        path: '/settings',
        element: <Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/chat" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
