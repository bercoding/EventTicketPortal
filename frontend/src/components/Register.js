// frontend/src/components/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import { FaEnvelope, FaLock, FaUser, FaCheck, FaEye, FaEyeSlash, FaTicketAlt, FaShieldAlt } from 'react-icons/fa';

const Register = () => {
    const navigate = useNavigate();
    const { register, verifyOTP } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [showOTPForm, setShowOTPForm] = useState(false);
    const [otp, setOTP] = useState('');
    const [otpError, setOTPError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setRegisterError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setRegisterError('');

        if (formData.password !== formData.confirmPassword) {
            setRegisterError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }

        try {
            const { email, password, username, fullName } = formData;
            console.log('Submitting registration for:', email);
            const response = await register({ email, password, username, fullName });
            console.log('Registration completed with response:', response);
            
            if (response.success) {
                console.log('Registration successful, showing OTP form');
                setRegisteredEmail(email);
                setShowOTPForm(true);
            } else {
                console.error('Registration failed with error:', response.error);
                setRegisterError(response.error || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setRegisterError(error.message || 'Đăng ký thất bại');
        }
        setLoading(false);
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOTPError('');

        try {
            const email = registeredEmail || formData.email;
            
            console.log('Submitting OTP verification for:', email);
            const response = await verifyOTP({
                email,
                otp
            });
            console.log('OTP verification response:', response);

            if (response.success) {
                console.log('OTP verification successful, redirecting to home');
                navigate('/');
            } else {
                console.error('OTP verification failed:', response.error);
                setOTPError(response.error || 'Xác thực OTP thất bại');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            setOTPError(error.message || 'Xác thực OTP thất bại');
        }
        setLoading(false);
    };

    if (showOTPForm) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-50 via-pastel-100 to-pastel-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pastel-400 to-pastel-500 rounded-full opacity-10 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pastel-400 to-pastel-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    {/* Logo and Header */}
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-pastel-600 to-pastel-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <FaShieldAlt className="text-white text-3xl" />
                        </div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-pastel-600 to-pastel-700 bg-clip-text text-transparent">
                            Xác thực OTP
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Vui lòng nhập mã OTP đã được gửi đến email {registeredEmail || formData.email}
                        </p>
                    </div>

                    {/* OTP Form Card */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                        <form className="space-y-6" onSubmit={handleOTPSubmit}>
                            {otpError && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                                    <div className="text-sm text-red-700 flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                        {otpError}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label htmlFor="otp" className="text-sm font-medium text-gray-700 ml-1">
                                    Mã OTP
                                </label>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-center text-lg font-mono tracking-widest"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOTP(e.target.value)}
                                    maxLength="6"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="h-4 w-4 mr-2" />
                                        Xác nhận
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .animate-shake {
                        animation: shake 0.5s ease-in-out;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-50 via-pastel-100 to-pastel-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pastel-400 to-pastel-500 rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pastel-400 to-pastel-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pastel-400 to-pastel-500 rounded-full opacity-5 animate-spin" style={{animationDuration: '20s'}}></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-pastel-600 to-pastel-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <FaTicketAlt className="text-white text-3xl" />
                    </div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-pastel-600 to-pastel-700 bg-clip-text text-transparent">
                        Tham gia cùng chúng tôi
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Tạo tài khoản để khám phá thế giới sự kiện tuyệt vời
                    </p>
                </div>

                {/* Register Form Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {registerError && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                                <div className="text-sm text-red-700 flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                    {registerError}
                                </div>
                            </div>
                        )}

                        {/* Full Name Input */}
                        <div className="space-y-1">
                            <label htmlFor="fullName" className="text-sm font-medium text-gray-700 ml-1">
                                Họ và tên
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaUser className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-1">
                            <label htmlFor="username" className="text-sm font-medium text-gray-700 ml-1">
                                Tên đăng nhập
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaUser className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                                    placeholder="your_username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
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
                                    <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
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

                        {/* Confirm Password Input */}
                        <div className="space-y-1">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 ml-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <FaUser className="h-4 w-4 mr-2" />
                                    Đăng ký
                                </>
                            )}
                        </button>

                        {/* Login Link */}
                        <div className="text-center">
                            <span className="text-gray-600">Đã có tài khoản? </span>
                            <Link
                                to="/login"
                                className="font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200"
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white/80 text-gray-500 rounded-full">
                                    Hoặc đăng ký với
                                </span>
                            </div>
                        </div>

                        {/* Google Register */}
                        <div className="w-full">
                            <GoogleLoginButton />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>Bằng cách đăng ký, bạn đồng ý với</p>
                    <div className="mt-1">
                        <Link to="/terms" className="text-purple-600 hover:text-purple-500 transition-colors duration-200">
                            Điều khoản dịch vụ
                        </Link>
                        <span className="mx-2">và</span>
                        <Link to="/privacy" className="text-purple-600 hover:text-purple-500 transition-colors duration-200">
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

export default Register;