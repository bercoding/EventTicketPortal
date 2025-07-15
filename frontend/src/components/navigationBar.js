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
  const { user, logout, loading } = useAuth();
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

  if (loading) return null;

  // Log user context for debugging
  console.log('USER NAV:', user);
  const ownerRequestStatus = user?.ownerRequestStatus ?? 'none';

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
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
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
            <Link to="/events" className="hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105">
              Sự kiện
            </Link>
            <Link to="/forum" className="hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105">
              Diễn đàn
            </Link>
            {user && (
              <>
                <Link to="/my-tickets" className="flex items-center hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105">
                  <FontAwesomeIcon icon={faTicketAlt} className="mr-1.5" />
                  Vé của tôi
                </Link>
                <Link to="/chat" className="flex items-center hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105">
                  <FontAwesomeIcon icon={faComments} className="mr-1.5" />
                  Tin nhắn
                </Link>
                {/* Nút tạo sự kiện cho event_owner */}
                {user.role === 'event_owner' && (
                  <Link 
                    to="/event-templates" 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                    Tạo sự kiện
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Owner request status */}
                {user.role === 'user' && ownerRequestStatus === 'none' && (
                  <Link
                    to="/become-owner"
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Trở thành đối tác
                  </Link>
                )}

                {user.role === 'user' && ownerRequestStatus === 'pending' && (
                  <span className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    Đang chờ duyệt
                  </span>
                )}

                {/* Profile dropdown */}
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 hover:text-gray-200 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                      <img 
                        className="w-full h-full object-cover" 
                        src={user.avatar || '/images/placeholder-avatar.svg'} 
                        alt="Avatar" 
                        onError={(e) => {e.target.src = '/images/placeholder-avatar.svg'}}
                      />
                    </div>
                    <span className="hidden sm:block font-medium">{user.username}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FontAwesomeIcon icon={faUser} className="mr-3 text-blue-500" />
                          Thông tin cá nhân
                        </Link>
                        {(user.role === 'event_owner' || user.role === 'owner') && (
                          <Link
                            to="/my-events"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-green-500" />
                            Sự kiện của tôi
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FontAwesomeIcon icon={faCog} className="mr-3 text-purple-500" />
                            Quản trị
                          </Link>
                        )}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
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
                  className="hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-md"
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