import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaInfoCircle, FaStar, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Giả sử bạn có context này
import axios from 'axios';

const ReviewSection = () => {
    const { eventId } = useParams();
    const { user } = useAuth();
    const userId = user?._id || null; // chỉ lấy primitive, không phải object

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newReview, setNewReview] = useState({ content: '', rating: 5 });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingReview, setEditingReview] = useState({ content: '', rating: 5 });

    useEffect(() => {
        if (!eventId) {
            setLoading(false); // hoặc return;
            return;
        }
        setLoading(true);
        axios.get('/api/reviews')
            .then(res => {
                setReviews(
                    res.data.filter(r =>
                        (r.eventId?._id === eventId || r.eventId === eventId) &&
                        (r.status === 'approved' || (userId && r.userId?._id === userId))
                    )
                );
                setError('');
            })
            .catch(() => setError('Không lấy được đánh giá'))
            .finally(() => setLoading(false));
    }, [eventId, userId]);

    // Thêm review mới
    const handleAddReview = async e => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await axios.post('/api/reviews', {
                ...newReview,
                eventId,
                userId: user._id
            });
            setReviews([...reviews, res.data]);
            setNewReview({ content: '', rating: 5 });
        } catch {
            setError('Không thể gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Xoá review
    const handleDelete = async id => {
        if (!window.confirm('Bạn chắc chắn muốn xoá?')) return;
        try {
            await axios.delete(`/api/reviews/${id}`);
            setReviews(reviews.filter(r => r._id !== id));
        } catch {
            setError('Không thể xoá đánh giá');
        }
    };

    // Sửa review
    const handleEdit = (review) => {
        setEditingId(review._id);
        setEditingReview({ content: review.content, rating: review.rating });
    };

    const handleUpdate = async (id) => {
        try {
            const res = await axios.put(`/api/reviews/${id}`, editingReview);
            setReviews(reviews.map(r => (r._id === id ? res.data : r)));
            setEditingId(null);
        } catch {
            setError('Không thể cập nhật đánh giá');
        }
    };

    // Lọc review của user hiện tại
    const myReview = userId ? reviews.find(r => r.userId?._id === userId) : null;
    const otherReviews = reviews.filter(r => !userId || r.userId?._id !== userId);
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
                    {/* Review của bạn */}
                    {user && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Đánh giá của bạn</h3>
                            {!myReview ? (
                                <form onSubmit={handleAddReview} className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <span>Chấm điểm:</span>
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
                                        value={newReview.content}
                                        onChange={e => setNewReview({ ...newReview, content: e.target.value })}
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
                                            <span className="font-semibold mr-2">{user.name || 'Bạn'}</span>
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
                                                    value={editingReview.content}
                                                    onChange={e =>
                                                        setEditingReview({ ...editingReview, content: e.target.value })
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
                                            <div className="text-gray-700">{myReview.content}</div>
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

                    {/* Review của người khác */}
                    <h3 className="text-lg font-semibold mb-2">Đánh giá của người dùng khác</h3>
                    {otherReviews.length === 0 ? (
                        <div className="p-4 text-gray-500">Chưa có đánh giá nào từ người khác.</div>
                    ) : (
                        otherReviews.map(review => (
                            <div key={review._id} className="border-b pb-3 mb-2">
                                <div className="flex items-center">
                                    <span className="font-semibold mr-2">{review.userId?.name || 'Ẩn danh'}</span>
                                    <span className="flex text-yellow-500">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <FaStar key={i} />
                                        ))}
                                    </span>
                                </div>
                                <div className="text-gray-700">{review.content}</div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewSection;