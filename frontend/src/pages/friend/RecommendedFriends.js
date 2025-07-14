import React, { useState, useEffect } from 'react';
import friendService from '../../services/friendService';
import UserProfile from './UserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faEye,
  faSpinner,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

const RecommendedFriends = ({ currentUserId, onRefresh }) => {
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRecommendedFriends();
  }, [currentUserId]);

  const loadRecommendedFriends = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const response = await friendService.getRecommendedFriends(currentUserId);
      setRecommendedUsers(response.users || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setActionLoading(userId);
    try {
      await friendService.sendFriendRequest(currentUserId, userId);
      
      // Remove the user from recommendations since they now have a pending request
      setRecommendedUsers(prev => 
        prev.filter(user => user._id !== userId)
      );
      
      // Refresh parent data
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
  };

  const closeProfile = () => {
    setSelectedUser(null);
  };

  const getStatusButton = (user) => {
    const isLoading = actionLoading === user._id;
    
    switch (user.friendshipStatus) {
      case 'friends':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Bạn bè
          </span>
        );
      case 'pending_sent':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Đã gửi lời mời
          </span>
        );
      case 'pending_received':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Đã nhận lời mời
          </span>
        );
      case 'blocked':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Đã chặn
          </span>
        );
      default:
        return (
          <button
            onClick={() => handleSendRequest(user._id)}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faUserPlus} />
            )}
            <span>Kết bạn</span>
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-500 mb-3" />
        <p className="text-gray-600">Đang tải gợi ý kết bạn...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Gợi ý kết bạn ({recommendedUsers.length})
      </h2>
      
      {recommendedUsers.length > 0 ? (
        <div className="space-y-3">
          {recommendedUsers.map((user) => (
            <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff`}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{user.fullName}</h4>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                  {user.email && (
                    <p className="text-xs text-gray-500">{user.email}</p>
                  )}
                  {user.status && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewProfile(user)}
                  className="px-3 py-1 text-gray-600 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 flex items-center space-x-1"
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>Xem</span>
                </button>
                {getStatusButton(user)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có gợi ý kết bạn</h3>
          <p className="text-gray-500">Hiện tại không có người dùng nào để gợi ý kết bạn</p>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfile
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={closeProfile}
          onRefresh={() => {
            onRefresh();
            loadRecommendedFriends();
          }}
        />
      )}
    </div>
  );
};

export default RecommendedFriends;
