// src/pages/Forum.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes } from 'react-icons/fa';
import PostCard from '../components/forum/PostCard';

const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    images: [],
  });
  const [editPostId, setEditPostId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    tags: '',
    images: [],
  });
  const [showOptions, setShowOptions] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postAPI.getPosts();
        console.log('Fetched posts:', response.data.data);
        setPosts(response.data.data);
      } catch (err) {
        setError('Failed to fetch posts');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleFileChange = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Cannot upload more than 10 images');
      return;
    }

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);

    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, images: files }));
    } else {
      setFormData((prev) => ({ ...prev, images: files }));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('tags', formData.tags);
    
    formData.images.forEach((file) => {
      formDataToSend.append('images', file);
    });

    try {
      const response = await postAPI.createPost(formDataToSend);
      setPosts([response.data.data, ...posts]);
      setShowCreateForm(false);
      setFormData({ title: '', content: '', tags: '', images: [] });
      setImagePreview([]);
      setSuccessMessage('Post created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const startEditPost = (post) => {
    console.log('Starting edit for post:', post);
    setEditPostId(post._id);
    setEditFormData({
      title: post.title || '',
      content: post.content || '',
      tags: post.tags?.join(',') || '',
      images: []
    });
    setShowOptions(null);
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    const formDataToSend = new FormData();
    formDataToSend.append('title', editFormData.title);
    formDataToSend.append('content', editFormData.content);
    formDataToSend.append('tags', editFormData.tags);
    editFormData.images.forEach((file) => {
      formDataToSend.append('images', file);
    });

    try {
      const response = await postAPI.updatePost(editPostId, formDataToSend);
      setPosts(posts.map(post => (post._id === editPostId ? response.data.data : post)));
      setEditPostId(null);
      setEditFormData({ title: '', content: '', tags: '', images: [] });
      setImagePreview([]);
      setSuccessMessage('Post updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    setIsDeleting(postId);
    setError(null);
    try {
      await postAPI.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
      setShowOptions(null);
      setSuccessMessage('Post deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReportPost = (postId) => {
    setShowOptions(null);
    setError('Report submitted (This feature is under development)');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Forum</h1>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Create Post
            </motion.button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg transition-opacity duration-500">
            {successMessage}
          </div>
        )}

        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Create New Post</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ title: '', content: '', tags: '', images: [] });
                    setImagePreview([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Images (max 10)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                    className="w-full"
                  />
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPreviews = imagePreview.filter((_, i) => i !== index);
                              const newFiles = Array.from(formData.images).filter((_, i) => i !== index);
                              setImagePreview(newPreviews);
                              setFormData(prev => ({ ...prev, images: newFiles }));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ title: '', content: '', tags: '', images: [] });
                      setImagePreview([]);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Post</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editPostId && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Edit Post</h2>
                <button
                  onClick={() => {
                    setEditPostId(null);
                    setEditFormData({ title: '', content: '', tags: '', images: [] });
                    setImagePreview([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleEditPost} className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Content"
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Images (max 10)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="w-full"
                  />
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPreviews = imagePreview.filter((_, i) => i !== index);
                              const newFiles = Array.from(editFormData.images).filter((_, i) => i !== index);
                              setImagePreview(newPreviews);
                              setEditFormData(prev => ({ ...prev, images: newFiles }));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPostId(null);
                      setEditFormData({ title: '', content: '', tags: '', images: [] });
                      setImagePreview([]);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {posts.map((post) => (
            <div key={post._id} className="relative">
              {isDeleting === post._id && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-blue-500 font-medium">Deleting...</span>
                  </div>
                </div>
              )}
              <PostCard
                post={post}
                user={user}
                showOptions={showOptions}
                onToggleOptions={setShowOptions}
                onEdit={startEditPost}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
              />
            </div>
          ))}
        </motion.div>

        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;