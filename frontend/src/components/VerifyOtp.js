import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email; // Lấy email từ state

    useEffect(() => {
        if (!email) {
            toast.error('Không tìm thấy thông tin email. Vui lòng thử lại từ bước quên mật khẩu.');
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Email không hợp lệ.');
            return;
        }
        setLoading(true);
        try {
            await authAPI.verifyOtp({ email, otp });
            toast.success('Xác thực OTP thành công! Bây giờ bạn có thể đặt lại mật khẩu.');
            navigate('/reset-password', { state: { email, otp } }); // Truyền email và otp sang trang ResetPassword
        } catch (error) {
            const message = error.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại OTP hoặc thử lại.';
            toast.error(message);
            console.error('Verify OTP error:', error.response?.data || error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Xác Thực OTP</h2>
                <p className="text-sm text-gray-600 mb-4 text-center">
                    Một mã OTP đã được gửi đến <strong>{email || 'email của bạn'}</strong>. Vui lòng nhập mã đó vào bên dưới.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                            Mã OTP
                        </label>
                        <input
                            type="text"
                            id="otp"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength={6}
                            placeholder="_ _ _ _ _ _"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition duration-150 ease-in-out"
                    >
                        {loading ? 'Đang xác thực...' : 'Xác Thực OTP'}
                    </button>
                </form>
                 <p className="mt-4 text-center text-sm">
                    <button 
                        onClick={() => navigate('/forgot-password')} 
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Gửi lại OTP?
                    </button>
                </p>
            </div>
        </div>
    );
}

export default VerifyOtp; 