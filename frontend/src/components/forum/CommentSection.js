import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CommentForm from './comment/CommentForm';
import DeleteCommentModal from './comment/DeleteCommentModal';
import CommentList from './comment/CommentList';
import useCommentFetch from './comment/useCommentFetch';
import useCommentActions from './comment/useCommentActions';
import { useSocket } from '../../context/SocketContext';

const CommentSection = ({ postId, totalCount, setTotalCount, onCommentsFetched }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  // Custom hook quản lý fetch, state
  const fetchState = useCommentFetch(postId, setTotalCount, onCommentsFetched);
  // Custom hook quản lý action (submit, edit, xóa, upload)
  const actionState = useCommentActions({
    postId,
    comments: fetchState.comments,
    setComments: fetchState.setComments,
    setTotalCount,
    showRepliesMap: fetchState.showRepliesMap,
    setShowRepliesMap: fetchState.setShowRepliesMap,
    repliesMap: fetchState.repliesMap,
    setRepliesMap: fetchState.setRepliesMap,
    fetchReplies: fetchState.fetchReplies,
    fetchCommentCount: fetchState.fetchCommentCount,
  });

  // Lắng nghe socket event comment_replied để realtime reply
  const [realtimeParentId, setRealtimeParentId] = React.useState(null);
  React.useEffect(() => {
    if (socket) {
      const handleCommentReplied = (data) => {
        if (data && data.postId === postId) {
          setRealtimeParentId(data.parentId);
          // Nếu đang mở replies của comment cha, fetch lại replies cho comment cha
          if (fetchState.showRepliesMap[data.parentId]) {
            fetchState.fetchReplies(data.parentId);
          }
          // Nếu đang ở cấp 1, vẫn nên fetch lại top-level để cập nhật replyCount
          fetchState.fetchComments(true);
        }
      };
      socket.on('comment_replied', handleCommentReplied);
      return () => {
        socket.off('comment_replied', handleCommentReplied);
      };
    }
  }, [socket, postId, fetchState]);

  // Render UI, truyền state/hàm vào các component con
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <DeleteCommentModal
        open={actionState.deleteModal.open}
        onClose={() => actionState.setDeleteModal({ open: false, commentId: null })}
        onConfirm={actionState.confirmDeleteComment}
        isSubmitting={actionState.isSubmitting}
      />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Bình luận</h2>
      </div>
      <CommentForm
        user={user}
        newComment={actionState.newComment}
        setNewComment={actionState.setNewComment}
        handleSubmitComment={actionState.handleSubmitComment}
        handleKeyDown={actionState.handleKeyDown}
        commentImage={actionState.commentImage}
        commentImagePreview={actionState.commentImagePreview}
        handleImageChange={actionState.handleImageChange}
        setCommentImage={actionState.setCommentImage}
        setCommentImagePreview={actionState.setCommentImagePreview}
        isSubmitting={actionState.isSubmitting}
      />
      {/* Hiệu ứng loading khi gửi bình luận mới */}
      {actionState.isSubmitting && !actionState.replyingTo && (
        <div className="flex items-center gap-2 mt-2 text-blue-500 text-sm">
          <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full inline-block"></span>
          Đang xử lý bình luận...
        </div>
      )}
      <CommentList
        comments={fetchState.comments}
        loading={fetchState.loading}
        hasMore={fetchState.hasMore}
        fetchComments={fetchState.fetchComments}
        user={user}
        onReply={(commentId) => {
          actionState.setReplyingTo(prev => prev === commentId ? null : commentId);
          actionState.setReplyContent('');
        }}
        onEdit={(c) => {
          actionState.setEditingComment(c._id);
          actionState.setEditContent(c.content);
          actionState.setEditImage(null);
          actionState.setEditImagePreview(null);
          actionState.setRemoveEditImage(false);
        }}
        onDelete={actionState.handleDeleteComment}
        replyingTo={actionState.replyingTo}
        replyContent={actionState.replyContent}
        setReplyContent={actionState.setReplyContent}
        editingComment={actionState.editingComment}
        editContent={actionState.editContent}
        setEditContent={actionState.setEditContent}
        handleEditComment={actionState.handleEditComment}
        handleCancelEdit={() => {
          actionState.setEditingComment(null);
          actionState.setEditImage(null);
          actionState.setEditImagePreview(null);
          actionState.setRemoveEditImage(false);
        }}
        fetchReplies={fetchState.fetchReplies}
        showRepliesMap={fetchState.showRepliesMap}
        repliesMap={fetchState.repliesMap}
        loadingRepliesMap={fetchState.loadingRepliesMap}
        isSubmitting={actionState.isSubmitting}
        handleSubmitComment={actionState.handleSubmitComment}
        editImage={actionState.editImage}
        setEditImage={actionState.setEditImage}
        editImagePreview={actionState.editImagePreview}
        setEditImagePreview={actionState.setEditImagePreview}
        removeEditImage={actionState.removeEditImage}
        setRemoveEditImage={actionState.setRemoveEditImage}
        handleEditImageChange={actionState.handleEditImageChange}
        setEditingComment={actionState.setEditingComment}
        realtimeParentId={realtimeParentId}
      />
    </div>
  );
};

export default CommentSection;