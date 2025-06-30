import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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

    // Test function for debugging
    const testGoogleLogin = async () => {
        try {
            console.log('🧪 Testing Google login flow...');
            // This will fail but we can see the flow
            const result = await googleLogin('test-invalid-token');
            console.log('Test result:', result);
        } catch (error) {
            console.log('Test completed - expected error:', error.message);
        }
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-center">
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
            
            {/* Debug button - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div className="flex justify-center">
                    <button 
                        onClick={testGoogleLogin}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded"
                    >
                        Test Google Flow
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleLoginButton; 