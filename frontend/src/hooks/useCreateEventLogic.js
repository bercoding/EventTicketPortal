import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const useCreateEventLogic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
      venueLayout: 'hall'
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

  const handleOrganizerLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          organizer: {
            ...prev.organizer,
            logo: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
      toast.info('Logo ban tổ chức đã được chọn.');
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    console.log('handleNextStep called. Current step:', currentStep);

    if (currentStep === 1) {
      if (!formData.title || !formData.description || !formData.location.venueName || !formData.location.address || !formData.location.city || !formData.organizer.name || !formData.organizer.info) {
        toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc ở Bước 1.');
        return;
      }
      console.log('Validation passed for Step 1. Moving to next step.');
      setCurrentStep(prevStep => prevStep + 1);
    } else if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Vui lòng điền đầy đủ Ngày bắt đầu và Ngày kết thúc.');
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error('Ngày bắt đầu không thể sau Ngày kết thúc.');
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
      console.log('Organizer data in formData before submit:', formData.organizer);

      const payload = {
        ...formData,
        organizers: [user._id],
        location: {
          type: formData.location.type,
          venueName: formData.location.venueName,
          address: formData.location.address,
          ward: formData.location.ward,
          district: formData.location.district,
          city: formData.location.city,
          country: formData.location.country || 'Vietnam',
        },
        organizer: formData.organizer,
      };

      console.log('Submitting event data:', payload);

      const response = await api.post('/events', payload);
      console.log('Event creation response:', response.data);
      
      toast.success('Tạo sự kiện thành công!');
      navigate('/events/my-events');
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
    handleOrganizerLogoUpload,
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
  };
};

export default useCreateEventLogic; 