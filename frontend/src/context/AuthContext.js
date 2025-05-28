// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState('');

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    console.log('Checking auth with token:', token.substring(0, 20) + '...');
                    const res = await authAPI.getProfile();
                    console.log('Profile response:', res.data);
                    // Backend trả về { success: true, data: user }
                    setUser(res.data.data);
                    setIsAuthenticated(true);
                    setIsBanned(false);
                    setBanReason('');
                } catch (err) {
                    console.error('Auth check failed:', err);
                    
                    // Kiểm tra nếu user bị ban
                    if (err.response?.status === 403 && err.response?.data?.banned) {
                        setIsBanned(true);
                        setBanReason(err.response.data.banReason || 'Vi phạm điều khoản sử dụng');
                        setIsAuthenticated(false);
                        setUser(null);
                    } else {
                        localStorage.removeItem('token');
                        setUser(null);
                        setIsAuthenticated(false);
                        setIsBanned(false);
                        setBanReason('');
                    }
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    // Đăng ký
    /* // Comment out hàm register cũ vì quy trình đăng ký mới được xử lý trong Register.js
    const register = async (formData) => {
        try {
            console.log('Attempting register with:', formData);
            const res = await authAPI.register(formData);
            console.log('Register response:', res.data);
            
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            setIsAuthenticated(true);
            setError(null);
            setIsBanned(false);
            setBanReason('');
            return { success: true, ...res.data };
        } catch (err) {
            console.error('Register error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
    */

    // Đăng nhập
    const login = async (formDataOrToken, userDataIfToken) => { // Sửa đổi để chấp nhận token và user
        try {
            let token, user;
            if (typeof formDataOrToken === 'string') { // Trường hợp đăng nhập sau khi đăng ký thành công
                token = formDataOrToken;
                user = userDataIfToken;
                console.log('Logging in with token after registration:', { token: token.substring(0,10)+'... ', user });
            } else { // Trường hợp đăng nhập bình thường
                console.log('Attempting login with:', { ...formDataOrToken, password: '***' });
                const res = await authAPI.login(formDataOrToken);
                console.log('Login response:', res.data);
                token = res.data.token;
                user = res.data.user;
            }
            
            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            setError(null);
            setIsBanned(false);
            setBanReason('');
            return { success: true, token, user };
        } catch (err) {
            console.error('Login error:', err);
            
            // Kiểm tra nếu user bị ban
            if (err.response?.status === 403 && err.response?.data?.banned) {
                setIsBanned(true);
                setBanReason(err.response.data.banReason || 'Vi phạm điều khoản sử dụng');
                setIsAuthenticated(false);
                setUser(null);
                return { 
                    success: false, 
                    banned: true, 
                    banReason: err.response.data.banReason || 'Vi phạm điều khoản sử dụng'
                };
            }
            
            const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Google Login
    const googleLogin = async (credential) => {
        try {
            console.log('Attempting Google login with credential');
            const res = await authAPI.googleAuth(credential);
            console.log('Google login response:', res.data);
            
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            setIsAuthenticated(true);
            setError(null);
            setIsBanned(false);
            setBanReason('');
            return { success: true, ...res.data };
        } catch (err) {
            console.error('Google login error:', err);
            
            // Kiểm tra nếu user bị ban
            if (err.response?.status === 403 && err.response?.data?.banned) {
                setIsBanned(true);
                setBanReason(err.response.data.banReason || 'Vi phạm điều khoản sử dụng');
                setIsAuthenticated(false);
                setUser(null);
                return { 
                    success: false, 
                    banned: true, 
                    banReason: err.response.data.banReason || 'Vi phạm điều khoản sử dụng'
                };
            }
            
            const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập Google thất bại';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Đăng xuất
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setIsBanned(false);
        setBanReason('');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isAuthenticated,
                loading,
                error,
                isBanned,
                banReason,
                // register, // Xóa hoặc comment out
                login,
                googleLogin,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};