import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaStar, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { reviewAPI } from '../services/api';
import { toast } from 'react-toastify';

const ReviewSection = ({ eventId }) => {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newReview, setNewReview] = useState({ comment: '', rating: 5 });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingReview, setEditingReview] = useState({ comment: '', rating: 5 });

    useEffect(() => {
        if (!eventId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        reviewAPI.getReviews(eventId)
            .then(data => {
                setReviews(
                    data.filter(r =>
                        (r.status === 'approved' || (user?._id && r.userId?._id === user._id))
                    )
                );
                setError('');
            })
            .catch(() => setError('Không lấy được đánh giá'))
            .finally(() => setLoading(false));
    }, [eventId, user?._id]);

    // Thêm review mới
    const handleAddReview = async e => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await reviewAPI.createReview(eventId, {
                ...newReview
            });
            setReviews([...reviews, data]);
            setNewReview({ comment: '', rating: 5 });
            toast.success('Gửi đánh giá thành công!');
        } catch (err) {
            // Nếu có message từ backend
            if (err && err.message === 'Bạn đã đánh giá sự kiện này rồi.') {
                toast.warning('Bạn đã đánh giá sự kiện này rồi.');
            } else {
                toast.error('Không thể gửi đánh giá');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Xoá review
    const handleDelete = async id => {
        if (!window.confirm('Bạn chắc chắn muốn xoá?')) return;
        try {
            await reviewAPI.deleteReview(eventId, id);
            setReviews(reviews.filter(r => r._id !== id));
            toast.success('Xóa đánh giá thành công!');
        } catch {
            toast.error('Không thể xoá đánh giá');
            setError('Không thể xoá đánh giá');
        }
    };

    // Sửa review
    const handleEdit = (review) => {
        setEditingId(review._id);
        setEditingReview({ comment: review.comment, rating: review.rating });
    };

    const handleUpdate = async (id) => {
        try {
            const data = await reviewAPI.updateReview(eventId, id, editingReview);
            setReviews(reviews.map(r => (r._id === id ? data : r)));
            setEditingId(null);
            toast.success('Cập nhật đánh giá thành công!');
        } catch {
            toast.error('Không thể cập nhật đánh giá');
            setError('Không thể cập nhật đánh giá');
        }
    };

    // Lọc review của user hiện tại
    const myReview = user?._id ? reviews.find(r => r.userId?._id === user._id) : null;
    const otherReviews = reviews.filter(r => !user?._id || r.userId?._id !== user._id);

    return (
        <div className="bg-transparent">
            <h2 className="text-3xl font-bold text-blue-200 mb-6 flex items-center">
                <FaInfoCircle className="text-blue-400 mr-4 text-2xl" />
                Đánh giá sự kiện
            </h2>
            {loading ? (
                <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 text-center text-blue-300">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                    Đang tải đánh giá...
                </div>
            ) : error ? (
                <div className="p-6 bg-red-900/50 backdrop-blur-sm border border-red-500/30 text-red-300 rounded-xl text-center">{error}</div>
            ) : (
                <>
                    {user && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">Đánh giá của bạn</h3>
                            {!myReview ? (
                                <form onSubmit={handleAddReview} className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-blue-500/30 space-y-4">
                                    <div className="flex items-center space-x-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`text-2xl transition-all duration-200 hover:scale-110 ${
                                                    star <= newReview.rating ? "text-yellow-400" : "text-gray-600"
                                                }`}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="w-full bg-gray-800/50 border border-blue-500/30 rounded-lg p-4 text-blue-200 placeholder-blue-300/50 focus:bg-gray-800/70 focus:border-blue-400 transition-all duration-300"
                                        placeholder="Nội dung đánh giá..."
                                        value={newReview.comment}
                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                        rows={3}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-blue-500/30">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-3">
                                                <span className="font-semibold mr-4 text-blue-200 text-lg">
                                                    {user?.fullName || user?.username || 'Bạn'}
                                                </span>
                                                <span className="flex text-yellow-400 text-lg">
                                                    {[...Array(myReview.rating)].map((_, i) => (
                                                        <FaStar key={i} />
                                                    ))}
                                                </span>
                                            </div>
                                            {editingId === myReview._id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        className="w-full bg-gray-800/50 border border-blue-500/30 rounded-lg p-3 text-blue-200 focus:bg-gray-800/70 focus:border-blue-400 transition-all duration-300"
                                                        value={editingReview.comment}
                                                        onChange={e =>
                                                            setEditingReview({ ...editingReview, comment: e.target.value })
                                                        }
                                                        rows={3}
                                                    />
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <span className="text-blue-300">Chấm điểm:</span>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                className={`text-xl transition-all duration-200 hover:scale-110 ${
                                                                    star <= editingReview.rating ? "text-yellow-400" : "text-gray-600"
                                                                }`}
                                                                onClick={() => setEditingReview({ ...editingReview, rating: star })}
                                                            >
                                                                <FaStar />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                                                            onClick={() => handleUpdate(myReview._id)}
                                                        >
                                                            <FaCheck className="mr-2" />
                                                            Lưu
                                                        </button>
                                                        <button
                                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            <FaTimes className="mr-2" />
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-blue-300 text-lg leading-relaxed">{myReview.comment}</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col ml-4 space-y-2">
                                            <button
                                                title="Sửa"
                                                onClick={() => handleEdit(myReview)}
                                                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all duration-300"
                                            >
                                                <FaEdit className="text-lg" />
                                            </button>
                                            <button
                                                title="Xóa"
                                                onClick={() => handleDelete(myReview._id)}
                                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                                            >
                                                <FaTrash className="text-lg" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <h3 className="text-xl font-semibold mb-6 text-blue-300">Tất cả đánh giá</h3>
                    {otherReviews.length === 0 ? (
                        <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 text-center text-blue-300/80">
                            Chưa có đánh giá nào.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {otherReviews.map(review => (
                                <div key={review._id} className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-blue-500/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <span className="font-semibold mr-4 text-blue-200 text-lg">
                                                {review.userId?.fullName || review.userId?.username || 'Người dùng'}
                                            </span>
                                            <span className="flex text-yellow-400 text-lg">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <FaStar key={i} />
                                                ))}
                                            </span>
                                        </div>
                                        {user && review.userId?._id === user._id && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    title="Sửa"
                                                    onClick={() => handleEdit(review)}
                                                    className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all duration-300"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    title="Xóa"
                                                    onClick={() => handleDelete(review._id)}
                                                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {editingId === review._id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                className="w-full bg-gray-800/50 border border-blue-500/30 rounded-lg p-3 text-blue-200 focus:bg-gray-800/70 focus:border-blue-400 transition-all duration-300"
                                                value={editingReview.comment}
                                                onChange={e =>
                                                    setEditingReview({ ...editingReview, comment: e.target.value })
                                                }
                                                placeholder="Nhập nội dung đánh giá..."
                                                rows={3}
                                            />
                                            <div className="flex items-center space-x-2 mb-3">
                                                <span className="text-blue-300">Chấm điểm:</span>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={`text-xl transition-all duration-200 hover:scale-110 ${
                                                            star <= editingReview.rating ? "text-yellow-400" : "text-gray-600"
                                                        }`}
                                                        onClick={() => setEditingReview({ ...editingReview, rating: star })}
                                                    >
                                                        <FaStar />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                                                    onClick={() => handleUpdate(review._id)}
                                                >
                                                    <FaCheck className="mr-2" />
                                                    Lưu
                                                </button>
                                                <button
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <FaTimes className="mr-2" />
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-blue-300 text-lg leading-relaxed">{review.comment}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewSection;