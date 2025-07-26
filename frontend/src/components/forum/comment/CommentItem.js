import React, { useState, useEffect, useRef } from 'react';
import { FaRegThumbsUp, FaRegCommentDots, FaEdit, FaTrash } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

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
  setEditingComment,
  // Thêm prop để nhận event realtime nếu cần
  realtimeParentId
}) => {
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const prevShowReplies = useRef(false);

  // Khi showReplies chuyển từ false sang true, luôn fetch lại replies
  useEffect(() => {
    if (showReplies && !prevShowReplies.current) {
      fetchReplies(comment._id);
    }
    prevShowReplies.current = showReplies;
  }, [showReplies, fetchReplies, comment._id]);

  // Nếu nhận event realtime (realtimeParentId === comment._id) và đang mở replies, fetch lại replies
  useEffect(() => {
    if (realtimeParentId === comment._id && showReplies) {
      fetchReplies(comment._id);
    }
  }, [realtimeParentId, showReplies, fetchReplies, comment._id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e, comment._id);
    }
  };

  const handleLike = () => {
    setLikeCount(likeCount + 1);
    // Có thể thêm API call để lưu lượt thích
  };

  const handleToggleReplies = () => {
    setShowReplies((prev) => !prev);
  };

  return (
    <div className={`flex items-start gap-2 mb-4 ${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <img src={comment.userID?.avatar || 'https://via.placeholder.com/32'} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
      <div className="flex-1">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 relative">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-semibold text-base text-gray-800">{comment.userID?.fullName || comment.userID?.username || 'Anonymous'}</span>
              <span className="text-xs text-gray-400 ml-2">{/* thời gian */}</span>
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
              <div className="text-sm whitespace-pre-line break-words text-gray-800">{comment.content}</div>
              {comment.comment_image && (
                <img src={comment.comment_image} alt="comment" className="mt-2 max-h-60 rounded-lg border shadow" />
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs ml-2">
          <button onClick={handleLike} className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition">
            <FaRegThumbsUp className="text-base"/> Thích {likeCount > 0 && <span>({likeCount})</span>}
          </button>
          <button
            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition"
            onClick={() => onReply(comment._id)}
          >
            <FaRegCommentDots className="text-base"/> Phản hồi
          </button>
        </div>
        {((Array.isArray(replies) && replies.length > 0) || comment.replyCount > 0) && !showReplies && (
          <button className="text-blue-600 text-xs mt-1 ml-2 hover:underline font-medium transition" onClick={handleToggleReplies}>
            Xem tất cả {(Array.isArray(replies) && replies.length > 0) ? replies.length : comment.replyCount} phản hồi
          </button>
        )}
        {replyingTo === comment._id && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitComment(e, comment._id); }} className="mt-2 relative">
            <textarea
              className="w-full rounded-xl border border-blue-300 p-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
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
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  editingComment={editingComment}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  handleEditComment={handleEditComment}
                  handleCancelEdit={handleCancelEdit}
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
                  realtimeParentId={realtimeParentId}
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