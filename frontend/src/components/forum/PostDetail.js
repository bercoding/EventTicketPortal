import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI } from '../../services/api';
import PostCard from '../../components/forum/PostCard';
import { FaSpinner, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postAPI.getPostById(id); // response là object của axios
        if (response.data.success) { // Sửa ở đây
          setPost(response.data.data); // và ở đây
        } else {
          setError(response.data.message || 'Không thể tải bài viết.'); // và ở đây
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải bài viết.'); // Cải thiện báo lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700">Lỗi</h2>
        <p className="text-red-600">{error}</p>
        <Link to="/forum" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            <FaArrowLeft className="inline mr-2" /> Quay lại diễn đàn
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
        <div className="text-center p-8">
            <h2 className="text-xl font-semibold">Không tìm thấy bài viết</h2>
            <Link to="/forum" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                <FaArrowLeft className="inline mr-2" /> Quay lại diễn đàn
            </Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-4">
            <Link to="/forum" className="text-blue-600 hover:underline flex items-center">
                <FaArrowLeft className="mr-2" />
                Quay lại diễn đàn
            </Link>
        </div>
        <PostCard post={post} isDetailPage={true} />
    </div>
  );
};

export default PostDetail; 