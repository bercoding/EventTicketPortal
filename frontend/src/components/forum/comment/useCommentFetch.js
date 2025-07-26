import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const LIMIT = 10;

export default function useCommentFetch(postId, setTotalCount, onCommentsFetched) {
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [repliesMap, setRepliesMap] = useState({});
  const [showRepliesMap, setShowRepliesMap] = useState({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState({});

  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  // Fetch comments
  const fetchComments = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const response = await api.get(`/comments?postId=${postId}&offset=${reset ? 0 : offset}&limit=${LIMIT}`);
      if (response.data.success) {
        const newComments = response.data.data || [];
        setComments(reset ? newComments : [...comments, ...newComments]);
        setOffset(reset ? newComments.length : offset + newComments.length);
        setHasMore(newComments.length === LIMIT);
        // const newRepliesMap = {};
        // newComments.forEach((comment) => {
        //   if (comment.replies && comment.replies.length > 0) {
        //     newRepliesMap[comment._id] = comment.replies;
        //   }
        // });
        // setRepliesMap((prev) => ({ ...prev, ...newRepliesMap }));
        if (onCommentsFetched) {
          onCommentsFetched(reset ? newComments : [...comments, ...newComments]);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error.response || error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [postId, offset, comments, onCommentsFetched]);

  // Fetch replies (chỉ fetch replies cho đúng comment, không fetch lại các cha)
  const fetchReplies = useCallback(async (commentId, depth = 0, maxDepth = 3) => {
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
    // eslint-disable-next-line
  }, []);

  // Fetch comment count
  const fetchCommentCount = useCallback(async () => {
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
    // eslint-disable-next-line
  }, [postId, setTotalCount]);

  // Fetch post likes (sửa lỗi nếu không có count)
  const fetchPostLikes = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      if (response.data.success && response.data.data && typeof response.data.data.count === 'number') {
        setLikeCount(response.data.data.count);
      } else {
        setLikeCount(0);
      }
    } catch (error) {
      console.error('Error fetching post likes:', error);
      setLikeCount(0);
    }
    // eslint-disable-next-line
  }, [postId]);

  // Reset and fetch when postId changes
  useEffect(() => {
    if (postId) {
      setOffset(0);
      fetchComments(true);
      fetchPostLikes();
    }
    // eslint-disable-next-line
  }, [postId]);

  return {
    comments,
    setComments,
    likeCount,
    setLikeCount,
    offset,
    setOffset,
    hasMore,
    setHasMore,
    loading,
    setLoading,
    repliesMap,
    setRepliesMap,
    showRepliesMap,
    setShowRepliesMap,
    loadingRepliesMap,
    setLoadingRepliesMap,
    fetchComments,
    fetchReplies,
    fetchCommentCount,
    fetchPostLikes,
  };
} 