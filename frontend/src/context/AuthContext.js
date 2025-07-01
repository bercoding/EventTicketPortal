// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { userProfileAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('🔍 Checking user with token:', token ? 'exists' : 'none');
            
            if (!token) {
                console.log('❌ No token found');
                setUser(null);
                setLoading(false);
                return;
            }

            // Kiểm tra token có hợp lệ không
            try {
                const response = await authAPI.getMe();
                console.log('👤 User check response:', response);
                
                if (response.success && response.data) {
                    let userData = response.data;
                    // Gọi thêm API lấy profile để lấy đủ thông tin
                    try {
                        const profile = await userProfileAPI.getCurrentUserProfile();
                        // Merge profile vào userData (ưu tiên các trường của profile)
                        userData = { ...userData, ...profile };
                        console.log('✅ User data merged with profile:', userData);
                    } catch (profileErr) {
                        console.warn('⚠️ Không lấy được profile chi tiết:', profileErr);
                    }
                    setUser(userData);
                } else {
                    console.log('❌ Invalid user data, clearing token');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (error) {
                console.error('❌ Token validation failed:', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('❌ Error checking user:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Force refresh user data from server (for role updates)
    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                console.log('🔄 Force refreshing user data from server...');
                const response = await authAPI.getMe();
                
                if (response.success) {
                    console.log('✅ User data refreshed:', response.data.email, 'Role:', response.data.role);
                    setUser(response.data);
                    return { success: true, user: response.data };
                } else {
                    console.log('❌ Refresh failed, clearing token');
                    localStorage.removeItem('token');
                    setUser(null);
                    return { success: false, error: 'Refresh failed' };
                }
            } else {
                return { success: false, error: 'No token found' };
            }
        } catch (error) {
            console.error('❌ Error refreshing user:', error);
            return { success: false, error: error.message };
        }
    };

    const clearAuthData = () => {
        console.log('🧹 Clearing all auth data');
        localStorage.removeItem('token');
        sessionStorage.clear();
        setUser(null);
        setError(null);
    };

    const login = async (email, password) => {
        try {
            console.log('🚀 Starting login for:', email);
            
            // Clear any existing auth data first
            clearAuthData();
            
            setError(null);
            const response = await authAPI.login({ email, password });
            
            console.log('📥 Login response:', response);
            
            if (response.success) {
                const { token } = response;
                localStorage.setItem('token', token);
                // Gọi lại checkUser để lấy đủ thông tin user
                await checkUser();
                return { success: true };
            } else {
                console.log('❌ Login failed:', response.message);
                setError(response.message || 'Đăng nhập thất bại');
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
            setError(errorMessage);
            clearAuthData(); // Clear on error
            return { success: false, error: errorMessage };
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            console.log('Starting registration with data:', userData.email);
            const response = await authAPI.register(userData);
            console.log('Registration response:', response);
            
            if (response.success) {
                // Không set user và token ở bước đăng ký
                // Token và user sẽ được set sau khi xác minh OTP
                return { 
                    success: true, 
                    message: response.message || 'Đăng ký thành công. Vui lòng xác thực OTP.'
                };
            } else {
                setError(response.error || 'Đăng ký thất bại');
                return { 
                    success: false, 
                    error: response.error || 'Đăng ký thất bại'
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Thêm hàm xác thực OTP
    const verifyOTP = async (otpData) => {
        try {
            setError(null);
            console.log('Starting OTP verification for:', otpData.email);
            const response = await authAPI.verifyOTP(otpData);
            console.log('OTP verification response:', response);
            
            if (response.success) {
                const { token } = response;
                localStorage.setItem('token', token);
                // Gọi lại checkUser để lấy đủ thông tin user
                await checkUser();
                return { 
                    success: true, 
                    message: response.message || 'Xác thực OTP thành công.'
                };
            } else {
                setError(response.error || 'Xác thực OTP thất bại');
                return { 
                    success: false, 
                    error: response.error || 'Xác thực OTP thất bại'
                };
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            const errorMessage = error.message || 'Xác thực OTP thất bại';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        console.log('👋 Logging out user:', user?.email);
        clearAuthData();
    };

    const googleLogin = async (token) => {
        try {
            console.log('🚀 Starting Google login...');
            
            // Clear any existing auth data first
            clearAuthData();
            
            setError(null);
            const response = await authAPI.googleLogin(token);
            console.log('📥 Google login response:', response);
            
            if (response.success) {
                const { token: authToken } = response;
                localStorage.setItem('token', authToken);
                // Gọi lại checkUser để lấy đủ thông tin user
                await checkUser();
                return { success: true };
            } else {
                console.log('❌ Google login failed:', response.message);
                setError(response.message || 'Đăng nhập bằng Google thất bại');
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('❌ Google login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập bằng Google thất bại';
            setError(errorMessage);
            clearAuthData(); // Clear on error
            return { success: false, error: errorMessage };
        }
    };

    const forgotPassword = async (email) => {
        try {
            setError(null);
            const response = await authAPI.forgotPassword(email);
            return { success: true, message: response.data.message };
        } catch (error) {
            setError(error.response?.data?.message || 'Gửi email thất bại');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const resetPassword = async (token, password) => {
        try {
            setError(null);
            const response = await authAPI.resetPassword(token, password);
            return { success: true, message: response.data.message };
        } catch (error) {
            setError(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
            return { success: false, error: error.response?.data?.message };
        }
    };

    const value = {
        user,
        setUser,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        verifyOTP,
        logout,
        googleLogin,
        forgotPassword,
        resetPassword,
        checkUser,
        clearAuthData,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { AuthContext };