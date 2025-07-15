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
        <div className="bg-white mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FaInfoCircle className="text-blue-600 mr-3" />
                Đánh giá sự kiện
            </h2>
            {loading ? (
                <div className="p-4 bg-gray-100 rounded-lg text-center">Đang tải đánh giá...</div>
            ) : error ? (
                <div className="p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg text-center">{error}</div>
            ) : (
                <>
                    {user && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Đánh giá của bạn</h3>
                            {!myReview ? (
                                <form onSubmit={handleAddReview} className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex items-center space-x-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={star <= newReview.rating ? "text-yellow-500" : "text-gray-300"}
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                            >
                                                <FaStar />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="w-full border rounded p-2"
                                        placeholder="Nội dung đánh giá..."
                                        value={newReview.comment}
                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                        rows={2}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Gửi đánh giá
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <span className="font-semibold mr-2">{user?.fullName || user?.username || 'Bạn'}</span>
                                            <span className="flex text-yellow-500">
                                                {[...Array(myReview.rating)].map((_, i) => (
                                                    <FaStar key={i} />
                                                ))}
                                            </span>
                                        </div>
                                        {editingId === myReview._id ? (
                                            <div className="mt-1">
                                                <input
                                                    className="border rounded px-2 py-1 w-full mb-1"
                                                    value={editingReview.comment}
                                                    onChange={e =>
                                                        setEditingReview({ ...editingReview, comment: e.target.value })
                                                    }
                                                />
                                                <div className="flex items-center space-x-1 mb-1">
                                                    <span>Chấm điểm:</span>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            className={star <= editingReview.rating ? "text-yellow-500" : "text-gray-300"}
                                                            onClick={() => setEditingReview({ ...editingReview, rating: star })}
                                                        >
                                                            <FaStar />
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    className="text-green-500 mr-2"
                                                    onClick={() => handleUpdate(myReview._id)}
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    className="text-gray-500"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-gray-700">{myReview.comment}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col ml-2">
                                        <button
                                            title="Sửa"
                                            onClick={() => handleEdit(myReview)}
                                            className="text-blue-500 hover:text-blue-700 mb-1"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            title="Xóa"
                                            onClick={() => handleDelete(myReview._id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <h3 className="text-lg font-semibold mb-2">Tất cả đánh giá </h3>
                    {otherReviews.length === 0 ? (
                        <div className="p-4 text-gray-500">Chưa có đánh giá nào.</div>
                    ) : (
                        otherReviews.map(review => (
                            <div key={review._id} className="border-b pb-3 mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">
                                            {review.userId?.fullName || review.userId?.username || 'Người dùng'}
                                        </span>
                                        <span className="flex text-yellow-500">
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
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                title="Xóa"
                                                onClick={() => handleDelete(review._id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {editingId === review._id ? (
                                    <div className="mt-2">
                                        <input
                                            className="border rounded px-2 py-1 w-full mb-2"
                                            value={editingReview.comment}
                                            onChange={e =>
                                                setEditingReview({ ...editingReview, comment: e.target.value })
                                            }
                                            placeholder="Nhập nội dung đánh giá..."
                                        />
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span>Chấm điểm:</span>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={star <= editingReview.rating ? "text-yellow-500" : "text-gray-300"}
                                                    onClick={() => setEditingReview({ ...editingReview, rating: star })}
                                                >
                                                    <FaStar />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                                                onClick={() => handleUpdate(review._id)}
                                            >
                                                <FaCheck className="mr-1" />
                                                Lưu
                                            </button>
                                            <button
                                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center"
                                                onClick={() => setEditingId(null)}
                                            >
                                                <FaTimes className="mr-1" />
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-700 mt-1">{review.comment}</div>
                                )}
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewSection;