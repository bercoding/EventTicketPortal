import { useState } from 'react';
import axios from 'axios';

export default function useCommentActions({
  postId,
  comments,
  setComments,
  setTotalCount,
  showRepliesMap,
  setShowRepliesMap,
  repliesMap,
  setRepliesMap,
  fetchReplies,
  fetchCommentCount,
}) {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, commentId: null });
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeEditImage, setRemoveEditImage] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  // Submit comment or reply
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
            // Nếu chưa mở replies, tự động mở và fetch lại replies cho mọi cấp
            setShowRepliesMap((prev) => ({ ...prev, [parentId]: true }));
            fetchReplies(parentId, 0, 10); // Cho phép lồng nhiều cấp hơn nếu cần
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

  // Edit image change
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

  // Edit comment
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

  // Delete comment (open modal)
  const handleDeleteComment = async (commentId) => {
    setDeleteModal({ open: true, commentId });
  };

  // Confirm delete comment
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

  // Xử lý enter để submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  return {
    newComment, setNewComment,
    editingComment, setEditingComment,
    editContent, setEditContent,
    isSubmitting, setIsSubmitting,
    replyingTo, setReplyingTo,
    replyContent, setReplyContent,
    deleteModal, setDeleteModal,
    commentImage, setCommentImage,
    commentImagePreview, setCommentImagePreview,
    editImage, setEditImage,
    editImagePreview, setEditImagePreview,
    removeEditImage, setRemoveEditImage,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    confirmDeleteComment,
    handleEditImageChange,
    handleImageChange,
    handleKeyDown,
  };
} 