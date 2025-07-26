import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    fetchPosts();
  }, [filter, currentPage, searchTerm]);

  useEffect(() => {
    if (socket) {
      const handleNewPostPending = () => {
        fetchPosts();
      };
      socket.on('new_post_pending', handleNewPostPending);
      return () => {
        socket.off('new_post_pending', handleNewPostPending);
      };
    }
  }, [socket, filter, currentPage, searchTerm]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPosts({
        page: currentPage,
        limit: 10,
        status: filter !== 'all' ? filter : undefined,
        search: searchTerm || undefined
      });
      
      setPosts(response.data.posts || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setRejectionReason('');
  };

  const handleModeratePost = async (postId, status) => {
    try {
      setIsSubmitting(true);
      
      if (status === 'rejected' && !rejectionReason) {
        toast.error('Vui lòng nhập lý do từ chối');
        return;
      }
      
      await adminAPI.moderatePost(postId, { 
        status, 
        reason: status === 'rejected' ? rejectionReason : undefined 
      });
      
      toast.success(`Bài viết đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}`);
      fetchPosts();
      closeModal();
    } catch (error) {
      console.error('Error moderating post:', error);
      toast.error('Không thể thực hiện thao tác này');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    
    try {
      setIsSubmitting(true);
      await adminAPI.deletePost(postId);
      toast.success('Đã xóa bài viết thành công');
      fetchPosts();
      closeModal();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Không thể xóa bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'Không xác định';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Đã phê duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Đã từ chối</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Không xác định</span>;
    }
  };

  if (loading && posts.length === 0) {
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
        <h1 className="text-2xl font-bold mb-2">Quản lý Bài viết</h1>
        <p className="text-indigo-100">Quản lý tất cả bài đăng của người dùng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Chờ duyệt
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-md ${filter === 'approved' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Đã duyệt
            </button>
            <button 
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-md ${filter === 'rejected' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Đã từ chối
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              className="w-full md:w-64 px-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Post List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đăng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{post.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{post.author?.username || 'Không xác định'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewDetails(post)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Chi tiết
                      </button>
                      {post.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleModeratePost(post._id, 'approved')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedPost(post);
                              setShowModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {post.status !== 'pending' && (
                        <button 
                          onClick={() => handleDeletePost(post._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <p className="text-gray-500">Không có bài viết nào {filter !== 'all' ? 'trong trạng thái này' : ''}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700'}`}
              >
                Trước
              </button>
              <div className="mx-4">
                Trang {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-700'}`}
              >
                Sau
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Modal for post details and rejection reason */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết bài viết</h3>
            
            <div className="mb-4">
              <p className="font-bold text-xl mb-2">{selectedPost.title}</p>
              <p className="text-gray-500 mb-2">Người đăng: {selectedPost.author?.username || 'Không xác định'}</p>
              <p className="text-gray-500 mb-4">Ngày đăng: {formatDate(selectedPost.createdAt)}</p>
              
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="whitespace-pre-line">{selectedPost.content}</p>
              </div>
              
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-4">
                  <p className="font-bold mb-2">Hình ảnh:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPost.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Ảnh ${index + 1}`} 
                        className="w-full h-40 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {selectedPost.status === 'rejected' && selectedPost.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
                  <p className="font-bold text-red-800">Lý do từ chối:</p>
                  <p className="text-red-700">{selectedPost.rejectionReason}</p>
                </div>
              )}
              
              {selectedPost.status === 'pending' && (
                <div className="mt-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do từ chối (nếu từ chối):
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows="3"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              {selectedPost.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleModeratePost(selectedPost._id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Phê duyệt'}
                  </button>
                  <button
                    onClick={() => handleModeratePost(selectedPost._id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </>
              )}
              {selectedPost.status !== 'pending' && (
                <button
                  onClick={() => handleDeletePost(selectedPost._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xóa bài viết'}
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                disabled={isSubmitting}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement; 