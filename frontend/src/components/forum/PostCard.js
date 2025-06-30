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
  const [isLiking, setIsLiking] = useState(false);
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
      setIsLiked(post.likes.some(like => {
        const likeUserId = like.userId?._id || like.userId;
        return likeUserId === user._id;
      }));
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
    if (!user || isLiking) return;
    
    setIsLiking(true);
    
    // Optimistic update
    const previousLikeState = isLiked;
    const previousLikeCount = likeCount;
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      console.log('Sending like request for post:', post._id);
      const res = await postAPI.likePost(post._id);
      console.log('Like response:', res.data);
      
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikeCount(res.data.likesCount);
      } else {
        // Revert optimistic update if failed
        setIsLiked(previousLikeState);
        setLikeCount(previousLikeCount);
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert optimistic update
      setIsLiked(previousLikeState);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLiking(false);
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
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-50">
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
      <div className="p-6">
        <PostContent post={post} handleImageClick={handleImageClick} />
        
        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-50">
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
            isLiking={isLiking}
        />
        </div>
        
        {/* Comment Section */}
        {showComments && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-4 border-t border-gray-50"
          >
            <CommentSection
              key={commentSectionKey}
              postId={post._id}
              totalCount={commentCount}
              setTotalCount={setCommentCount}
              onCommentsFetched={handleUpdateCommenters}
            />
          </motion.div>
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