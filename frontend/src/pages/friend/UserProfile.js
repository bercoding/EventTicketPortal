import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import friendService from '../../services/friendService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faComments, 
  faUserPlus, 
  faUserMinus, 
  faUserSlash,
  faCheck,
  faSpinner,
  faUser,
  faEnvelope,
  faCalendarAlt,
  faPhone
} from '@fortawesome/free-solid-svg-icons';

const UserProfile = ({ user, currentUserId, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadFullProfile();
  }, [user._id, currentUserId]);

  const loadFullProfile = async () => {
    setLoading(true);
    try {
      const response = await friendService.getUserProfile(currentUserId, user._id);
      setProfileData(response.user);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Keep using the basic user data if full profile fails
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = () => {
    navigate('/chat', { 
      state: { 
        selectedUser: {
          _id: profileData._id,
          fullName: profileData.fullName,
          username: profileData.username,
          avatar: profileData.avatar
        }
      } 
    });
    onClose();
  };

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await friendService.sendFriendRequest(currentUserId, profileData._id);
      setProfileData(prev => ({ ...prev, friendshipStatus: 'pending_sent' }));
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      await friendService.acceptFriendRequest(currentUserId, profileData._id);
      setProfileData(prev => ({ ...prev, friendshipStatus: 'friends' }));
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    setActionLoading(true);
    try {
      await friendService.rejectFriendRequest(currentUserId, profileData._id);
      setProfileData(prev => ({ ...prev, friendshipStatus: 'none' }));
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setActionLoading(true);
    try {
      await friendService.cancelFriendRequest(currentUserId, profileData._id);
      setProfileData(prev => ({ ...prev, friendshipStatus: 'none' }));
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) return;
    
    setActionLoading(true);
    try {
      await friendService.unfriend(currentUserId, profileData._id);
      setProfileData(prev => ({ ...prev, friendshipStatus: 'none' }));
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn chặn người này?')) return;
    
    setActionLoading(true);
    try {
      await friendService.blockUser(currentUserId, profileData._id);
      onRefresh();
      onClose(); // Close modal after blocking
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionButtons = () => {
    if (actionLoading) {
      return (
        <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg flex items-center space-x-2">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Đang xử lý...</span>
        </button>
      );
    }

    switch (profileData.friendshipStatus) {
      case 'friends':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleMessageClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faComments} />
              <span>Nhắn tin</span>
            </button>
            <button
              onClick={handleUnfriend}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faUserMinus} />
              <span>Hủy kết bạn</span>
            </button>
          </div>
        );
      case 'pending_sent':
        return (
          <button
            onClick={handleCancelRequest}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faTimes} />
            <span>Hủy lời mời</span>
          </button>
        );
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptRequest}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faCheck} />
              <span>Chấp nhận</span>
            </button>
            <button
              onClick={handleRejectRequest}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Từ chối</span>
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={handleSendRequest}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Kết bạn</span>
          </button>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Chưa cập nhật';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-500" />
          </div>
        ) : (
          <div className="p-6">
            {/* Avatar and basic info */}
            <div className="text-center mb-6">
              <img
                src={profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName)}&background=random&color=fff&size=120`}
                alt={profileData.fullName}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{profileData.fullName}</h3>
              <p className="text-gray-600 mb-2">@{profileData.username}</p>
              {profileData.status && (
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  profileData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              )}
            </div>

            {/* User details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-gray-600">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
                <span>{profileData.email}</span>
              </div>
              
              {profileData.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FontAwesomeIcon icon={faPhone} className="w-5 h-5" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              
              {profileData.dateOfBirth && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-5 h-5" />
                  <span>Sinh ngày: {formatDate(profileData.dateOfBirth)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-3">
              {getActionButtons()}
              
              {profileData.friendshipStatus !== 'blocked' && (
                <button
                  onClick={handleBlock}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center space-x-2"
                >
                  <FontAwesomeIcon icon={faUserSlash} />
                  <span>Chặn người dùng</span>
                </button>
              )}
            </div>

            {/* Friendship status indicator */}
            {profileData.friendshipStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  {profileData.friendshipStatus === 'friends' && 'Bạn đã là bạn bè'}
                  {profileData.friendshipStatus === 'pending_sent' && 'Đã gửi lời mời kết bạn'}
                  {profileData.friendshipStatus === 'pending_received' && 'Đã nhận lời mời kết bạn'}
                  {profileData.friendshipStatus === 'blocked' && 'Đã chặn người dùng này'}
                  {profileData.friendshipStatus === 'none' && 'Chưa kết bạn'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
