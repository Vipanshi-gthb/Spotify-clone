import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roleRequired }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spotify-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roleRequired && user?.role !== roleRequired) {
    return (
      <div className="page-restricted-container">
        <h2>Access Restricted</h2>
        <p>This action requires the <strong>{roleRequired}</strong> role.</p>
      </div>
    );
  }

  return children;
}
