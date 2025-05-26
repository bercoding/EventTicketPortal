import React from 'react';
import { useNavigate } from 'react-router-dom';

const BannedUser = ({ banReason }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        try {
            navigate('/login');
        } catch (error) {
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Tài khoản đã bị khóa
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng.
                        </p>
                    </div>

                    {/* Ban Reason */}
                    {banReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-medium text-red-800 mb-2">
                                Lý do khóa tài khoản:
                            </h3>
                            <p className="text-sm text-red-700">
                                {banReason}
                            </p>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                            Cần hỗ trợ?
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Nếu bạn cho rằng đây là một sai lầm, vui lòng liên hệ với chúng tôi:
                        </p>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>📧 Email: support@eventticket.com</p>
                            <p>📞 Hotline: 1900-1234</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Đăng xuất
                        </button>
                        
                        <button
                            onClick={() => window.location.href = 'mailto:support@eventticket.com'}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Liên hệ hỗ trợ
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            © 2024 Event Ticket Portal. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannedUser;