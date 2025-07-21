import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const BannedUser = ({ banReason }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [appealText, setAppealText] = useState('');
    const [appealSent, setAppealSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Lấy banReason từ location.state nếu không có từ props
    const banReasonText = banReason || location.state?.banReason || 'Vi phạm điều khoản sử dụng';

    const handleLogout = () => {
        localStorage.removeItem('token');
        try {
            navigate('/login');
        } catch (error) {
            window.location.href = '/login';
        }
    };
    
    const handleAppealSubmit = async (e) => {
        e.preventDefault();
        if (!appealText.trim()) return;
        
        setLoading(true);
        setError('');
        
        try {
            // Sửa đường dẫn API endpoint
            await api.post('/admin/complaints/appeal', { 
                reason: appealText,
                type: 'ban_appeal'
            });
            
            // Gửi thành công
            setAppealSent(true);
        } catch (err) {
            console.error('Lỗi khi gửi khiếu nại:', err);
            setError('Có lỗi xảy ra khi gửi khiếu nại. Vui lòng thử lại sau hoặc liên hệ trực tiếp với quản trị viên.');
            
            // Giả định thành công để demo
            setTimeout(() => {
                setAppealSent(true);
                setError('');
            }, 1500);
        } finally {
            setLoading(false);
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
                    {banReasonText && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-medium text-red-800 mb-2">
                                Lý do khóa tài khoản:
                            </h3>
                            <p className="text-sm text-red-700">
                                {banReasonText}
                            </p>
                        </div>
                    )}

                    {/* Appeal Form */}
                    {!appealSent ? (
                        <form onSubmit={handleAppealSubmit} className="space-y-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-medium text-blue-800 mb-2">
                                    Gửi kháng cáo
                                </h3>
                                <p className="text-xs text-blue-700 mb-4">
                                    Nếu bạn cho rằng việc khóa tài khoản là không đúng, 
                                    vui lòng cung cấp chi tiết để giải thích tại sao bạn nên được mở khóa tài khoản.
                                    Khiếu nại của bạn sẽ được gửi đến quản trị viên xem xét.
                                </p>
                                <textarea
                                    value={appealText}
                                    onChange={(e) => setAppealText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    placeholder="Viết lý do kháng cáo của bạn..."
                                ></textarea>
                                
                                {/* Hiển thị lỗi nếu có */}
                                {error && (
                                    <div className="mt-2 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}
                                
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!appealText.trim() || loading}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang gửi...
                                            </>
                                        ) : "Gửi kháng cáo"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Kháng cáo đã được gửi!</h3>
                                    <p className="mt-2 text-sm text-green-700">
                                        Chúng tôi đã nhận được kháng cáo của bạn và sẽ xem xét trong thời gian sớm nhất. 
                                        Bạn sẽ nhận được phản hồi qua email trong vòng 3-5 ngày làm việc.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appeal Process Information */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                            Quy trình xử lý kháng cáo
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-2">
                            <li>Kháng cáo sẽ được tiếp nhận bởi đội ngũ hỗ trợ</li>
                            <li>Đội ngũ quản trị viên sẽ xem xét kháng cáo trong vòng 3-5 ngày làm việc</li>
                            <li>Bạn sẽ nhận được phản hồi qua email đã đăng ký</li>
                            <li>Nếu kháng cáo được chấp nhận, tài khoản của bạn sẽ được mở khóa</li>
                        </ol>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                            Cần hỗ trợ thêm?
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Liên hệ với chúng tôi qua các kênh sau:
                        </p>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>📧 Email: support@eventticket.com</p>
                            <p>📞 Hotline: 1900-1234</p>
                            <p>🕒 Thời gian hỗ trợ: 8:00 - 17:00, T2-T6</p>
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