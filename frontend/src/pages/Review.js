//Test component for review form thoi// nên gắn vào trang sự kiện 

// frontend/src/pages/Review.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewForm from '../components/ReviewForm';

const ReviewPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${eventId}`);
                setEvent(res.data);
                setLoading(false);
            } catch (err) {
                setError('Không tìm thấy sự kiện');
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    if (loading) return <div>Đang tải sự kiện...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="review-page">
            <ReviewForm 
                eventId={eventId} 
                eventTitle={event?.title}
                onReviewSuccess={() => {
                    setTimeout(() => {
                        // Validate eventId before navigation
                        if (eventId && eventId !== 'null' && eventId !== 'undefined') {
                            navigate(`/events/${eventId}`);
                        } else {
                            console.warn('⚠️ Invalid eventId in Review navigation, going to events list');
                            navigate('/events');
                        }
                    }, 2000);
                }}
            />
        </div>
    );
};

export default ReviewPage;
