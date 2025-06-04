import React, { useRef, useEffect, useState } from 'react';
import { FaThumbsUp, FaComment } from 'react-icons/fa';
import { postAPI } from '../../services/api';

const PostActions = ({
  isLiked,
  likeCount,
  onLike,
  onShowLikers,
  commentCount,
  onShowComments,
  likersModalOpen,
  likers,
  onCloseLikersModal,
  loadingLikers,
  postId,
  commenters = []
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

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
        <button
          className="flex items-center gap-1 hover:underline focus:outline-none relative"
          onClick={onShowLikers}
          onMouseEnter={() => {
            setShowHoverLikers(true);
            handleHoverLikers();
          }}
          onMouseLeave={() => {
            hoverTimeout.current = setTimeout(() => setShowHoverLikers(false), 200);
          }}
        >
          <span role="img" aria-label="like">👍</span>
          <span>{likeCount} lượt thích</span>
          {showHoverLikers && hoverLikers.length > 0 && (
            <div
              className="absolute bottom-full left-0 mb-2 w-56 bg-white border rounded-lg shadow-lg z-50 p-2 text-xs"
              onMouseEnter={() => {
                clearTimeout(hoverTimeout.current);
                setShowHoverLikers(true);
              }}
              onMouseLeave={() => setShowHoverLikers(false)}
            >
              <div className="font-semibold mb-1">Đã thích:</div>
              <ul>
                {hoverLikers.map(user => (
                  <li key={user._id} className="flex items-center gap-2 py-1">
                    <img src={user.avatar || 'https://via.placeholder.com/24'} alt="avatar" className="w-5 h-5 rounded-full object-cover border" />
                    <span>{user.fullName || user.username}</span>
                  </li>
                ))}
                {likeCount > 10 && <li className="text-gray-400 italic">...và còn nữa, click để xem tất cả</li>}
              </ul>
            </div>
          )}
        </button>
        <span className="flex items-center gap-1">
          <FaComment className="text-gray-400" />
          <span
            className="relative hover:underline cursor-pointer"
            onMouseEnter={() => setShowHoverCommenters(true)}
            onMouseLeave={() => {
              hoverCommentersTimeout.current = setTimeout(() => setShowHoverCommenters(false), 200);
            }}
          >
            {commentCount} bình luận
            {showHoverCommenters && commenters.length > 0 && (
              <div
                className="absolute bottom-full left-0 mb-2 w-56 bg-white border rounded-lg shadow-lg z-50 p-2 text-xs"
                onMouseEnter={() => {
                  clearTimeout(hoverCommentersTimeout.current);
                  setShowHoverCommenters(true);
                }}
                onMouseLeave={() => setShowHoverCommenters(false)}
              >
                <div className="font-semibold mb-1">Đã bình luận:</div>
                <ul>
                  {commenters.slice(0, 10).map(user => (
                    <li key={user._id} className="flex items-center gap-2 py-1">
                      <img src={user.avatar || 'https://via.placeholder.com/24'} alt="avatar" className="w-5 h-5 rounded-full object-cover border" />
                      <span>{user.fullName || user.username}</span>
                    </li>
                  ))}
                  {commentCount > 10 && <li className="text-gray-400 italic">...và còn nữa</li>}
                </ul>
              </div>
            )}
          </span>
        </span>
      </div>
      <div className="flex justify-around text-gray-500 text-base py-2 border-t">
        <button
          onClick={onLike}
          className={`flex items-center gap-1 font-semibold px-4 py-1 rounded transition ${isLiked ? 'text-blue-600' : 'hover:text-blue-600'}`}
        >
          <FaThumbsUp /> Thích
        </button>
        <button
          onClick={onShowComments}
          className="flex items-center gap-1 font-semibold px-4 py-1 rounded hover:text-blue-600"
        >
          <FaComment /> Bình luận
        </button>
      </div>
      {/* Modal danh sách người đã like */}
      {likersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div ref={modalRef} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
            <button onClick={onCloseLikersModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
            <h2 className="text-lg font-bold text-center mb-2">Những người đã thích bài viết</h2>
            {loadingLikers ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {likers.length === 0 && <li className="py-4 text-center text-gray-500">Chưa có ai thích bài viết này</li>}
                {likers.map((user) => (
                  <li key={user._id} className="flex items-center gap-3 py-3">
                    <img src={user.avatar || 'https://via.placeholder.com/32'} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                    <span className="font-medium text-gray-800">{user.fullName || user.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostActions; 