// frontend/src/components/ReviewForm.js
import React, { useState } from 'react';
import axios from 'axios';

const ReviewForm = ({ eventId, eventTitle, onReviewSuccess }) => {
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
        images: ''
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));

    const onChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post('/api/reviews', {
                eventId,
                userId: user?._id,
                rating: Number(formData.rating),
                comment: formData.comment,
                images: formData.images
                    ? formData.images.split(',').map(url => url.trim())
                    : []
            });

            setSuccess('Gửi đánh giá thành công! Đang chờ xét duyệt.');
            setError('');
            setFormData({ rating: 5, comment: '', images: '' });

            if (onReviewSuccess) onReviewSuccess(); // callback nếu cần
        } catch (err) {
            setError(err.response?.data?.message || 'Đã xảy ra lỗi khi gửi đánh giá');
            setSuccess('');
        }
    };

    return (
        <div className="review-form">
            <h3>Đánh giá sự kiện: {eventTitle || 'Sự kiện'}</h3>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Chấm điểm (1 - 5)</label>
                    <input
                        type="number"
                        name="rating"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={onChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Bình luận</label>
                    <textarea
                        name="comment"
                        rows="4"
                        placeholder="Viết bình luận của bạn..."
                        value={formData.comment}
                        onChange={onChange}
                    />
                </div>
                <div className="form-group">
                    <label>Hình ảnh (URL cách nhau bởi dấu phẩy)</label>
                    <input
                        type="text"
                        name="images"
                        placeholder="https://image1.jpg, https://image2.png"
                        value={formData.images}
                        onChange={onChange}
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Gửi đánh giá
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;
