import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BannedUserGuard = ({ children }) => {
    const { isBanned, banReason } = useAuth();

    if (isBanned) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">
                                Tài khoản bị khóa
                            </h2>
                            <p className="text-gray-700 mb-4">
                                {banReason || 'Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng.'}
                            </p>
                            <p className="text-gray-500 text-sm">
                                Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default BannedUserGuard; 