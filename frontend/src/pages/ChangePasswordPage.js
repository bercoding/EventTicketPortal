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
            const response = await userProfileAPI.changePassword({ currentPassword: oldPassword, newPassword });
            setPasswordSuccess(response.message || 'Đổi mật khẩu thành công! Bạn có thể cần đăng nhập lại.');
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
        <div className="bg-gradient-to-br from-[#0a192f] to-[#101820] min-h-screen w-full flex items-center justify-center p-4">
            <div className="bg-[#101820] shadow-2xl rounded-2xl p-8 md:p-10 max-w-lg w-full border border-[#22304a]">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-center flex items-center justify-center gap-3">
                    <FaKey className="text-blue-400" /> Đổi Mật Khẩu
                </h1>
                {passwordError && <div className="mb-4 p-3 bg-red-900/80 text-red-200 border border-red-400 rounded-md text-sm">{passwordError}</div>}
                {passwordSuccess && <div className="mb-4 p-3 bg-green-900/80 text-green-200 border border-green-400 rounded-md text-sm">{passwordSuccess}</div>}
                <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu cũ</label>
                        <input 
                            type="password"
                            id="oldPassword"
                            name="oldPassword"
                            value={oldPassword}
                            onChange={(e) => { setOldPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-3 bg-[#181f2e] border border-[#22304a] rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 placeholder-gray-500"
                            placeholder="Nhập mật khẩu cũ của bạn"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu mới</label>
                        <input 
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-3 bg-[#181f2e] border border-[#22304a] rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 placeholder-gray-500"
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300 mb-1">Xác nhận mật khẩu mới</label>
                        <input 
                            type="password"
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                            required
                            className="w-full p-3 bg-[#181f2e] border border-[#22304a] rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 placeholder-gray-500"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-50 gap-2"
                    >
                        <FaSave /> {passwordLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                </form>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 w-full text-center text-blue-400 hover:text-blue-200 font-medium transition-colors"
                >
                    Quay lại Hồ sơ
                </button>
            </div>
        </div>
    );
};

export default ChangePasswordPage; 