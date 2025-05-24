import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy danh sách review theo eventId
    const fetchReviews = async (eventId) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5001/api/reviews/event/${eventId}`);
            setReviews(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải review');
        } finally {
            setLoading(false);
        }
    };

    // Tạo review mới
    const createReview = async (eventId, reviewData) => {
        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:5001/api/reviews/event/${eventId}`, reviewData);
            setReviews(prev => [...prev, res.data]);
            setError(null);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tạo review');
            return { success: false, error: err.response?.data?.message };
        } finally {
            setLoading(false);
        }
    };

    // Xoá review
    const deleteReview = async (reviewId) => {
        try {
            await axios.delete(`http://localhost:5001/api/reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r._id !== reviewId));
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xoá review');
        }
    };

    // Cập nhật review
    const updateReview = async (reviewId, reviewData) => {
        try {
            const res = await axios.put(`http://localhost:5001/api/reviews/${reviewId}`, reviewData);
            setReviews(prev => prev.map(r => (r._id === reviewId ? res.data : r)));
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật review');
        }
    };

    return (
        <ReviewContext.Provider
            value={{
                reviews,
                loading,
                error,
                fetchReviews,
                createReview,
                deleteReview,
                updateReview
            }}
        >
            {children}
        </ReviewContext.Provider>
    );
};
