import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const useCreateEventLogic = (templateInfo = null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Xác định loại template
  const isOnlineEvent = templateInfo?.templateType === 'online';
  const isGeneralEvent = templateInfo?.templateType === 'general';
  const isSeatingEvent = templateInfo?.templateType === 'seating';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: {
      logo: '',
      banner: ''
    },
    startDate: '',
    endDate: '',
    location: {
      type: 'offline',
      venueName: '',
      address: '',
      ward: '',
      district: '',
      city: '',
      country: '',
      venueLayout: 'hall',
      // Online event fields
      meetingLink: '',
      platform: ''
    },
    category: [],
    tags: [],
    capacity: '',
    visibility: 'public',
    status: 'pending',
    detailedDescription: {
      mainProgram: '',
      guests: '',
      specialExperiences: ''
    },
    termsAndConditions: '',
    organizer: {
      logo: '',
      name: '',
      info: ''
    },
    seatingMap: {
      layout: {},
      sections: []
    },
    ticketTypes: []
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [currentStep, setCurrentStep] = useState(1);


  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await api.get('/venues/provinces');
        setProvinces(response.data);
      } catch (error) {
        toast.error('Không thể tải danh sách tỉnh/thành phố.');
        console.error('Error fetching provinces:', error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedProvinceCode) {
        try {
          const response = await api.get(`/venues/districts/${selectedProvinceCode}`);
          setDistricts(response.data);
          setWards([]);
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              district: '',
              ward: ''
            }
          }));
          setSelectedDistrictCode('');
          setSelectedWardCode('');
        } catch (error) {
          toast.error('Không thể tải danh sách quận/huyện.');
          console.error('Error fetching districts:', error);
        }
      } else {
        setDistricts([]);
        setWards([]);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            district: '',
            ward: '',
            city: ''
          }
        }));
        setSelectedDistrictCode('');
        setSelectedWardCode('');
      }
    };
    fetchDistricts();
  }, [selectedProvinceCode]);

  useEffect(() => {
    const fetchWards = async () => {
      if (selectedDistrictCode) {
        try {
          const response = await api.get(`/venues/wards/${selectedDistrictCode}`);
          setWards(response.data);
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              ward: ''
            }
          }));
          setSelectedWardCode('');
        } catch (error) {
          toast.error('Không thể tải danh sách phường/xã.');
          console.error('Error fetching wards:', error);
        }
      } else {
        setWards([]);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            ward: ''
          }
        }));
        setSelectedWardCode('');
      }
    };
    fetchWards();
  }, [selectedDistrictCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'location.city') {
      const selectedProvince = provinces.find(p => p.code.toString() === value);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          city: selectedProvince ? selectedProvince.name : '',
          district: '',
          ward: ''
        }
      }));
      setSelectedProvinceCode(value);
      setSelectedDistrictCode('');
      setSelectedWardCode('');
    } else if (name === 'location.district') {
      const selectedDistrict = districts.find(d => d.code.toString() === value);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          district: selectedDistrict ? selectedDistrict.name : '',
          ward: ''
        }
      }));
      setSelectedDistrictCode(value);
      setSelectedWardCode('');
    } else if (name === 'location.ward') {
      const selectedWard = wards.find(w => w.code.toString() === value);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          ward: selectedWard ? selectedWard.name : ''
        }
      }));
      setSelectedWardCode(value);
    } else if (name === 'location.venueLayout') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          venueLayout: value
        },
        seatingMap: { layout: {}, sections: [] } 
      }));
    } else if (name === 'location.type') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          type: value
        },
        seatingMap: { layout: {}, sections: [] }
      }));
    } else if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: value
          }
        }));
      } else if (parts.length === 3) {
        setFormData(prev => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: {
              ...prev[parts[0]][parts[1]],
              [parts[2]]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleImageUpload = (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [imageType]: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
      toast.info(`Hình ảnh ${imageType} đã được chọn.`);
    }
  };



  const handleNextStep = async (e) => {
    e.preventDefault();
    console.log('handleNextStep called. Current step:', currentStep);

    if (currentStep === 1) {
      // Validation cơ bản cho tất cả template
      if (!formData.title || !formData.description) {
        toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc: Tên sự kiện, Mô tả.');
        return;
      }

      // Validation riêng cho từng template
      if (isOnlineEvent) {
        // Online event - cần link tham gia và nền tảng
        if (!formData.location.meetingLink || !formData.location.platform) {
          toast.error('Vui lòng cung cấp đầy đủ nền tảng và link tham gia cho sự kiện online.');
          return;
        }
        // Validate URL format
        try {
          new URL(formData.location.meetingLink);
        } catch (error) {
          toast.error('Link tham gia không hợp lệ. Vui lòng nhập URL đúng định dạng.');
          return;
        }
      } else {
        // Offline event - cần địa điểm
        if (!formData.location.venueName || !formData.location.address || !formData.location.city) {
          toast.error('Vui lòng điền đầy đủ thông tin địa điểm cho sự kiện offline.');
          return;
        }
      }

      console.log('Validation passed for Step 1. Moving to next step.');
      setCurrentStep(prevStep => prevStep + 1);
    } else if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Vui lòng điền đầy đủ Ngày bắt đầu và Ngày kết thúc với giờ cụ thể.');
        return;
      }
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const now = new Date();
      
      // Kiểm tra thời gian trong tương lai
      if (startDate <= now) {
        toast.error('Ngày bắt đầu phải trong tương lai (ít nhất 1 giờ từ bây giờ).');
        return;
      }
      
      if (startDate >= endDate) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
        return;
      }
      
      // Kiểm tra thời lượng tối thiểu (ít nhất 30 phút)
      const diffMs = endDate - startDate;
      if (diffMs < 30 * 60 * 1000) {
        toast.error('Sự kiện phải có thời lượng ít nhất 30 phút.');
        return;
      }
      setCurrentStep(prevStep => prevStep + 1);
    } else if (currentStep === 3) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const handleAddSeatingMapSection = () => {
    setFormData(prev => ({
      ...prev,
      seatingMap: {
        ...prev.seatingMap,
        sections: [
          ...prev.seatingMap.sections,
          { name: '', price: 0, totalSeats: 0, availableSeats: 0, rows: [] }
        ]
      }
    }));
  };

  const handleRemoveSeatingMapSection = (index) => {
    setFormData(prev => {
      const newSections = [...prev.seatingMap.sections];
      newSections.splice(index, 1);
      return {
        ...prev,
        seatingMap: {
          ...prev.seatingMap,
          sections: newSections
        }
      };
    });
  };

  const handleSeatingMapSectionChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newSections = [...prev.seatingMap.sections];
      newSections[index] = {
        ...newSections[index],
        [name]: name === 'price' || name === 'totalSeats' ? Number(value) : value,
      };
      
      if (name === 'totalSeats') {
        newSections[index].availableSeats = Number(value);
      }
      return {
        ...prev,
        seatingMap: {
          ...prev.seatingMap,
          sections: newSections
        }
      };
    });
  };

  const handleAddTicketType = () => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: [
        ...prev.ticketTypes,
        { name: '', price: 0, totalQuantity: 0, availableQuantity: 0 }
      ]
    }));
  };

  const handleRemoveTicketType = (index) => {
    setFormData(prev => {
      const newTicketTypes = [...prev.ticketTypes];
      newTicketTypes.splice(index, 1);
      return {
        ...prev,
        ticketTypes: newTicketTypes
      };
    });
  };

  const handleTicketTypeChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newTicketTypes = [...prev.ticketTypes];
      newTicketTypes[index] = {
        ...newTicketTypes[index],
        [name]: name === 'price' || name === 'totalQuantity' ? Number(value) : value,
      };
      if (name === 'totalQuantity') {
        newTicketTypes[index].availableQuantity = Number(value);
      }
      return {
        ...prev,
        ticketTypes: newTicketTypes
      };
    });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || user.role !== 'event_owner') {
      toast.error('Bạn không có quyền tạo sự kiện');
      return;
    }

    try {
      setLoading(true);

      console.log('User object in handleFinalSubmit:', user);
      console.log('User ID in handleFinalSubmit:', user?._id);
      console.log('Template info:', templateInfo);

      // Tính toán capacity và seatOptions dựa trên template
      let payload;
      
      if (isSeatingEvent) {
        // Sự kiện có ghế ngồi
        const totalTickets = formData.ticketTypes.reduce((sum, ticket) => sum + ticket.totalQuantity, 0);
        const totalSections = Math.max(formData.seatingMap.sections.length, 5);
        
        const locationData = {
          type: formData.location.type,
          venueName: formData.location.venueName,
          address: formData.location.address,
          ward: formData.location.ward,
          district: formData.location.district,
          city: formData.location.city,
          country: formData.location.country || 'Vietnam'
        };

        // Chỉ thêm thông tin online nếu là online event
        if (formData.location.type === 'online') {
          locationData.meetingLink = formData.location.meetingLink;
          locationData.platform = formData.location.platform;
        }

        payload = {
          ...formData,
          organizers: [user._id],
          location: locationData,
          organizer: formData.organizer,
          seatOptions: {
            totalSeats: totalTickets || formData.capacity || 100,
            totalSections: totalSections,
            venueType: formData.location.venueLayout || 'theater'
          },
          ticketTypes: formData.ticketTypes,
          templateType: templateInfo?.templateType || 'seating'
        };
      } else {
        // Sự kiện general hoặc online
        const locationData = {
          type: formData.location.type,
          venueName: formData.location.venueName,
          address: formData.location.address,
          ward: formData.location.ward,
          district: formData.location.district,
          city: formData.location.city,
          country: formData.location.country || 'Vietnam'
        };

        // Chỉ thêm thông tin online nếu là online event
        if (formData.location.type === 'online') {
          locationData.meetingLink = formData.location.meetingLink;
          locationData.platform = formData.location.platform;
        }

        payload = {
          ...formData,
          organizers: [user._id],
          location: locationData,
          organizer: formData.organizer,
          ticketTypes: formData.ticketTypes,
          templateType: templateInfo?.templateType || 'general'
        };
      }

      console.log('Submitting event data:', payload);

      const response = await api.post('/events/create-with-seating', payload);
      console.log('Event creation response:', response.data);
      console.log('Response structure:', {
        success: response.data.success,
        hasData: !!response.data.data,
        eventId: response.data.data?._id,
        dataKeys: Object.keys(response.data.data || {})
      });
      
      if (response.data.success && response.data.data?._id) {
        const eventId = response.data.data._id;
        const eventTitle = response.data.data.title;
        console.log('🎉 Event created successfully:', { eventId, eventTitle });
        toast.success(`Tạo sự kiện "${eventTitle}" thành công! Đang chuyển hướng...`);
        
        // Try to navigate to event detail first, fallback to my events
        setTimeout(async () => {
          try {
            // First try to verify the event exists
            const checkResponse = await api.get(`/events/${eventId}`);
            if (checkResponse.data.success) {
              console.log('✅ Event verified, navigating to detail page');
              navigate(`/events/${eventId}`);
              return;
            }
          } catch (error) {
            console.warn('⚠️ Could not verify event, falling back to my-events');
          }
          
          // Fallback: go to my events page
          console.log('🚀 Navigating to my-events as fallback');
          window.location.href = '/my-events';
        }, 1500);
      } else {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Không nhận được ID sự kiện từ server');
      }
    } catch (error) {
      console.error('Error creating event:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setFormData(prev => ({ ...prev, category: [e.target.value] }));
  };

  const handleTagsChange = (e) => {
    setFormData(prev => ({ ...prev, tags: e.target.value.split(', ').map(tag => tag.trim()).filter(tag => tag !== '') }));
  };

  const handleVenueLayoutChange = (layoutType) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        venueLayout: layoutType
      },
      seatingMap: { layout: {}, sections: [] } 
    }));
  };

  return {
    formData,
    setFormData,
    provinces,
    districts,
    wards,
    selectedProvinceCode,
    setSelectedProvinceCode,
    selectedDistrictCode,
    setSelectedDistrictCode,
    selectedWardCode,
    setSelectedWardCode,
    currentStep,
    setCurrentStep,
    handleChange,
    handleImageUpload,

    handleNextStep,
    handlePrevStep,
    handleAddSeatingMapSection,
    handleRemoveSeatingMapSection,
    handleSeatingMapSectionChange,
    handleAddTicketType,
    handleRemoveTicketType,
    handleTicketTypeChange,
    handleFinalSubmit,
    loading,
    user,
    handleCategoryChange,
    handleTagsChange,
    handleVenueLayoutChange,
    isOnlineEvent,
    isGeneralEvent,
    isSeatingEvent
  };
};

export default useCreateEventLogic; 