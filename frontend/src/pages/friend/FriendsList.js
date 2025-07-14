import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import friendService from '../../services/friendService';
import UserProfile from './UserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments, 
  faUserMinus, 
  faUserSlash, 
  faEllipsisV,
  faUsers 
} from '@fortawesome/free-solid-svg-icons';

const FriendsList = ({ friends, currentUserId, onRefresh }) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMessageClick = (friend) => {
    navigate('/chat', { 
      state: { 
        selectedUser: {
          _id: friend._id,
          fullName: friend.fullName,
          username: friend.username,
          avatar: friend.avatar
        }
      } 
    });
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return;
    
    setLoading(true);
    try {
      await friendService.unfriend(currentUserId, friendId);
      onRefresh();
      setShowDropdown(null);
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (friendId) => {
    if (!window.confirm('Bạn có chắc chắn muốn chặn người này?')) return;
    
    setLoading(true);
    try {
      await friendService.blockUser(currentUserId, friendId);
      onRefresh();
      setShowDropdown(null);
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (friend) => {
    setSelectedUser(friend);
    setShowDropdown(null);
  };

  const closeProfile = () => {
    setSelectedUser(null);
  };

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có bạn bè</h3>
        <p className="text-gray-500">Hãy tìm kiếm và kết bạn với mọi người!</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Danh sách bạn bè ({friends.length})
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <div key={friend._id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <img
                src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName)}&background=random&color=fff`}
                alt={friend.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{friend.fullName}</h3>
                <p className="text-sm text-gray-600">@{friend.username}</p>
                {friend.status && (
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    friend.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {friend.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(showDropdown === friend._id ? null : friend._id)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                
                {showDropdown === friend._id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <button
                      onClick={() => handleViewProfile(friend)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Xem thông tin
                    </button>
                    <button
                      onClick={() => handleMessageClick(friend)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FontAwesomeIcon icon={faComments} className="mr-2" />
                      Nhắn tin
                    </button>
                    <button
                      onClick={() => handleUnfriend(friend._id)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faUserMinus} className="mr-2" />
                      Hủy kết bạn
                    </button>
                    <button
                      onClick={() => handleBlock(friend._id)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faUserSlash} className="mr-2" />
                      Chặn
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfile
          user={selectedUser}
          currentUserId={currentUserId}
          onClose={closeProfile}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default FriendsList;
