import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPosts();
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Quản lý Posts</h1>
        <p className="text-indigo-100">Kiểm duyệt và quản lý bài viết của người dùng</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📰</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chức năng đang phát triển</h3>
        <p className="text-gray-600">Quản lý posts sẽ được triển khai trong phiên bản tiếp theo</p>
        <p className="text-sm text-gray-500 mt-2">Tổng posts: {posts.length}</p>
      </div>
    </div>
  );
};

export default PostManagement; 