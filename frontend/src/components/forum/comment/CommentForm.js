import React from 'react';
import { FaRegImage } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

const CommentForm = ({
  user,
  newComment,
  setNewComment,
  handleSubmitComment,
  handleKeyDown,
  commentImage,
  commentImagePreview,
  handleImageChange,
  setCommentImage,
  setCommentImagePreview,
  isSubmitting
}) => (
  <div className="flex items-center gap-2 mb-4">
    <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full" />
    <form onSubmit={handleSubmitComment} className="flex-1 relative flex items-center">
      <textarea
        className="w-full rounded-lg border border-gray-300 p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        rows="1"
        placeholder="Viết bình luận..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="comment-image-input"
        onChange={handleImageChange}
      />
      <label htmlFor="comment-image-input" className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-blue-500">
        <FaRegImage size={20} />
      </label>
      {commentImagePreview && (
        <div className="relative ml-2">
          <img src={commentImagePreview} alt="preview" className="w-16 h-16 object-cover rounded border" />
          <button type="button" onClick={() => { setCommentImage(null); setCommentImagePreview(null); }}
            className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600">
            &times;
          </button>
        </div>
      )}
      <button
        type="submit"
        className={`ml-2 text-blue-600 ${isSubmitting || (!newComment.trim() && !commentImage) ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-800'}`}
        disabled={isSubmitting || (!newComment.trim() && !commentImage)}
      >
        <IoSend size={16} />
      </button>
    </form>
  </div>
);

export default CommentForm; 