import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaSpinner } from 'react-icons/fa';
import { notificationAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes < 1 ? 'Vừa xong' : `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
};

const NotificationDropdown = ({ onClose, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await notificationAPI.getNotifications();
        setNotifications(res.data.notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []); // Chỉ fetch một lần khi component được mount (nhờ có key ở component cha)

  const handleNotificationClick = async (notification) => {
    // Mark as read if it's unread
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);
        onUpdateUnreadCount(); // Cập nhật count ở navigation bar
        // Cập nhật state local để UI thay đổi ngay lập tức
        setNotifications(prev => prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate to the related content
    if (notification.relatedTo && notification.relatedTo.id) {
      const { type: relatedType, id } = notification.relatedTo;
      
      if (relatedType === 'post') {
        navigate(`/forum/post/${id}`);
      } else if (relatedType === 'user') {
        // Dựa vào loại thông báo chính để quyết định tab
        if (notification.type === 'friend_request') {
          navigate('/friends', { state: { initialTab: 'requests' } }); 
        } else if (notification.type === 'friend_accept') {
          navigate('/friends', { state: { initialTab: 'friends' } });
        } else {
          // Mặc định cho các thông báo khác liên quan đến user
          navigate('/friends');
        }
      } else if (relatedType === 'event') {
        navigate(`/events/${id}`);
      } else if (relatedType === 'ticket') {
        navigate('/my-tickets');
      }
      // Add other navigation logic for 'event', 'booking', etc. here
    }
    onClose(); // Close dropdown after clicking
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      onUpdateUnreadCount();
      // Cập nhật state local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border z-50 overflow-hidden text-gray-800">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <FaBell className="text-gray-700 mr-2" />
          <h3 className="text-lg font-semibold">Thông báo</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <FaTimes className="text-gray-500" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
            <div className="p-8 text-center text-gray-500">
                <FaSpinner className="mx-auto text-4xl text-gray-300 animate-spin mb-4" />
                <p>Đang tải thông báo...</p>
            </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start p-4 border-b border-gray-100 transition-colors duration-200 cursor-pointer hover:bg-gray-50 ${
                !notif.isRead ? 'bg-blue-50' : ''
              }`}
            >
              {/* This should be dynamic based on notification type */}
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-4 shrink-0">
                 <FaBell className="text-blue-600"/>
              </div>
              <div className="flex-1">
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: notif.message }}></p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <div className="w-3 h-3 bg-blue-500 rounded-full ml-4 self-center shrink-0"></div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <FaBell className="mx-auto text-4xl text-gray-300 mb-4" />
            <p>Bạn không có thông báo mới.</p>
          </div>
        )}
      </div>

      <div className="p-2 text-center border-t flex justify-between items-center">
        <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-blue-600 hover:underline px-4 py-2">
          Đánh dấu tất cả đã đọc
        </button>
        <button className="text-sm font-medium text-blue-600 hover:underline px-4 py-2">
          Xem tất cả
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown; 