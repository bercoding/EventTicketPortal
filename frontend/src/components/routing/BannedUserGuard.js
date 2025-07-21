import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BannedUserGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Kiểm tra nếu người dùng bị ban
    if (user && user.status === 'banned') {
        console.log('🚫 BannedUserGuard: User is banned, redirecting to /banned');
        return (
            <Navigate 
                to="/banned" 
                state={{ 
                    from: location,
                    banReason: user.banReason || 'Vi phạm điều khoản sử dụng'
                }}
                replace
            />
        );
    }

    return children;
};

export default BannedUserGuard; 