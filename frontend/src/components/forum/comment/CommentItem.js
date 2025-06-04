import React, { useState, useEffect, useRef } from 'react';
import { FaThumbsUp, FaComment, FaRegThumbsUp, FaRegCommentDots, FaEdit, FaTrash } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { commentAPI } from '../../../services/api';

const CommentItem = ({
  comment,
  user,
  onReply,
  onEdit,
  onDelete,
  replyingTo,
  replyContent,
  setReplyContent,
  editingComment,
  editContent,
  setEditContent,
  handleEditComment,
  handleCancelEdit,
  fetchReplies,
  replies,
  loadingReplies,
  showRepliesMap,
  repliesMap,
  loadingRepliesMap,
  isSubmitting,
  handleSubmitComment,
  level = 0,
  editImage,
  setEditImage,
  editImagePreview,
  setEditImagePreview,
  removeEditImage,
  setRemoveEditImage,
  handleEditImageChange,
  setEditingComment
}) => {
  const [likeCount, setLikeCount] = useState(comment.likesCount || comment.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [likersModalOpen, setLikersModalOpen] = useState(false);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [hoverLikers, setHoverLikers] = useState([]);
  const [showHoverLikers, setShowHoverLikers] = useState(false);
  const hoverTimeout = useRef();
  const modalRef = useRef();

  useEffect(() => {
    // Kiểm tra user đã like chưa
    if (user && comment.likes) {
      setIsLiked(comment.likes.some(like => like.userId?._id === user._id || like.userId === user._id));
    } else {
      setIsLiked(false);
    }
    setLikeCount(comment.likesCount || comment.likeCount || (comment.likes ? comment.likes.length : 0));
  }, [comment.likes, comment.likesCount, comment.likeCount, user]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await commentAPI.likeComment(comment._id);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikeCount(res.data.likesCount);
      }
    } catch (err) {
      // Có thể show toast lỗi
    }
  };

  const handleShowLikers = async () => {
    setLikersModalOpen(true);
    setLoadingLikers(true);
    try {
      const res = await commentAPI.getCommentLikes(comment._id);
      if (res.data.success) {
        setLikers(res.data.users || []);
      }
    } catch (err) {
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleHoverLikers = async () => {
    try {
      const res = await commentAPI.getCommentLikes(comment._id);
      if (res.data.success) {
        setHoverLikers((res.data.users || []).slice(0, 10));
      }
    } catch {
      setHoverLikers([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e, comment._id);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies) {
      fetchReplies(comment._id);
    }
    setShowReplies(!showReplies);
  };

  useEffect(() => {
    if (showRepliesMap && comment && showRepliesMap[comment._id]) {
      // console.log('Rendering replies for', comment._id, replies);
    }
  }, [showRepliesMap, comment, replies]);

  useEffect(() => {
    if (!likersModalOpen) return;
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setLikersModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [likersModalOpen]);

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} giây`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} phút`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <div className={`flex items-start gap-2 mb-4 ${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <img src={comment.userID?.avatar || 'https://via.placeholder.com/32'} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
      <div className="flex-1">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 relative">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-semibold text-base text-gray-800">{comment.userID?.fullName || comment.userID?.username || 'Anonymous'}</span>
              <span className="text-xs text-gray-400 ml-2">{getTimeAgo(comment.createdAt)}</span>
            </div>
            {user && (comment.userID?._id === user.id || comment.userID?._id === user._id) && (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-gray-100 transition" aria-label="Tùy chọn">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 bg-white border rounded-xl shadow-lg z-20 min-w-[120px] py-1 animate-fade-in">
                    <button onClick={() => { setShowMenu(false); onEdit(comment); }} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-lg transition"><FaEdit className="text-blue-500"/>Sửa</button>
                    <button onClick={() => { setShowMenu(false); onDelete(comment._id); }} className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-lg transition text-red-600"><FaTrash/>Xóa</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {editingComment === comment._id ? (
            <div>
              <textarea
                className="w-full rounded-xl border border-blue-300 p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`edit-image-input-${comment._id}`}
                  onChange={handleEditImageChange}
                />
                <label htmlFor={`edit-image-input-${comment._id}`} className="cursor-pointer px-2 py-1 rounded bg-gray-100 hover:bg-blue-100 text-blue-600 text-xs font-semibold">
                  Đổi ảnh
                </label>
                {(editImagePreview || (comment.comment_image && !removeEditImage)) && (
                  <div className="relative">
                    <img src={editImagePreview || comment.comment_image} alt="edit-preview" className="w-16 h-16 object-cover rounded border" />
                    <button type="button" onClick={() => { setEditImage(null); setEditImagePreview(null); setRemoveEditImage(true); }}
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600">
                      &times;
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => handleEditComment(comment._id)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-600 transition">Lưu</button>
                <button onClick={handleCancelEdit} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">Hủy</button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="text-sm whitespace-pre-line break-words text-gray-800">{comment.content}</div>
                {comment.comment_image && (
                  <img src={comment.comment_image} alt="comment" className="mt-2 max-h-60 rounded-lg border shadow" />
                )}
                <div
                  className="absolute -bottom-4 right-2 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow border text-xs cursor-pointer select-none"
                  style={{ minHeight: 22 }}
                  onClick={handleShowLikers}
                  onMouseEnter={() => {
                    setShowHoverLikers(true);
                    handleHoverLikers();
                  }}
                  onMouseLeave={() => {
                    hoverTimeout.current = setTimeout(() => setShowHoverLikers(false), 200);
                  }}
                >
                  <span className={`text-base ${isLiked ? 'text-blue-600' : 'text-gray-400'}`}><FaThumbsUp /></span>
                  <span className="font-semibold text-gray-700">{likeCount > 0 ? likeCount : ''}</span>
                  {showHoverLikers && hoverLikers.length > 0 && (
                    <div
                      className="absolute bottom-full right-0 mb-2 w-56 bg-white border rounded-lg shadow-lg z-50 p-2 text-xs"
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
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs ml-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 font-semibold px-2 py-1 rounded transition ${isLiked ? 'text-blue-600' : 'hover:text-blue-600'}`}
            type="button"
          >
            <FaThumbsUp /> Thích
          </button>
          <button
            className="flex items-center gap-1 font-semibold px-2 py-1 rounded hover:text-blue-600"
            onClick={() => onReply(comment._id)}
            type="button"
          >
            <FaRegCommentDots className="text-base"/> Phản hồi
          </button>
        </div>
        {/* Modal danh sách người đã like comment */}
        {likersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
              <button onClick={() => setLikersModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
              <h2 className="text-lg font-bold text-center mb-2">Những người đã thích bình luận này</h2>
              {loadingLikers ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {likers.length === 0 && <li className="py-4 text-center text-gray-500">Chưa có ai thích bình luận này</li>}
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
        {comment.replyCount > 0 && !showReplies && (
          <button className="text-blue-600 text-xs mt-1 ml-2 hover:underline font-medium transition" onClick={handleToggleReplies}>
            Xem tất cả {comment.replyCount} phản hồi
          </button>
        )}
        {replyingTo === comment._id && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitComment(e, comment._id); }} className="mt-2 relative">
            <textarea
              className="w-full rounded-xl border border-blue-300 p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Viết phản hồi..."
              rows="1"
            />
            <button
              type="submit"
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 ${isSubmitting || !replyContent.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-800'}`}
              disabled={isSubmitting || !replyContent.trim()}
            >
              <IoSend size={16} />
            </button>
          </form>
        )}
        {showReplies && (
          <div className="mt-2">
            {loadingReplies ? (
              <span className="text-xs text-gray-400">Đang tải...</span>
            ) : (
              (replies || []).map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  user={user}
                  onReply={(commentId) => setReplyContent(reply._id)}
                  onEdit={(c) => {
                    setEditingComment(c._id);
                    setEditContent(c.content);
                    setEditImage(null);
                    setEditImagePreview(null);
                    setRemoveEditImage(false);
                  }}
                  onDelete={onDelete}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  editingComment={editingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  handleEditComment={handleEditComment}
                  handleCancelEdit={() => {
                    setEditingComment(null);
                    setEditImage(null);
                    setEditImagePreview(null);
                    setRemoveEditImage(false);
                  }}
                  fetchReplies={fetchReplies}
                  replies={showRepliesMap[reply._id] ? (repliesMap[reply._id] || []) : []}
                  loadingReplies={!!loadingRepliesMap[reply._id]}
                  showRepliesMap={showRepliesMap}
                  repliesMap={repliesMap}
                  loadingRepliesMap={loadingRepliesMap}
                  isSubmitting={isSubmitting}
                  handleSubmitComment={handleSubmitComment}
                  level={level + 1}
                  editImage={editImage}
                  setEditImage={setEditImage}
                  editImagePreview={editImagePreview}
                  setEditImagePreview={setEditImagePreview}
                  removeEditImage={removeEditImage}
                  setRemoveEditImage={setRemoveEditImage}
                  handleEditImageChange={handleEditImageChange}
                  setEditingComment={setEditingComment}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem; 