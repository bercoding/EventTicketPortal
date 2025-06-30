import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const otp = location.state?.otp;

    useEffect(() => {
        if (!email || !otp) {
            toast.error('Thông tin không hợp lệ để đặt lại mật khẩu. Vui lòng thử lại từ đầu.');
            navigate('/forgot-password');
        }
    }, [email, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (!email || !otp) {
            toast.error('Thông tin email hoặc OTP bị thiếu.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPasswordWithOTP(email, otp, newPassword);
            toast.success('Mật khẩu của bạn đã được đặt lại thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
            navigate('/login');
        } catch (error) {
            const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
            toast.error(message);
            console.error('Reset Password error:', error.response?.data || error.message);
             // Có thể điều hướng người dùng về trang nhập OTP nếu OTP sai hoặc hết hạn ở bước này
            if (error.response?.data?.message.includes('OTP')) {
                navigate('/verify-otp', { state: { email } });
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đặt Lại Mật Khẩu</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Mật Khẩu Mới
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu mới"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Xác Nhận Mật Khẩu Mới
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Xác nhận mật khẩu mới"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !email || !otp}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition duration-150 ease-in-out"
                    >
                        {loading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword; 