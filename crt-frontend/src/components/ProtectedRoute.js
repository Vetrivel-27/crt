import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboards = {
            student: '/student/dashboard',
            worker: '/worker/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={dashboards[user.role] || '/'} replace />;
    }

    return children;
};

export default ProtectedRoute;
