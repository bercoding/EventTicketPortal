import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaFlag, FaUserCheck } from 'react-icons/fa';

const PostHeader = ({ post, user, showOptions, onToggleOptions, onEdit, onDelete, onReport, optionsRef }) => {
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-0.5">
          <img
              src={post.userId?.avatar || "https://via.placeholder.com/48"}
            alt="User Avatar"
              className="w-full h-full rounded-full object-cover bg-white"
          />
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors">
              {post.userId?.fullName || post.userId?.username || 'Người dùng ẩn danh'}
          </h3>
            {/* Verified badge */}
            {post.userId?.isVerified && (
              <FaUserCheck className="text-blue-500 text-sm" title="Người dùng đã xác thực" />
            )}
          </div>
          
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
          
          {showOptions === post._id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
            >
              <div className="py-2">
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