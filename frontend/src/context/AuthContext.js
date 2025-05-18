// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const checkLoggedIn = async () => {
            if (localStorage.getItem('token')) {
                setAuthToken(localStorage.getItem('token'));
                try {
                    const res = await axios.get('/api/auth/me');
                    setUser(res.data.data);
                    setIsAuthenticated(true);
                } catch (err) {
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    // Thiết lập token cho tất cả các request
    const setAuthToken = (token) => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    // Đăng ký
    const register = async (formData) => {
        try {
            const res = await axios.post('http://localhost:5001/api/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token);
            setUser(res.data.user);
            setIsAuthenticated(true);
            setError(null);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại');
            return { success: false, error: err.response?.data?.message || 'Đăng ký thất bại' };
        }
    };

    // Đăng nhập
    const login = async (formData) => {
        try {
            const res = await axios.post('http://localhost:5001/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token); 
            setUser(res.data.user);
            setIsAuthenticated(true);
            setError(null);
            return res.data;
        } catch (err) {
            setError(err.response.data.message || 'Đăng nhập thất bại');
            return { success: false, error: err.response.data.message };
        }
    };

    // Đăng xuất
    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                loading,
                error,
                register,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};