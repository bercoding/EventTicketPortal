import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaFlag } from 'react-icons/fa';

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={post.userId?.avatar || "https://via.placeholder.com/40"}
            alt="User Avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
            {post.userId?.username || 'Unknown User'}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()}
          </p>
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaEllipsisH className="text-gray-600" />
          </motion.button>
          {showOptions === post._id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden"
            >
              {post.userId?._id === user._id && (
                <>
                  <button
                    onClick={() => onEdit(post)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <FaEdit className="mr-2 text-blue-500" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => onDelete(post._id)}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaTrash className="mr-2" /> Xóa
                  </button>
                </>
              )}
              <button
                onClick={() => onReport(post._id)}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaFlag className="mr-2 text-yellow-500" /> Báo cáo
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostHeader; 