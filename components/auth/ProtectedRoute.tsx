/**
 * components/auth/ProtectedRoute.tsx
 *
 * Role-gated route guard for React Router v6.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>
 *   <ProtectedRoute allowedRoles={['admin', 'teacher']}><GradeEntry /></ProtectedRoute>
 *
 * The role is sourced from useAuth() which fetches it from the DB.
 * It is NEVER read from URL params, localStorage, or component props.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?:    UserRole[];
  redirectTo?:      string;
  loadingFallback?: React.ReactNode;
  useOutlet?:       boolean;
  children?:        React.ReactNode;
}

const DefaultLoadingSpinner: React.FC = () => (
  <div
    role="status"
    aria-label="Authentifizierung wird geprüft…"
    className="flex min-h-screen items-center justify-center bg-gray-50"
  >
    <div className="flex flex-col items-center gap-3">
      <svg
        className="h-10 w-10 animate-spin text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-gray-500">Anmeldung wird überprüft…</p>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = '/login',
  loadingFallback = <DefaultLoadingSpinner />,
  useOutlet = false,
  children,
}) => {
  const { isLoading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (isLoading) return <>{loadingFallback}</>;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to={getRoleHomePath(role)}
        state={{ unauthorised: true, from: location }}
        replace
      />
    );
  }

  return useOutlet ? <Outlet /> : <>{children}</>;
};

function getRoleHomePath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin:   '/admin',
    teacher: '/teacher',
    student: '/student',
    parent:  '/parent',
    hr:      '/hr',
  };
  return paths[role] ?? '/dashboard';
}

export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

export const TeacherRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'teacher']}>{children}</ProtectedRoute>
);

export const HrRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'hr']}>{children}</ProtectedRoute>
);
