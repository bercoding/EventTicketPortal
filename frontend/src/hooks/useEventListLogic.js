import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const useEventListLogic = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/events/owner/${user._id}`);
        setEvents(response.data.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Không thể tải danh sách sự kiện.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleViewDetails = (eventId) => {
    navigate(`/events/manage/${eventId}`);
  };

  const handleDeleteEvent = (eventId) => {
    setEventIdToDelete(eventId);
    setShowConfirmDialog(true);
  };

  const confirmDeleteEvent = async () => {
    setShowConfirmDialog(false); // Close dialog
    if (eventIdToDelete) {
      try {
        await api.delete(`/events/${eventIdToDelete}`);
        toast.success('Xóa sự kiện thành công!');
        setEvents(events.filter(event => event._id !== eventIdToDelete));
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Không thể xóa sự kiện.');
      } finally {
        setEventIdToDelete(null); // Clear eventIdToDelete
      }
    }
  };

  const cancelDeleteEvent = () => {
    setShowConfirmDialog(false);
    setEventIdToDelete(null);
  };

  return {
    events,
    loading,
    showConfirmDialog,
    handleViewDetails,
    handleDeleteEvent,
    confirmDeleteEvent,
    cancelDeleteEvent,
    user
  };
};

export default useEventListLogic; 