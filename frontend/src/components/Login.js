// frontend/src/components/Login.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTicketAlt } from 'react-icons/fa';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Get message and returnUrl from location state
    const message = location.state?.message;
    const returnUrl = location.state?.returnUrl || location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setLoginError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');

        try {
            const response = await login(formData.email, formData.password);
            if (response.success) {
                await refreshUser();
                navigate(returnUrl);
            } else {
                setLoginError(response.error || 'Đăng nhập thất bại');
            }
        } catch (error) {
            setLoginError(error.message || 'Đăng nhập thất bại');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400 to-pink-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-5 animate-spin" style={{animationDuration: '20s'}}></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
                        <img 
                            src="http://localhost:5001/logo/lgoo-03.png" 
                            alt="VENTURE Logo" 
                            className="w-81 h-auto"
                        />
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Chào mừng trở lại
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Đăng nhập để tiếp tục khám phá các sự kiện tuyệt vời
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {message && (
                            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 animate-fade-in">
                                <div className="text-sm text-blue-700 flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                    {message}
                                </div>
                            </div>
                        )}
                        
                        {loginError && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                                <div className="text-sm text-red-700 flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                    {loginError}
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <FaLock className="h-4 w-4 mr-2" />
                                    Đăng nhập
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <div className="text-center">
                            <span className="text-gray-600">Chưa có tài khoản? </span>
                            <Link
                                to="/register"
                                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                            >
                                Đăng ký ngay
                            </Link>
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white/80 text-gray-500 rounded-full">
                                    Hoặc đăng nhập với
                                </span>
                            </div>
                        </div>

                        {/* Google Login */}
                        <div className="w-full">
                            <GoogleLoginButton />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>Bằng cách đăng nhập, bạn đồng ý với</p>
                    <div className="mt-1">
                        <Link to="/terms" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                            Điều khoản dịch vụ
                        </Link>
                        <span className="mx-2">và</span>
                        <Link to="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                            Chính sách bảo mật
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Login;