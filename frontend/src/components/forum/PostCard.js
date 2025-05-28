import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaFlag, FaHeart, FaComment, FaShare } from 'react-icons/fa';
import ImageViewer from './ImageViewer';

const PostCard = ({
  post,
  user,
  showOptions,
  onToggleOptions,
  onEdit,
  onDelete,
  onReport
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        onToggleOptions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onToggleOptions]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedImage(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b">
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
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer">
          {post.title}
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-1 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            post.images.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          } mb-4`}>
            {post.images.map((image, index) => {
              // For 3 images: first image takes full width
              const isFullWidth = post.images.length === 3 && index === 0;
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className={`relative cursor-pointer overflow-hidden ${
                    isFullWidth ? 'col-span-2' : ''
                  } ${
                    post.images.length === 1 ? 'h-[400px]' : 
                    post.images.length === 2 ? 'h-[300px]' :
                    isFullWidth ? 'h-[300px]' : 'h-[200px]'
                  }`}
                  onClick={() => handleImageClick(image)}
                >
                  <img
                    src={image}
                    alt={`Post content ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-200" />
                  {post.images.length > 4 && index === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                      <span className="text-white text-2xl font-bold">
                        +{post.images.length - 4}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            }).slice(0, 4)}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500' : 'text-gray-600'
              } hover:text-red-500 transition-colors`}
            >
              <FaHeart className={isLiked ? 'fill-current' : ''} />
              <span>{(post.likesCount || 0) + (isLiked ? 1 : 0)}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <FaComment />
              <span>{post.commentsCount || 0}</span>
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-600 hover:text-blue-500 transition-colors"
          >
            <FaShare />
          </motion.button>
        </div>
      </div>

      {/* Image Viewer */}
      {showViewer && (
        <ImageViewer
          images={post.images}
          currentImage={selectedImage}
          onClose={handleCloseViewer}
        />
      )}
    </motion.div>
  );
};

export default PostCard; 