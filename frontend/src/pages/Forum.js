// src/pages/Forum.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaSearch, FaFilter, FaTrendingUp, FaFire, FaClock, FaUsers } from 'react-icons/fa';
import PostCard from '../components/forum/PostCard';
import CreatePostModal from '../components/forum/CreatePostModal';

const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, popular, trending
  const [filterTag, setFilterTag] = useState('');
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
  const [deleteModal, setDeleteModal] = useState({ open: false, postId: null });
  const [allTags, setAllTags] = useState([]);

  // Extract all unique tags from posts
  useEffect(() => {
    const tags = [...new Set(posts.flatMap(post => post.tags || []))];
    setAllTags(tags);
  }, [posts]);

  // Filter and sort posts
  useEffect(() => {
    let filtered = [...posts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(post => 
        post.tags?.some(tag => tag.toLowerCase() === filterTag.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.likesCount || b.likes?.length || 0) - (a.likesCount || a.likes?.length || 0));
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const scoreA = (a.likesCount || a.likes?.length || 0) + (a.commentsCount || 0);
          const scoreB = (b.likesCount || b.likes?.length || 0) + (b.commentsCount || 0);
          return scoreB - scoreA;
        });
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, sortBy, filterTag]);

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
        setError('Không thể tải bài viết');
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
    
    console.log('Creating post with data:', formData);
    console.log('Images to upload:', formData.images);
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('tags', formData.tags);
    
    formData.images.forEach((file, index) => {
      console.log(`Appending image ${index}:`, file);
      formDataToSend.append('images', file);
    });

    // Log FormData contents
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      console.log('Sending request to create post...');
      const response = await postAPI.createPost(formDataToSend);
      console.log('Post created successfully:', response.data);
      setPosts([response.data.data, ...posts]);
      setShowCreateForm(false);
      setFormData({ title: '', content: '', tags: '', images: [] });
      setImagePreview([]);
      setSuccessMessage('Post created successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      console.error('Error response:', err.response);
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
    
    if (editFormData.images && editFormData.images.length > 0) {
      editFormData.images.forEach((file) => {
        formDataToSend.append('images', file);
      });
    }

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

  const handleDeletePost = (postId) => {
    setDeleteModal({ open: true, postId });
  };

  const confirmDeletePost = async () => {
    const postId = deleteModal.postId;
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
      setDeleteModal({ open: false, postId: null });
    }
  };

  const handleReportPost = (postId) => {
    setShowOptions(null);
    setError('Report submitted (This feature is under development)');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải diễn đàn...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <FaUsers className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Diễn Đàn Cộng Đồng
                </h1>
                <p className="text-gray-500 mt-1">Chia sẻ, thảo luận và kết nối với cộng đồng</p>
              </div>
            </div>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FaPlus className="mr-2" />
              Tạo bài viết mới
            </motion.button>
          )}
        </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="flex gap-3 items-center">
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="newest">🕒 Mới nhất</option>
                <option value="popular">❤️ Phổ biến</option>
                <option value="trending">🔥 Thịnh hành</option>
              </select>

              {/* Tag Filter */}
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">🏷️ Tất cả chủ đề</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaClock className="text-blue-500" />
              <span>{posts.length} bài viết</span>
            </div>
            <div className="flex items-center gap-2">
              <FaFire className="text-orange-500" />
              <span>{filteredPosts.length} kết quả</span>
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2">
                <FaSearch className="text-green-500" />
                <span>Tìm kiếm: "{searchTerm}"</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">!</span>
            </div>
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            {successMessage}
          </motion.div>
        )}

        <AnimatePresence>
          {showCreateForm && (
            <CreatePostModal
              open={showCreateForm}
              onClose={() => {
                setShowCreateForm(false);
                setFormData({ title: '', content: '', tags: '', images: [] });
                setImagePreview([]);
                setError(null);
              }}
              onSubmit={handleCreatePost}
              user={user}
              formData={formData}
              setFormData={setFormData}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              isCreating={isCreating}
              error={error}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editPostId && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-xl relative animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa bài viết</h2>
                  <button
                    onClick={() => {
                      setEditPostId(null);
                      setEditFormData({ title: '', content: '', tags: '', images: [] });
                      setImagePreview([]);
                    }}
                    className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                {/* User info */}
                <div className="flex items-center gap-3 px-6 py-4">
                  <img src={user?.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="w-11 h-11 rounded-full object-cover border" />
                  <div>
                    <div className="font-semibold text-gray-900">{user?.fullName || user?.username || 'User'}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                      <span className="font-medium">{editFormData.visibility === 'private' ? 'Riêng tư' : 'Công khai'}</span>
                    </div>
                  </div>
                </div>
                {/* Form */}
                <form onSubmit={handleEditPost} className="px-6 pb-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Tiêu đề"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Nội dung"
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Thẻ (phân tách bằng dấu phẩy)"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {/* Image preview */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ảnh (tối đa 10 ảnh)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, true)}
                      className="w-full"
                    />
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="object-contain max-h-60 w-full"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPreviews = imagePreview.filter((_, i) => i !== index);
                                const newFiles = Array.from(editFormData.images).filter((_, i) => i !== index);
                                setImagePreview(newPreviews);
                                setEditFormData(prev => ({ ...prev, images: newFiles }));
                              }}
                              className="absolute top-2 right-2 bg-white border border-gray-300 text-gray-600 rounded-full p-1 hover:bg-red-500 hover:text-white transition"
                            >
                              <FaTimes size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex justify-end gap-3 pt-2 border-t mt-4">
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
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-semibold"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <span>Lưu</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {filteredPosts.map((post) => (
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

        {filteredPosts.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchTerm || filterTag ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterTag 
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' 
                  : 'Hãy là người đầu tiên chia sẻ với cộng đồng!'
                }
              </p>
              {user && !searchTerm && !filterTag && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  Tạo bài viết đầu tiên
                </motion.button>
              )}
          </div>
          </motion.div>
        )}

        {/* Modal xác nhận xóa post */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
              <button onClick={() => setDeleteModal({ open: false, postId: null })} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
              <h2 className="text-lg font-bold text-center mb-2">Xóa bài viết?</h2>
              <p className="text-gray-700 text-center mb-6">Bạn có chắc chắn muốn xóa bài viết này?</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setDeleteModal({ open: false, postId: null })} className="text-blue-600 font-semibold px-4 py-2 rounded hover:underline">Không</button>
                <button onClick={confirmDeletePost} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 transition" disabled={isDeleting}>Có</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;