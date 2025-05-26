// frontend/src/components/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BannedUser from './BannedUser';
import GoogleLoginButton from './GoogleLoginButton';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showBannedPage, setShowBannedPage] = useState(false);
    const [banReason, setBanReason] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        const result = await login({
            email,
            password
        });

        if (result.success) {
            // Check user role and redirect accordingly
            if (result.user && result.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else if (result.banned) {
            // User is banned, show banned page
            setShowBannedPage(true);
            setBanReason(result.banReason);
        } else {
            setError(result.error || 'Đăng nhập thất bại');
        }
    };

    // If user is banned, show banned page
    if (showBannedPage) {
        return <BannedUser banReason={banReason} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
                    <p className="mt-2 text-gray-600">Chào mừng bạn quay trở lại!</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input 
                                    id="email"
                                    type="email" 
                                    placeholder="Nhập email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input 
                                    id="password"
                                    type="password" 
                                    placeholder="Nhập mật khẩu"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition duration-200 ease-in-out hover:scale-105 shadow-lg"
                        >
                            Đăng nhập
                        </button>
                    </form>

                    <GoogleLoginButton />

                    {/* Links */}
                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Chưa có tài khoản? 
                            <a href="/register" className="ml-1 text-blue-600 hover:text-blue-700 font-medium transition duration-200">
                                Đăng ký ngay
                            </a>
                        </p>
                        <p>
                            <a href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 transition duration-200">
                                Quên mật khẩu?
                            </a>
                        </p>
                    </div>

                   
                </div>
            </div>
        </div>
    );
};

export default Login;