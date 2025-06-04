import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaThumbsUp, FaComment, FaRegThumbsUp, FaRegCommentDots, FaEdit, FaTrash, FaRegImage } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import CommentForm from './comment/CommentForm';
import CommentModal from './comment/CommentModal';
import CommentList from './comment/CommentList';

const FbCommentItem = ({
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
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

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
    if (!showReplies) {
      console.log('Click xem reply cho', comment._id);
      fetchReplies(comment._id);
    }
    setShowReplies(!showReplies);
  };

  useEffect(() => {
    if (showRepliesMap && comment && showRepliesMap[comment._id]) {
      console.log('Rendering replies for', comment._id, replies);
    }
  }, [showRepliesMap, comment, replies]);

  return (
    <div className={`flex items-start gap-2 mb-4 ${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <img src={comment.userID?.avatar || 'https://via.placeholder.com/32'} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
      <div className="flex-1">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-semibold text-base text-gray-800">{comment.userID?.fullName || comment.userID?.username || 'Anonymous'}</span>
              <span className="text-xs text-gray-400 ml-2">{comment.createdAt ? `${Math.floor((new Date() - new Date(comment.createdAt)) / (1000 * 60 * 60 * 24))}d` : '0d'}</span>
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
        {comment.replyCount > 0 && !showReplies && (
          <button className="text-blue-600 text-xs mt-1 ml-2 hover:underline font-medium transition" onClick={handleToggleReplies}>
            Xem tất cả {comment.replyCount} phản hồi
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
                <FbCommentItem
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

const CommentSection = ({ postId, totalCount, setTotalCount, onCommentsFetched }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [repliesMap, setRepliesMap] = useState({});
  const [showRepliesMap, setShowRepliesMap] = useState({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, commentId: null });
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeEditImage, setRemoveEditImage] = useState(false);
  const LIMIT = 10;

  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  useEffect(() => {
    if (postId) {
      setOffset(0);
      fetchComments(true);
      fetchPostLikes();
    }
  }, [postId]);

  const fetchComments = async (reset = false) => {
    setLoading(true);
    try {
      const response = await api.get(`/comments?postId=${postId}&offset=${reset ? 0 : offset}&limit=${LIMIT}`);
      if (response.data.success) {
        const newComments = response.data.data || [];
        setComments(reset ? newComments : [...comments, ...newComments]);
        setOffset(reset ? newComments.length : offset + newComments.length);
        setHasMore(newComments.length === LIMIT);
        const newRepliesMap = {};
        newComments.forEach((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            newRepliesMap[comment._id] = comment.replies;
          }
        });
        setRepliesMap((prev) => ({ ...prev, ...newRepliesMap }));
        if (onCommentsFetched) {
          onCommentsFetched(reset ? newComments : [...comments, ...newComments]);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (commentId, depth = 0, maxDepth = 3) => {
    if (depth >= maxDepth) return;
    setLoadingRepliesMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await api.get(`/comments/${commentId}/replies`);
      if (response.data.success) {
        const replies = response.data.data || [];
        setRepliesMap((prev) => ({ ...prev, [commentId]: replies }));
        setShowRepliesMap((prev) => ({ ...prev, [commentId]: true }));
        for (const reply of replies) {
          if (reply.replies && reply.replies.length > 0) {
            await fetchReplies(reply._id, depth + 1, maxDepth);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching replies:', error.response || error);
    }
    setLoadingRepliesMap((prev) => ({ ...prev, [commentId]: false }));
  };

  const fetchCommentCount = async () => {
    if (!setTotalCount) return;
    try {
      const response = await api.get(`/comments/count?postId=${postId}`);
      if (response.data.success) {
        setTotalCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
      setTotalCount(0);
    }
  };

  const fetchPostLikes = async () => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      if (response.data.success) {
        setLikeCount(response.data.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching post likes:', error);
      setLikeCount(0);
    }
  };

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    if (isSubmitting) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim() && !commentImage) {
      alert('Vui lòng nhập nội dung bình luận hoặc chọn ảnh');
      return;
    }
    if (!postId) {
      console.error('No postId provided');
      return;
    }
    setIsSubmitting(true);
    try {
      let response;
      if (!parentId && commentImage) {
        // Gửi form-data nếu có ảnh
        const formData = new FormData();
        formData.append('postId', postId);
        formData.append('content', content.trim());
        if (commentImage) formData.append('comment_image', commentImage);
        response = await api.post('/comments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Gửi bình thường nếu không có ảnh hoặc là reply
        const commentData = {
          postId,
          content: content.trim(),
          parentId: parentId,
        };
        response = await api.post('/comments', commentData);
      }
      if (response.data.success) {
        setNewComment('');
        setReplyContent('');
        setReplyingTo(null);
        setCommentImage(null);
        setCommentImagePreview(null);
        if (parentId) {
          if (showRepliesMap[parentId]) {
            // Nếu đang mở replies, thêm vào repliesMap và hiển thị ngay
            setRepliesMap((prev) => ({
              ...prev,
              [parentId]: [...(prev[parentId] || []), response.data.data],
            }));
            setShowRepliesMap((prev) => ({ ...prev, [parentId]: true }));
          } else {
            // Nếu chưa mở replies, chỉ tăng replyCount cho comment cha
            setComments((prev) => prev.map(c =>
              c._id === parentId
                ? { ...c, replyCount: (c.replyCount || 0) + 1 }
                : c
            ));
          }
        } else {
          setComments((prev) => [response.data.data, ...prev]);
        }
        fetchCommentCount();
      } else {
        alert('Không thể gửi bình luận');
      }
    } catch (error) {
      console.error('Error submitting comment:', error.response || error);
      alert(error.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    setEditImage(file);
    setRemoveEditImage(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setEditImagePreview(null);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim() && !editImage && !editImagePreview && !removeEditImage) {
      alert('Vui lòng nhập nội dung bình luận hoặc chọn ảnh');
      return;
    }
    setIsSubmitting(true);
    try {
      let response;
      if (editImage || removeEditImage) {
        // Gửi form-data nếu có ảnh mới hoặc xóa ảnh
        const formData = new FormData();
        formData.append('content', editContent.trim());
        if (editImage) formData.append('comment_image', editImage);
        if (removeEditImage) formData.append('remove_image', 'true');
        response = await api.put(`/comments/${commentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Gửi bình thường nếu chỉ sửa text
        response = await api.put(`/comments/${commentId}`, { content: editContent.trim() });
      }
      if (response.data.success) {
        setComments((prev) => {
          const updateComments = (comments) =>
            comments.map((c) =>
              c._id === commentId
                ? { ...c, content: editContent.trim(), comment_image: removeEditImage ? null : (editImagePreview ? editImagePreview : c.comment_image) }
                : c.replies
                ? { ...c, replies: updateComments(c.replies) }
                : c
            );
          return updateComments(prev);
        });
        setRepliesMap((prev) => {
          const updateReplies = (replies) =>
            replies.map((r) =>
              r._id === commentId
                ? { ...r, content: editContent.trim(), comment_image: removeEditImage ? null : (editImagePreview ? editImagePreview : r.comment_image) }
                : r.replies
                ? { ...r, replies: updateReplies(r.replies) }
                : r
            );
          const newRepliesMap = {};
          Object.keys(prev).forEach((parentId) => {
            newRepliesMap[parentId] = updateReplies(prev[parentId]);
          });
          return newRepliesMap;
        });
        setEditingComment(null);
        setEditContent('');
        setEditImage(null);
        setEditImagePreview(null);
        setRemoveEditImage(false);
        fetchCommentCount();
      } else {
        alert('Không thể cập nhật bình luận');
      }
    } catch (error) {
      console.error('Error updating comment:', error.response || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeleteModal({ open: true, commentId });
  };

  const confirmDeleteComment = async () => {
    const commentId = deleteModal.commentId;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/comments/${commentId}`);
      if (response.data.success) {
        setComments((prev) => {
          const removeComment = (comments) =>
            comments
              .filter((c) => c._id !== commentId)
              .map((c) => ({
                ...c,
                replies: c.replies ? removeComment(c.replies) : [],
              }));
          return removeComment(prev);
        });
        setRepliesMap((prev) => {
          const newRepliesMap = {};
          Object.keys(prev).forEach((parentId) => {
            newRepliesMap[parentId] = prev[parentId]
              .filter((r) => r._id !== commentId)
              .map((r) => ({
                ...r,
                replies: r.replies ? r.replies.filter((r2) => r2._id !== commentId) : [],
              }));
          });
          return newRepliesMap;
        });
        setShowRepliesMap((prev) => {
          const newShowRepliesMap = { ...prev };
          delete newShowRepliesMap[commentId];
          return newShowRepliesMap;
        });
        fetchCommentCount();
      } else {
        alert('Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error.response || error);
    } finally {
      setIsSubmitting(false);
      setDeleteModal({ open: false, commentId: null });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  const handleLikePost = () => {
    setLikeCount(likeCount + 1);
    // Có thể thêm API call để lưu lượt thích
  };

  // Khi chọn ảnh, tạo preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setCommentImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCommentImagePreview(null);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <CommentModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, commentId: null })}
        onConfirm={confirmDeleteComment}
        isSubmitting={isSubmitting}
      />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Bình luận</h2>
      </div>
      <CommentForm
        user={user}
        newComment={newComment}
        setNewComment={setNewComment}
        handleSubmitComment={handleSubmitComment}
        handleKeyDown={handleKeyDown}
        commentImage={commentImage}
        commentImagePreview={commentImagePreview}
        handleImageChange={handleImageChange}
        setCommentImage={setCommentImage}
        setCommentImagePreview={setCommentImagePreview}
        isSubmitting={isSubmitting}
      />
      {/* Hiệu ứng loading khi gửi bình luận mới */}
      {isSubmitting && !replyingTo && (
        <div className="flex items-center gap-2 mt-2 text-blue-500 text-sm">
          <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"></span>
          Đang xử lý bình luận...
        </div>
      )}
      <CommentList
        comments={comments}
        loading={loading}
        hasMore={hasMore}
        fetchComments={fetchComments}
        user={user}
        onReply={(commentId) => {
          setReplyingTo(prev => prev === commentId ? null : commentId);
          setReplyContent('');
        }}
        onEdit={(c) => {
          setEditingComment(c._id);
          setEditContent(c.content);
          setEditImage(null);
          setEditImagePreview(null);
          setRemoveEditImage(false);
        }}
        onDelete={handleDeleteComment}
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
        showRepliesMap={showRepliesMap}
        repliesMap={repliesMap}
        loadingRepliesMap={loadingRepliesMap}
        isSubmitting={isSubmitting}
        handleSubmitComment={handleSubmitComment}
        editImage={editImage}
        setEditImage={setEditImage}
        editImagePreview={editImagePreview}
        setEditImagePreview={setEditImagePreview}
        removeEditImage={removeEditImage}
        setRemoveEditImage={setRemoveEditImage}
        handleEditImageChange={handleEditImageChange}
        setEditingComment={setEditingComment}
      />
    </div>
  );
};

export default CommentSection;