// ===== ProtectedRoute.js =====
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Checking authentication...</p>
    </div>
  </div>
);

// Main route protection component
const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  fallback = null,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading, user, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading during verification
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check admin permissions if required
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Unauthorized Access
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have the necessary permissions to access this page.
              Only administrators can access this section.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show protected content
  return children;
};

// Component for admin-only routes
export const AdminRoute = ({ children, fallback = null }) => {
  return (
    <ProtectedRoute requireAdmin={true} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
};

// ✅ Component for client-only routes - CORRECTED with admin redirection
export const ClientRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ✅ If admin, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // ✅ If client, show content
  if (user?.role === 'client') {
    return children;
  }

  // ✅ Other cases: show error message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Client Access Only
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            This section is reserved for platform clients.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Component for public routes with smart redirection
export const PublicRoute = ({ children, redirectTo }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // ✅ Smart redirection based on role
    const defaultRedirect = isAdmin ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return children;
};

// Custom hook to check permissions
export const usePermissions = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  
  return {
    canAccess: (requiredRole = null) => {
      if (!isAuthenticated) return false;
      if (!requiredRole) return true;
      
      if (requiredRole === 'admin') return isAdmin;
      if (requiredRole === 'client') return user?.role === 'client';
      
      return false;
    },
    
    canModify: (resourceUserId) => {
      if (!isAuthenticated) return false;
      if (isAdmin) return true;
      return user?._id === resourceUserId;
    },
    
    hasRole: (role) => {
      return user?.role === role;
    }
  };
};

// Wrapper component for conditional routes
export const ConditionalRoute = ({ 
  children, 
  condition, 
  fallback = null, 
  redirectTo = null 
}) => {
  const { loading } = useAuth();

  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  if (!condition) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have access to this resource.</p>
        </div>
      </div>
    );
  }

  return children;
};

// HOC (Higher Order Component) to protect components
export const withAuth = (Component, options = {}) => {
  const { requireAdmin = false, requireClient = false } = options;
  
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute requireAdmin={requireAdmin}>
        {requireClient ? (
          <ClientRoute>
            <Component {...props} />
          </ClientRoute>
        ) : (
          <Component {...props} />
        )}
      </ProtectedRoute>
    );
  };
};

// Hook to manage role-based redirections
export const useRoleBasedRedirect = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    
    if (isAdmin) return '/admin/dashboard';
    return '/dashboard';
  };

  const redirectToRole = () => {
    if (loading) return;
    
    const defaultRoute = getDefaultRoute();
    const currentPath = location.pathname;
    
    // Avoid redirect loops
    if (currentPath !== defaultRoute) {
      window.location.href = defaultRoute;
    }
  };

  return { getDefaultRoute, redirectToRole };
};

export default ProtectedRoute;