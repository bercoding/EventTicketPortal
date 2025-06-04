import React from 'react';
import CommentItem from './CommentItem';

const CommentList = ({
  comments = [],
  loading,
  hasMore,
  fetchComments,
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
  showRepliesMap,
  repliesMap,
  loadingRepliesMap,
  isSubmitting,
  handleSubmitComment,
  editImage,
  setEditImage,
  editImagePreview,
  setEditImagePreview,
  removeEditImage,
  setRemoveEditImage,
  handleEditImageChange,
  setEditingComment
}) => (
  <div>
    {comments.length === 0 && !loading && (
      <div className="text-center text-gray-500 py-4">
        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
      </div>
    )}
    {comments.map((comment) => (
      <CommentItem
        key={comment._id}
        comment={comment}
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
        replies={showRepliesMap[comment._id] ? (repliesMap[comment._id] || []) : []}
        loadingReplies={!!loadingRepliesMap[comment._id]}
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
    ))}
    {hasMore && (
      <div className="flex justify-center mt-4">
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
          onClick={() => fetchComments(false)}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
        </button>
      </div>
    )}
    {loading && (
      <div className="text-center text-gray-500 py-4">
        Đang tải bình luận...
      </div>
    )}
  </div>
);

export default CommentList; 