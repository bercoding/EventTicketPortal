import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faSignOutAlt, 
  faTicketAlt, 
  faComments,
  faPlus,
  faChevronDown,
  faCalendarAlt,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo và tên trang */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">EventHub</span>
            </Link>
          </div>

          {/* Menu điều hướng */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/events" className="hover:text-gray-200 text-sm">
              Sự kiện
            </Link>
            <Link to="/forum" className="hover:text-gray-200 text-sm">
              Diễn đàn
            </Link>
            {user && (
              <>
                <Link to="/my-tickets" className="flex items-center hover:text-gray-200 text-sm">
                  <FontAwesomeIcon icon={faTicketAlt} className="mr-1.5" />
                  Vé của tôi
                </Link>
                <Link to="/chat" className="flex items-center hover:text-gray-200 text-sm">
                  <FontAwesomeIcon icon={faComments} className="mr-1.5" />
                  Tin nhắn
                </Link>
                {/* Nút tạo sự kiện cho event_owner */}
                {user.role === 'event_owner' && (
                  <Link 
                    to="/event-templates" 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                    Tạo sự kiện
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Debug info - có thể xóa sau khi fix */}
                <div className="hidden lg:block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {user.email} (ID: {user.id?.slice(-6)})
                </div>
                
                {/* Owner request status */}
                {user.role === 'user' && user.ownerRequestStatus === 'none' && (
                  <Link
                    to="/become-owner"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Trở thành owner
                  </Link>
                )}

                {user.role === 'user' && user.ownerRequestStatus === 'pending' && (
                  <span className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    Đang chờ duyệt owner
                  </span>
                )}

                {/* Profile dropdown */}
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 hover:text-gray-200 focus:outline-none"
                  >
                    <img 
                      className="w-8 h-8 rounded-full object-cover" 
                      src={user.avatar || '/images/placeholder-avatar.svg'} 
                      alt="Avatar" 
                    />
                    <span className="hidden sm:block font-medium">{user.username}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FontAwesomeIcon icon={faUser} className="mr-2" />
                          Thông tin cá nhân
                        </Link>
                        {(user.role === 'event_owner' || user.role === 'owner') && (
                          <Link
                            to="/my-events"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                            Sự kiện của tôi
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FontAwesomeIcon icon={faCog} className="mr-2" />
                            Quản trị
                          </Link>
                        )}
                        <div className="border-t border-gray-100"></div>
                        <button
                          onClick={() => {
                            console.log('🔄 Manual logout clicked by:', user.email);
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="hover:text-gray-200 text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;