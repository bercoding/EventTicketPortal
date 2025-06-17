import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUserCircle, faSignOutAlt, faSignInAlt, faUserPlus, 
    faSearch, faTicketAlt, faPlusCircle, faGlobeAsia, faMapMarkerAlt, faComments
} from '@fortawesome/free-solid-svg-icons';

const NavigationBar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search triggered");
    };

    return (
        <nav className="bg-green-500 text-white p-3 shadow-md">
            <div className="container mx-auto flex items-center">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link to="/" className="text-3xl font-bold hover:text-gray-200">
                        EventTicket
                    </Link>
                </div>

                {/* Search Bar - Centered */}
                <div className="flex-grow flex justify-center px-4">
                    <form onSubmit={handleSearch} className="w-full max-w-md">
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Bạn tìm gì hôm nay?"
                                className="w-full bg-white text-gray-700 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                            </div>
                            <button 
                                type="submit"
                                className="absolute inset-y-0 right-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-r-md text-sm"
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </form>
                </div>

                {/* Action Buttons & User Info */}
                <div className="flex-shrink-0 flex items-center space-x-3">
                    {user && user.role === 'event_owner' && (
                        <Link 
                            to="/events/create" 
                            className="bg-white text-green-600 border border-white rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-green-100 hover:text-green-700 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlusCircle} className="mr-1.5" />
                            Tạo sự kiện
                        </Link>
                    )}
                    
                    <Link to="/my-tickets" className="flex items-center hover:text-gray-200 text-sm">
                        <FontAwesomeIcon icon={faTicketAlt} className="mr-1.5" />
                        Vé đã mua
                    </Link>

                    <Link to="/forum" className="flex items-center hover:text-gray-200 text-sm">
                        <FontAwesomeIcon icon={faComments} className="mr-1.5" />
                        Diễn đàn
                    </Link>

                    {user ? (
                        <>
                            <button onClick={handleLogout} className="hover:text-gray-200 text-sm flex items-center">
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-1.5" />
                                Đăng xuất
                            </button>
                            <Link to="/profile" className="hover:text-gray-200">
                                <FontAwesomeIcon icon={faUserCircle} size="lg" />
                                <span className="ml-1.5 text-sm">({user.username})</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-gray-200 text-sm flex items-center">
                                <FontAwesomeIcon icon={faSignInAlt} className="mr-1.5" />
                                Đăng nhập
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link to="/register" className="hover:text-gray-200 text-sm flex items-center">
                                <FontAwesomeIcon icon={faUserPlus} className="mr-1.5" />
                                Đăng ký
                            </Link>
                        </>
                    )}
                    
                    <button className="flex items-center hover:text-gray-200 text-sm">
                        <FontAwesomeIcon icon={faGlobeAsia} className="mr-1" />
                        VN
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;