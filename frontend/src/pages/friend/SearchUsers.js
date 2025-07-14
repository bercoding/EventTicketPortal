import React, { useState } from 'react';
import friendService from '../../services/friendService';
import UserProfile from './UserProfile';
import RecommendedFriends from './RecommendedFriends';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserPlus, 
  faEye,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';

const SearchUsers = ({ currentUserId, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) {
      alert('Vui lòng nhập ít nhất 2 ký tự để tìm kiếm');
      return;
    }

    console.log('🔍 Frontend search starting:');
    console.log('- currentUserId:', currentUserId);
    console.log('- currentUserId type:', typeof currentUserId);
    console.log('- currentUserId valid?:', currentUserId && currentUserId.length === 24);
    console.log('- searchQuery:', searchQuery.trim());
    console.log('- localStorage token exists:', !!localStorage.getItem('token'));
    console.log('- localStorage user:', localStorage.getItem('user'));

    // Check if currentUserId is valid
    if (!currentUserId) {
      console.error('❌ currentUserId is null/undefined:', currentUserId);
      alert('Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    if (typeof currentUserId !== 'string' || currentUserId.length !== 24) {
      console.error('❌ Invalid currentUserId format:', currentUserId, 'length:', currentUserId?.length);
      alert('Lỗi: User ID không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Making API call...');
      const response = await friendService.searchUsers(currentUserId, searchQuery.trim());
      console.log('✅ Search response received:', response);
      console.log('- Response users array:', response.users);
      console.log('- Number of users found:', response.users?.length || 0);
      setSearchResults(response.users || []);
      
      if (!response.users || response.users.length === 0) {
        console.log('📝 No users found in response');
      }
    } catch (error) {
      console.error('❌ Search error details:', error);
      console.error('- Error message:', error.message);
      console.error('- Full error object:', error);
      
      // More detailed error information
      if (error.response) {
        console.error('- Error response status:', error.response.status);
        console.error('- Error response data:', error.response.data);
      }
      
      alert(error.message || 'Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setActionLoading(userId);
    try {
      await friendService.sendFriendRequest(currentUserId, userId);
      
      // Update the user's status in search results
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, friendshipStatus: 'pending_sent' }
            : user
        )
      );
      
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

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Tìm kiếm bạn bè</h2>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, username hoặc email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )}
            <span>Tìm kiếm</span>
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-700">
            Kết quả tìm kiếm ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((user) => (
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
        </div>
      )}

      {/* No Results */}
      {searchQuery && !loading && searchResults.length === 0 && (
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faSearch} className="text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Không tìm thấy kết quả nào cho "{searchQuery}"</p>
          <p className="text-sm text-gray-400">
            💡 Lưu ý: Bạn không thể tìm kiếm chính mình. Hãy thử tìm kiếm email, tên hoặc username của người khác.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!searchQuery && searchResults.length === 0 && (
        <div>
          <div className="text-center py-8 mb-8">
            <FontAwesomeIcon icon={faUserPlus} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tìm kiếm bạn bè</h3>
            <p className="text-gray-500 mb-2">Nhập tên, username hoặc email để tìm kiếm bạn bè mới</p>
            <p className="text-sm text-gray-400">
              Ví dụ: tên người dùng, @username, hoặc email@domain.com
            </p>
          </div>
          
          {/* Recommended Friends Section */}
          <div className="border-t border-gray-200 pt-6">
            <RecommendedFriends 
              currentUserId={currentUserId}
              onRefresh={onRefresh}
            />
          </div>
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
            // Refresh search results
            if (searchQuery.trim()) {
              handleSearch({ preventDefault: () => {} });
            }
          }}
        />
      )}
    </div>
  );
};

export default SearchUsers;
