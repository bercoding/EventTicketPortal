import React, { useRef, useEffect, useState } from 'react';
import { FaThumbsUp, FaComment, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { postAPI } from '../../services/api';

// PostActions: Hiển thị các nút hành động (like, comment) và thống kê cho một bài post trong forum

const PostActions = ({
  isLiked, // Đã like bài viết chưa
  likeCount, // Số lượt thích
  onLike, // Hàm xử lý khi bấm like
  onShowLikers, // Hàm mở modal danh sách người đã thích
  commentCount, // Số bình luận
  onShowComments, // Hàm mở/đóng comment section
  likersModalOpen, // Modal danh sách người thích đang mở không
  likers, // Danh sách người đã thích
  onCloseLikersModal, // Đóng modal danh sách người thích
  loadingLikers, // Đang load danh sách người thích
  postId, // ID bài viết
  commenters = [], // Danh sách người đã bình luận
  isLiking = false // Đang xử lý like (loading)
}) => {
  const modalRef = useRef();
  const [hoverLikers, setHoverLikers] = useState([]);
  const [showHoverLikers, setShowHoverLikers] = useState(false);
  const hoverTimeout = useRef();
  const [showHoverCommenters, setShowHoverCommenters] = useState(false);
  const hoverCommentersTimeout = useRef();

  useEffect(() => {
    if (!likersModalOpen) return;
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onCloseLikersModal();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [likersModalOpen, onCloseLikersModal]);

  // Xử lý hover để show tooltip danh sách người đã thích
  const handleHoverLikers = async () => {
    try {
      const res = await postAPI.getPostLikes(postId);
      if (res && res.data && res.data.success) {
        setHoverLikers((res.data.users || []).slice(0, 10));
      }
    } catch {
      setHoverLikers([]);
    }
  };

  const handleMouseEnterLikers = () => {
    if (likeCount > 0) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        setShowHoverLikers(true);
        handleHoverLikers();
      }, 500);
    }
  };

  const handleMouseLeaveLikers = () => {
    clearTimeout(hoverTimeout.current);
    setShowHoverLikers(false);
  };

  // Xử lý hover để show tooltip danh sách người đã bình luận
  const handleMouseEnterCommenters = () => {
    if (commentCount > 0) {
      clearTimeout(hoverCommentersTimeout.current);
      hoverCommentersTimeout.current = setTimeout(() => {
        setShowHoverCommenters(true);
      }, 500);
    }
  };

  const handleMouseLeaveCommenters = () => {
    clearTimeout(hoverCommentersTimeout.current);
    setShowHoverCommenters(false);
  };

  return (
    <div className="space-y-4">
      {/* Thống kê lượt thích và bình luận */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-2">
          {/* Hiển thị số lượt thích với icon trái tim */}
          {likeCount > 0 && (
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors relative"
              onClick={onShowLikers}
              onMouseEnter={handleMouseEnterLikers}
              onMouseLeave={handleMouseLeaveLikers}
            >
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <FaHeart className="text-white text-xs" />
              </div>
              <span>{likeCount} {likeCount === 1 ? 'lượt thích' : 'lượt thích'}</span>
              {/* Tooltip hover danh sách người đã thích */}
              {showHoverLikers && hoverLikers.length > 0 && (
                <div className="absolute bottom-8 left-0 bg-black text-white p-2 rounded-lg text-xs whitespace-nowrap z-10">
                  {hoverLikers.slice(0, 3).map(user => user.fullName || user.username).join(', ')}
                  {hoverLikers.length > 3 && ` và ${hoverLikers.length - 3} người khác`}
                </div>
              )}
            </div>
          )}
          {/* Hiển thị số bình luận với tooltip */}
          {commentCount > 0 && (
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors relative"
              onClick={onShowComments}
              onMouseEnter={handleMouseEnterCommenters}
              onMouseLeave={handleMouseLeaveCommenters}
            >
              <span>{commentCount} bình luận</span>
              {/* Tooltip hover danh sách người đã bình luận */}
              {showHoverCommenters && commenters.length > 0 && (
                <div className="absolute bottom-8 right-0 bg-black text-white p-2 rounded-lg text-xs whitespace-nowrap z-10">
                  {commenters.slice(0, 3).map(user => user.fullName || user.username).join(', ')}
                  {commenters.length > 3 && ` và ${commenters.length - 3} người khác`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Các nút hành động: Like, Bình luận */}
      <div className="flex items-center gap-4">
        {/* Nút Like */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            isLiked
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        >
          {/* Loading khi đang xử lý like */}
          {isLiking ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          ) : (
            <motion.div
              animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Icon trái tim khi đã thích, icon rỗng khi chưa thích */}
              {isLiked ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart />
              )}
            </motion.div>
          )}
          <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
        </motion.button>
        {/* Nút Bình luận */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onShowComments}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-all duration-300 hover:shadow-md"
        >
          <FaComment />
          <span>Bình luận</span>
        </motion.button>
      </div>
      {/* Modal danh sách người đã thích */}
      {likersModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-96 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Những người đã thích</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {/* Loading khi đang lấy danh sách người thích */}
              {loadingLikers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : likers.length > 0 ? (
                <div className="space-y-3">
                  {likers.map((user, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <img
                        src={user.avatar || "https://via.placeholder.com/40"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border-2 border-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{user.fullName || user.username}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có ai thích bài viết này
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PostActions; 