import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaFlag, FaUserCheck } from 'react-icons/fa';

// PostHeader: Hiển thị phần header của một bài post trong forum, gồm avatar, tên, thời gian, menu tuỳ chọn
const PostHeader = ({ post, user, showOptions, onToggleOptions, onEdit, onDelete, onReport, optionsRef }) => {
  // Xử lý đóng menu tuỳ chọn khi click ra ngoài
  useEffect(() => {
    if (showOptions !== post._id) return;
    function handleClickOutside(event) {
      if (optionsRef && optionsRef.current && !optionsRef.current.contains(event.target)) {
        onToggleOptions(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions, post._id, onToggleOptions, optionsRef]);

  // Định dạng thời gian đăng bài ("x phút trước", "x ngày trước"...)
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMs = now - postDate;
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
      return postDate.toLocaleDateString('vi-VN');
    }
  };

  // Chuẩn hóa đường dẫn avatar (nếu là link local thì thêm host)
  const getAvatarUrl = (avatar) => {
    if (!avatar) return 'https://via.placeholder.com/48';
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:5001${avatar}`;
  };

  return (
    <div className="flex items-center justify-between">
      {/* Avatar và tên người dùng */}
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-0.5">
            {/* Ảnh đại diện người dùng */}
            <img
              src={getAvatarUrl(post.userId?.avatar)}
              alt="User Avatar"
              className="w-full h-full rounded-full object-cover bg-white"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/48'; }}
            />
          </div>
          {/* Chấm xanh online (demo) */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {/* Tên người dùng */}
            <h3 className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
              {post.userId?.fullName || post.userId?.username || 'Người dùng ẩn danh'}
            </h3>
            {/* Badge xác thực nếu có */}
            {post.userId?.isVerified && (
              <FaUserCheck className="text-blue-500 text-sm" title="Người dùng đã xác thực" />
            )}
          </div>
          {/* Thời gian đăng và trạng thái công khai */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{formatTimeAgo(post.createdAt)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Công khai</span>
            </div>
          </div>
        </div>
      </div>
      {/* Menu tuỳ chọn (sửa, xoá, báo cáo) */}
      {user && (
        <div className="relative" ref={optionsRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleOptions(showOptions === post._id ? null : post._id);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <FaEllipsisH className="text-gray-400 group-hover:text-gray-600" />
          </motion.button>
          {/* Dropdown menu các tuỳ chọn */}
          {showOptions === post._id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
            >
              <div className="py-2">
                {/* Nếu là chủ post thì hiện nút sửa, xoá */}
                {post.userId?._id === user._id && (
                  <>
                    <button
                      onClick={() => onEdit(post)}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FaEdit className="text-blue-600 text-xs" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Chỉnh sửa bài viết</div>
                        <div className="text-xs text-gray-500">Cập nhật nội dung</div>
                      </div>
                    </button>
                    <button
                      onClick={() => onDelete(post._id)}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <FaTrash className="text-red-600 text-xs" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Xóa bài viết</div>
                        <div className="text-xs text-gray-500">Không thể hoàn tác</div>
                      </div>
                    </button>
                    <div className="my-2 h-px bg-gray-100 mx-2"></div>
                  </>
                )}
                {/* Nút báo cáo bài viết */}
                <button
                  onClick={() => onReport(post._id)}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <FaFlag className="text-orange-600 text-xs" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Báo cáo bài viết</div>
                    <div className="text-xs text-gray-500">Nội dung không phù hợp</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostHeader; 