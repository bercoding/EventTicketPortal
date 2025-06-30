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
            console.log('🔍 Checking user with token:', token ? 'exists' : 'none');
            
            if (token) {
                const response = await authAPI.getMe();
                console.log('👤 User check response:', response);
                
                if (response.success) {
                    console.log('✅ Setting user:', response.data.email, response.data.id);
                    setUser(response.data);
                } else {
                    console.log('❌ User check failed, clearing token');
                    localStorage.removeItem('token');
                    setUser(null);
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
            
            // Clear any existing auth data first
            clearAuthData();
            
            setError(null);
            const response = await authAPI.login({ email, password });
            
            console.log('📥 Login response:', response);
            
            if (response.success) {
                const { token, user: userData } = response;
                
                console.log('✅ Login successful for user:', userData.email, userData.id);
                console.log('🔑 Storing token and setting user');
                
                localStorage.setItem('token', token);
                setUser(userData);
                
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
            const response = await authAPI.register(userData);
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setUser(user);
                return { success: true };
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Đăng ký thất bại');
            return { success: false, error: error.response?.data?.message };
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
        login,
        register,
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