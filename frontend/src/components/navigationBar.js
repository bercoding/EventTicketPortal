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
  faCog,
  faUsers,
  faBell, // Thêm icon chuông
  faChartLine // Thêm icon cho thống kê
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; // Import useSocket
import NotificationDropdown from './notifications/NotificationDropdown'; // Import component
import { notificationAPI } from '../services/api'; // Import notificationAPI

const NavigationBar = () => {
  const { user, logout, loading } = useAuth();
  const { lastNotification } = useSocket(); // Lấy lastNotification từ context
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false); // State cho notif dropdown
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0); // Key để trigger refresh
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null); // Ref cho notif dropdown
  const navigate = useNavigate();

  // Chỉ fetch unreadCount, gọn nhẹ hơn
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getNotifications(); // API này đã trả về cả hai
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch khi component mount và khi có user
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Trigger refresh khi có thông báo mới từ socket
  useEffect(() => {
    if (lastNotification) {
      fetchUnreadCount(); // Cập nhật lại count
      setNotifRefreshKey(prevKey => prevKey + 1); // Báo cho dropdown biết để refresh
    }
  }, [lastNotification]);


  useEffect(() => {
    // Set up interval to refetch notifications every 30 seconds
    const intervalId = setInterval(() => {
        if(user) fetchUnreadCount();
    }, 30000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // Thêm logic cho notif dropdown
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        const bellButton = document.querySelector('[aria-label="Notifications"]');
        if (bellButton && !bellButton.contains(event.target)) {
          setIsNotifDropdownOpen(false);
        }
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

  const toggleNotifDropdown = () => {
    setIsNotifDropdownOpen(prev => !prev);
    if (!isNotifDropdownOpen) {
      fetchUnreadCount(); // Cập nhật count khi mở
    }
  };

  return (
    <nav className="bg-gradient-to-r from-pastel-500 to-pastel-600 text-white shadow-lg">
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
                <Link to="/friends" className="flex items-center hover:text-gray-200 text-sm font-medium transition-all duration-200 hover:scale-105">
                  <FontAwesomeIcon icon={faUsers} className="mr-1.5" />
                  Bạn bè
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

          {/* User menu and notifications */}
          <div className="flex items-center" >
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Nút chuông thông báo */}
                <div className="relative" ref={notifDropdownRef}>
                  <button 
                    onClick={toggleNotifDropdown}
                    className="relative text-white hover:text-gray-200 focus:outline-none"
                    aria-label="Notifications"
                  >
                    <FontAwesomeIcon icon={faBell} className="h-6 w-6" />
                    {/* Badge thông báo */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifDropdownOpen && <NotificationDropdown 
                    key={notifRefreshKey} // Dùng key để re-mount component
                    onClose={() => setIsNotifDropdownOpen(false)} 
                    onUpdateUnreadCount={fetchUnreadCount} // Truyền hàm để dropdown có thể cập nhật count
                  />}
                </div>

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
                <div className="relative inline-block text-left" ref={dropdownRef}>
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
                          <FontAwesomeIcon icon={faUser} className="mr-3 text-pastel-500" />
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
                        {(user.role === 'event_owner' || user.role === 'owner') && (
                          <Link
                            to="/owner/statistics"
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <FontAwesomeIcon icon={faChartLine} className="mr-3 text-blue-500" />
                            Thống kê
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
                  className="bg-white text-pastel-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-pure-100 transition-all duration-200 hover:scale-105 shadow-md"
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