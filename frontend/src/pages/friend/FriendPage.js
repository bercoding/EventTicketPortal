import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import friendService from '../../services/friendService';
import FriendsList from './FriendsList';
import SearchUsers from './SearchUsers';
import FriendRequests from './FriendRequests';
import PendingRequests from './PendingRequests';
import BlockedUsers from './BlockedUsers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserPlus, 
  faUserClock, 
  faInbox, 
  faUserSlash,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

const FriendPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 FriendPage - User Debug Info:');
    console.log('- user object:', user);
    console.log('- user._id:', user?._id);
    console.log('- user.id:', user?.id);
    console.log('- typeof user._id:', typeof user?._id);
    console.log('- user._id length:', user?._id?.length);
    console.log('- user._id valid?:', user?._id && user._id.length === 24);
    
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    // Handle both _id and id field names
    const userId = user?._id || user?.id;
    
    console.log('🔄 loadData called with userId:', userId);
    
    if (!userId) {
      console.log('❌ No valid user ID found');
      return;
    }
    
    setLoading(true);
    try {
      const [friendsRes, requestsRes, pendingRes, blockedRes] = await Promise.all([
        friendService.getFriendsList(userId),
        friendService.getFriendRequests(userId),
        friendService.getPendingRequests(userId),
        friendService.getBlockedUsers(userId)
      ]);

      setFriends(friendsRes.friends || []);
      setFriendRequests(requestsRes.friendRequests || []);
      setPendingRequests(pendingRes.pendingRequests || []);
      setBlockedUsers(blockedRes.blockedUsers || []);
    } catch (error) {
      console.error('Error loading friend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const tabs = [
    { 
      id: 'friends', 
      label: 'Bạn bè', 
      icon: faUsers, 
      count: friends.length,
      color: 'text-blue-600'
    },
    { 
      id: 'search', 
      label: 'Tìm bạn', 
      icon: faSearch, 
      count: null,
      color: 'text-green-600'
    },
    { 
      id: 'requests', 
      label: 'Lời mời', 
      icon: faInbox, 
      count: friendRequests.length,
      color: 'text-orange-600'
    },
    { 
      id: 'pending', 
      label: 'Đã gửi', 
      icon: faUserClock, 
      count: pendingRequests.length,
      color: 'text-purple-600'
    },
    { 
      id: 'blocked', 
      label: 'Đã chặn', 
      icon: faUserSlash, 
      count: blockedUsers.length,
      color: 'text-red-600'
    }
  ];

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cần đăng nhập</h2>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để sử dụng chức năng bạn bè.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bạn bè</h1>
          <p className="text-gray-600">Quản lý danh sách bạn bè và kết nối với mọi người</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-center transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FontAwesomeIcon icon={tab.icon} className={tab.color} />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'friends' && (
                <FriendsList 
                  friends={friends} 
                  currentUserId={user?._id || user?.id}
                  onRefresh={loadData}
                />
              )}
              {activeTab === 'search' && (
                <SearchUsers 
                  currentUserId={user?._id || user?.id}
                  onRefresh={loadData}
                />
              )}
              {activeTab === 'requests' && (
                <FriendRequests 
                  requests={friendRequests} 
                  currentUserId={user?._id || user?.id}
                  onRefresh={loadData}
                />
              )}
              {activeTab === 'pending' && (
                <PendingRequests 
                  requests={pendingRequests} 
                  currentUserId={user?._id || user?.id}
                  onRefresh={loadData}
                />
              )}
              {activeTab === 'blocked' && (
                <BlockedUsers 
                  blockedUsers={blockedUsers} 
                  currentUserId={user?._id || user?.id}
                  onRefresh={loadData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendPage;
