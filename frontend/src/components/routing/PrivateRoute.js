// frontend/src/components/routing/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Hiển thị loading khi đang kiểm tra authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    if (!isAuthenticated) {
        console.log('🔒 Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Kiểm tra quyền truy cập
    if (roles.length > 0 && !roles.includes(user?.role)) {
        console.log('🚫 User does not have required role:', user?.role, 'Required:', roles);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;