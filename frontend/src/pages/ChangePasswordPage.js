import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileAPI } from '../services/api';
import { FaKey, FaSave } from 'react-icons/fa';

const ChangePasswordPage = () => {
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmNewPassword) {
            setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setPasswordLoading(true);
        try {
            const response = await userProfileAPI.changePassword({ oldPassword, newPassword, confirmNewPassword });
            setPasswordSuccess(response.data.message || 'Đổi mật khẩu thành công! Bạn có thể cần đăng nhập lại.');
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            // Cân nhắc: có thể tự động logout người dùng sau khi đổi mật khẩu thành công
            // authContext.logout(); 
            // navigate('/login');
        } catch (err) {
            setPasswordError(err.response?.data?.message || err.message || 'Lỗi khi đổi mật khẩu.');
        }
        setPasswordLoading(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-lg">
            <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
                    <FaKey className="mr-3 text-gray-500" /> Đổi Mật Khẩu
                </h1>
                
                {passwordError && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{passwordError}</div>}
                {passwordSuccess && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{passwordSuccess}</div>}
                
                <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="oldPassword"className="block text-sm font-medium text-gray-600 mb-1">Mật khẩu cũ</label>
                        <input 
                            type="password"
                            id="oldPassword"
                            name="oldPassword"
                            value={oldPassword}
                            onChange={(e) => { setOldPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="Nhập mật khẩu cũ của bạn"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword"className="block text-sm font-medium text-gray-600 mb-1">Mật khẩu mới</label>
                        <input 
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword"className="block text-sm font-medium text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password"
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                    >
                        <FaSave className="mr-2" /> {passwordLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                </form>
                <button 
                    onClick={() => navigate(-1)} // Quay lại trang trước đó (ProfilePage)
                    className="mt-4 w-full text-center text-blue-600 hover:text-blue-700"
                >
                    Quay lại Hồ sơ
                </button>
            </div>
        </div>
    );
};

export default ChangePasswordPage; 