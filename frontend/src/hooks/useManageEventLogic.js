import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const useManageEventLogic = (eventId) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Validate eventId parameter
  if (!eventId || eventId === 'null' || eventId === 'undefined') {
    console.error('❌ useManageEventLogic: Invalid eventId provided:', eventId);
    throw new Error('Invalid eventId provided to useManageEventLogic');
  }
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState({
    organizers: [],
    images: {
      logo: '',
      banner: ''
    },
    organizer: {
      name: '',
      info: '',
      logo: ''
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: [],
    tags: [],
    startDate: '',
    endDate: '',
    capacity: 0,
    location: {
      type: 'offline',
      venueName: '',
      city: '',
      district: '',
      ward: '',
      address: '',
      venueLayout: 'hall'
    },
    organizer: {
      name: '',
      info: '',
      logo: ''
    },
    images: {
      logo: '',
      banner: ''
    },
    visibility: 'public',
    termsAndConditions: '',
    detailedDescription: {
      mainProgram: '',
      guests: '',
      specialExperiences: ''
    },
    payment: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      branch: '',
      swiftBic: ''
    }
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      // Double-check eventId before API call
      if (!eventId || eventId === 'null' || eventId === 'undefined') {
        console.error('❌ fetchEvent: Invalid eventId detected:', eventId);
        toast.error('ID sự kiện không hợp lệ');
        navigate('/events');
        return;
      }
      
      console.log('🔍 fetchEvent: Making API call with eventId:', eventId);
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data.data;
      const primaryOrganizer = eventData.organizers && eventData.organizers.length > 0 ? eventData.organizers[0] : {};

      setEvent({
        ...event,
        ...eventData,
        organizers: eventData.organizers || [],
        images: {
          logo: eventData.images?.logo || '',
          banner: eventData.images?.banner || ''
        },
        organizer: {
          name: eventData.organizer?.name || primaryOrganizer.username || '',
          info: eventData.organizer?.info || primaryOrganizer.email || '',
          logo: eventData.eventOrganizerDetails?.logo || eventData.organizer?.logo || primaryOrganizer.logo || ''
        }
      });
      setFormData({
        ...formData,
        ...eventData,
        organizer: {
          name: eventData.organizer?.name || primaryOrganizer.username || '',
          info: eventData.organizer?.info || primaryOrganizer.email || '',
          logo: eventData.eventOrganizerDetails?.logo || eventData.organizer?.logo || primaryOrganizer.logo || ''
        },
        images: {
          logo: eventData.images?.logo || '',
          banner: eventData.images?.banner || ''
        },
        location: {
          type: eventData.location?.type || 'offline',
          venueName: eventData.location?.venueName || '',
          city: eventData.location?.city || '',
          district: eventData.location?.district || '',
          ward: eventData.location?.ward || '',
          address: eventData.location?.address || '',
          venueLayout: eventData.location?.venueLayout || 'hall'
        },
        detailedDescription: {
          mainProgram: eventData.detailedDescription?.mainProgram || '',
          guests: eventData.detailedDescription?.guests || '',
          specialExperiences: eventData.detailedDescription?.specialExperiences || ''
        },
        payment: {
          bankName: eventData.payment?.bankName || '',
          accountNumber: eventData.payment?.accountNumber || '',
          accountHolderName: eventData.payment?.accountHolderName || '',
          branch: eventData.payment?.branch || '',
          swiftBic: eventData.payment?.swiftBic || ''
        }
      });
    } catch (error) {
      toast.error('Không thể tải thông tin sự kiện');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/events/${eventId}`, formData);
      toast.success('Cập nhật sự kiện thành công!');
      setIsEditing(false);
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/events/${eventId}`);
      toast.success('Xóa sự kiện thành công!');
      navigate('/events/my-events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sự kiện');
    } finally {
      setLoading(false);
    }
  };

  // Add handlers for category and tags if they are to be managed differently
  const handleCategoryChange = (e) => {
    setFormData(prev => ({ ...prev, category: [e.target.value] }));
  };

  const handleTagsChange = (e) => {
    setFormData(prev => ({ ...prev, tags: e.target.value.split(', ').map(tag => tag.trim()).filter(tag => tag !== '') }));
  };

  // Thêm hàm cập nhật ảnh
  const handleImageChange = (type, url) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: url
      }
    }));
  };

  return {
    loading,
    event,
    isEditing,
    setIsEditing,
    formData,
    handleChange,
    handleSubmit,
    handleDelete,
    user,
    handleCategoryChange,
    handleTagsChange,
    handleImageChange // trả về hàm này
  };
};

export default useManageEventLogic; 