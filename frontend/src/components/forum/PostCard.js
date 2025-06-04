import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import ImageViewer from './ImageViewer';
import CommentSection from './CommentSection';
import { postAPI } from '../../services/api';

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
  const [showViewer, setShowViewer] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [likeCount, setLikeCount] = useState(post.likesCount || post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [likersModalOpen, setLikersModalOpen] = useState(false);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentSectionKey, setCommentSectionKey] = useState(Date.now());
  const [commenters, setCommenters] = useState([]);
  const optionsRef = useRef(null);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/comments/count?postId=${post._id}`);
        const data = await res.json();
        if (data.success) setCommentCount(data.data.count);
      } catch (e) {
        setCommentCount(0);
      }
    };
    fetchCommentCount();
  }, [post._id]);

  useEffect(() => {
    // Kiểm tra user đã like chưa
    if (user && post.likes) {
      setIsLiked(post.likes.some(like => like.userId?._id === user._id || like.userId === user._id));
    } else {
      setIsLiked(false);
    }
    setLikeCount(post.likesCount || post.likes?.length || 0);
  }, [post.likes, post.likesCount, user]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedImage(null);
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await postAPI.likePost(post._id);
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
      const res = await postAPI.getPostLikes(post._id);
      if (res.data.success) {
        setLikers(res.data.users || []);
      }
    } catch (err) {
      setLikers([]);
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleShowComments = () => {
    setShowComments((prev) => {
      const next = !prev;
      if (next) {
        setCommentSectionKey(Date.now());
      }
      return next;
    });
  };

  const handleUpdateCommenters = (comments) => {
    const users = [];
    const userIds = new Set();
    comments.forEach(c => {
      if (c.userID && !userIds.has(c.userID._id)) {
        users.push(c.userID);
        userIds.add(c.userID._id);
      }
    });
    setCommenters(users);
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
        <PostHeader
          post={post}
          user={user}
          showOptions={showOptions}
          onToggleOptions={onToggleOptions}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
          optionsRef={optionsRef}
        />
      </div>
      {/* Content */}
      <div className="p-4">
        <PostContent post={post} handleImageClick={handleImageClick} />
        <PostActions
          isLiked={isLiked}
          likeCount={likeCount}
          onLike={handleLike}
          onShowLikers={handleShowLikers}
          commentCount={commentCount}
          onShowComments={handleShowComments}
          likersModalOpen={likersModalOpen}
          likers={likers}
          onCloseLikersModal={() => setLikersModalOpen(false)}
          loadingLikers={loadingLikers}
          postId={post._id}
          commenters={commenters}
        />
        {/* Comment Section chỉ hiện khi showComments = true */}
        {showComments && (
          <div className="mt-2">
            <CommentSection
              key={commentSectionKey}
              postId={post._id}
              totalCount={commentCount}
              setTotalCount={setCommentCount}
              onCommentsFetched={handleUpdateCommenters}
            />
          </div>
        )}
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