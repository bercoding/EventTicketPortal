import React, { useState } from 'react';
import friendService from '../../services/friendService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUnlock, 
  faUserSlash,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';

const BlockedUsers = ({ blockedUsers, currentUserId, onRefresh }) => {
  const [actionLoading, setActionLoading] = useState(null);

  const handleUnblock = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn bỏ chặn người này?')) return;
    
    setActionLoading(userId);
    try {
      await friendService.unblockUser(currentUserId, userId);
      onRefresh();
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  if (blockedUsers.length === 0) {
    return (
      <div className="p-8 text-center">
        <FontAwesomeIcon icon={faUserSlash} className="text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Không có người dùng bị chặn</h3>
        <p className="text-gray-500">Những người bạn đã chặn sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Người dùng đã chặn ({blockedUsers.length})
      </h2>
      
      <div className="space-y-3">
        {blockedUsers.map((user) => (
          <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&color=fff`}
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover opacity-60"
              />
              <div>
                <h4 className="font-semibold text-gray-600">{user.fullName}</h4>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <span className="inline-block px-2 py-1 text-xs rounded-full mt-1 bg-red-100 text-red-800">
                  Đã chặn
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUnblock(user._id)}
                disabled={actionLoading === user._id}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-1"
              >
                {actionLoading === user._id ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faUnlock} />
                )}
                <span>Bỏ chặn</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faUserSlash} className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Lưu ý về việc chặn</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Khi bạn chặn ai đó:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Họ không thể gửi lời mời kết bạn cho bạn</li>
                <li>Họ không thể nhắn tin cho bạn</li>
                <li>Họ không thể xem thông tin cá nhân của bạn</li>
                <li>Bạn sẽ không xuất hiện trong kết quả tìm kiếm của họ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedUsers;
