import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TicketboxNavBar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">TB</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">TicketBox</span>
                    </Link>

                    <div className="flex items-center space-x-6">
                        <Link to="/events" className="text-gray-700 hover:text-blue-600 font-medium">
                            Sự kiện
                        </Link>
                        {user && (
                            <Link to="/my-tickets" className="text-gray-700 hover:text-blue-600 font-medium">
                                Vé của tôi
                            </Link>
                        )}
                        {user ? (
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium">
                                Đăng xuất
                            </button>
                        ) : (
                            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TicketboxNavBar;
