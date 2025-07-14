import React, { useState } from 'react';
import friendService from '../../services/friendService';
import UserProfile from './UserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faEye,
  faUserClock,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';

const PendingRequests = ({ requests, currentUserId, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleCancel = async (receiverId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lời mời kết bạn này?')) return;
    
    setActionLoading(receiverId);
    try {
      await friendService.cancelFriendRequest(currentUserId, receiverId);
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

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <FontAwesomeIcon icon={faUserClock} className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có lời mời đã gửi</h3>
        <p className="text-gray-500">Các lời mời kết bạn bạn đã gửi sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Lời mời đã gửi ({requests.length})
      </h2>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <img
                src={request.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.fullName)}&background=random&color=fff`}
                alt={request.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-800">{request.fullName}</h4>
                <p className="text-sm text-gray-600">@{request.username}</p>
                <span className="inline-block px-2 py-1 text-xs rounded-full mt-1 bg-yellow-100 text-yellow-800">
                  Đang chờ phản hồi
                </span>
                {request.status && (
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ml-2 ${
                    request.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewProfile(request)}
                className="px-3 py-1 text-gray-600 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 flex items-center space-x-1"
              >
                <FontAwesomeIcon icon={faEye} />
                <span>Xem</span>
              </button>
              
              <button
                onClick={() => handleCancel(request._id)}
                disabled={actionLoading === request._id}
                className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center space-x-1"
              >
                {actionLoading === request._id ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faTimes} />
                )}
                <span>Hủy lời mời</span>
              </button>
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

export default PendingRequests;
