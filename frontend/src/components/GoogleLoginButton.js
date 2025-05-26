import React, { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
    const { googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            console.log('Google login success:', credentialResponse);
            
            const result = await googleLogin(credentialResponse.credential);
            
            if (result.success) {
                // Check user role and redirect accordingly
                if (result.user && result.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else if (result.banned) {
                // Handle banned user
                console.log('User is banned:', result.banReason);
            } else {
                console.error('Google login failed:', result.error);
            }
        } catch (error) {
            console.error('Google login error:', error);
        }
    };

    const handleGoogleError = () => {
        console.log('Google login failed');
    };

    return (
        <div className="w-full">
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
            </div>

            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                locale="vi"
                shape="rectangular"
                logo_alignment="left"
            />
        </div>
    );
};

export default GoogleLoginButton; 