import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

const GoogleLoginButton = () => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            console.log('🔑 Google OAuth Success, credential received');
            const result = await googleLogin(credentialResponse.credential);
            if (!result.success) {
                console.error('Google login failed:', result.error);
                alert('Đăng nhập bằng Google thất bại: ' + result.error);
            } else {
                console.log('✅ Google login successful, redirecting...');
                // Navigate to return URL or home page
                const returnUrl = location.state?.returnUrl || location.state?.from?.pathname || '/';
                navigate(returnUrl);
            }
        } catch (error) {
            console.error('Google login error:', error);
            alert('Lỗi đăng nhập Google: ' + error.message);
        }
    };

    const handleGoogleError = () => {
        console.error('Google OAuth Error');
        alert('Không thể kết nối với Google. Vui lòng thử lại.');
    };

    // Xử lý sự kiện khi người dùng nhấn nút tùy chỉnh
    const handleCustomButtonClick = (e) => {
        e.preventDefault(); // Ngăn chặn hành vi mặc định của form
        
        // Tìm và kích hoạt nút Google OAuth thực tế
        document.querySelector('.google-login-container button')?.click();
    };

    return (
        <div className="w-full space-y-2">
            <div className="hidden google-login-container">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    text="continue_with"
                    shape="rectangular"
                    width="384"
                    size="large"
                    type="standard"
                    logo_alignment="left"
                    locale="vi"
                />
            </div>
            
            {/* Sử dụng nút tùy chỉnh để kích hoạt Google Login */}
            <button
                type="button" // Thiết lập type là button để tránh submit form
                onClick={handleCustomButtonClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b4cb8] transition-all duration-200"
            >
                <FcGoogle className="w-5 h-5" />
                <span>Tiếp tục bằng tên Google</span>
            </button>
        </div>
    );
};

export default GoogleLoginButton; 