import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../app/providers/AuthContext';
import { Spinner } from '../components/ui/Spinner';

/** Redirects unauthenticated users to /login. Shows a spinner while auth initializes. */
export function ProtectedRoute() {
  const { user, initialized } = useAuthContext();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <Spinner size="lg" label="Loading CloudTalk…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Redirects already-authenticated users away from auth pages. */
export function GuestRoute() {
  const { user, initialized } = useAuthContext();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <Spinner size="lg" label="Loading CloudTalk…" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
