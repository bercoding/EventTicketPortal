// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

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
            console.log('🔍 Checking user with token:', token ? token.substring(0, 15) + '...' : 'none');
            
            if (!token) {
                console.log('❌ No token found');
                setUser(null);
                setLoading(false);
                return;
            }

            // Kiểm tra token có hợp lệ không
            try {
                console.log('🔄 Calling getMe API to validate token...');
                const response = await authAPI.getMe();
                console.log('👤 User check response:', response);
                
                if (response.success && response.data) {
                    // Kiểm tra nếu tài khoản bị ban - vẫn đăng nhập được nhưng lưu thông tin về trạng thái ban
                    if (response.data.status === 'banned') {
                        console.log('🚫 User is banned, but allowing login with banned flag:', response.data.banReason);
                        setUser({
                            ...response.data,
                            isBanned: true, // Thêm trường isBanned để dễ kiểm tra
                            banReason: response.data.banReason || 'Vi phạm điều khoản sử dụng'
                        });
                    } else {
                        console.log('✅ Setting user:', response.data.email, response.data.id);
                        setUser(response.data);
                    }
                } else {
                    console.log('❌ Invalid user data in response, clearing token', response);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (error) {
                console.error('❌ Token validation failed:', error);
                // Vẫn xử lý lỗi khác bình thường
                if (error.response && error.response.status === 401) {
                    console.log('🔒 Token expired or invalid, clearing token');
                    localStorage.removeItem('token');
                    setUser(null);
                } else {
                    console.log('🔄 Network or server error, keeping token for retry');
                    // Giữ token nếu là lỗi mạng tạm thời
                }
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
            
            setError(null);
            const response = await authAPI.login({ email, password });
            
            console.log('📥 Login response:', response);
            
            if (response.success) {
                const { token, user: userData } = response;
                
                console.log('✅ Login successful for user:', userData.email, userData.id);
                console.log('🔑 Storing token and setting user');
                
                localStorage.setItem('token', token);
                await checkUser();
                
                // Verify the user was set correctly
                setTimeout(() => {
                    console.log('🔍 Verification - Current user state:', user?.email, user?.id);
                }, 100);
                
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
                // Lưu token và user sau khi xác thực OTP thành công
                const { token, user: userData } = response;
                
                console.log('✅ OTP verification successful for user:', userData.email);
                console.log('🔑 Storing token and setting user');
                
                localStorage.setItem('token', token);
                setUser(userData);
                
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
                const { token: authToken, user } = response;
                
                console.log('✅ Google login successful for user:', user.email, user.id);
                console.log('🔑 Storing token and setting user');
                
                localStorage.setItem('token', authToken);
                setUser(user);
                
                // Verify the user was set correctly
                setTimeout(() => {
                    console.log('🔍 Verification - Current user state:', user?.email, user?.id);
                }, 100);
                
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
        isBanned: user?.isBanned || false,
        banReason: user?.banReason || '',
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
    
    // Thêm thuộc tính isAuthenticated để kiểm tra cả token và user
    const isAuthenticated = !!context.user && !!localStorage.getItem('token');
    
    return {
        ...context,
        isAuthenticated
    };
};

export { AuthContext };