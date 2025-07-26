import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { uploadImage } from '../services/api';

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
      venueLayout: 'theater', // Default to theater for seating events
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
      layoutType: 'theater', // Set default layoutType
      sections: [],
      stage: {
        x: 400,
        y: 50,
        width: 300,
        height: 60
      },
      venueObjects: []
    },
    ticketTypes: [{
      name: 'Vé Thường',
      price: 0,
      totalQuantity: 100,
      availableQuantity: 100,
      description: 'Vé thường cho sự kiện'
    }]
  });

  const [currentStep, setCurrentStep] = useState(1);
  // Thêm một cơ chế để ngăn chặn việc gọi handleNextStep liên tiếp
  const [lastStepChange, setLastStepChange] = useState(0);
  const STEP_THROTTLE_MS = 1000; // Thời gian tối thiểu giữa các lần chuyển bước (1 giây)

  const rerunNextStepRef = useRef(false);

  // Địa chỉ hành chính Việt Nam
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  // Fetch provinces khi mount
  useEffect(() => {
    console.log('🌍 Fetching provinces...');
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => {
        console.log('🌍 Provinces loaded:', data.length, 'provinces');
        console.log('🌍 First few provinces:', data.slice(0, 3));
        setProvinces(data);
      })
      .catch(error => {
        console.error('❌ Error fetching provinces:', error);
        setProvinces([]);
      });
  }, []);

  // Fetch districts khi chọn tỉnh
  useEffect(() => {
    if (selectedProvinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []))
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
      setSelectedDistrictCode('');
      setWards([]);
      setSelectedWardCode('');
    }
  }, [selectedProvinceCode]);

  // Fetch wards khi chọn quận
  useEffect(() => {
    if (selectedDistrictCode) {
      fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []))
        .catch(() => setWards([]));
    } else {
      setWards([]);
      setSelectedWardCode('');
    }
  }, [selectedDistrictCode]);

  // Khôi phục lại useEffect đồng bộ tên tỉnh/thành với code
  useEffect(() => {
    if (selectedProvinceCode) {
      const province = provinces.find(p => p.code === parseInt(selectedProvinceCode));
      console.log('🔄 Syncing city from province code:', selectedProvinceCode, 'to city name:', province?.name);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          city: province ? province.name : ''
        }
      }));
    }
  }, [selectedProvinceCode, provinces]);

  // Khi chọn quận, cập nhật formData.location.district
  useEffect(() => {
    const district = districts.find(d => d.code === selectedDistrictCode);
    console.log('🔄 Syncing district from code:', selectedDistrictCode, 'to name:', district?.name);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        district: district ? district.name : ''
      }
    }));
  }, [selectedDistrictCode]);

  // Khi chọn phường, cập nhật formData.location.ward
  useEffect(() => {
    const ward = wards.find(w => w.code === selectedWardCode);
    console.log('🔄 Syncing ward from code:', selectedWardCode, 'to name:', ward?.name);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ward: ward ? ward.name : ''
      }
    }));
  }, [selectedWardCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'location.venueLayout') {
      console.log('Đổi venueLayout thành:', value);
      // Đảm bảo đồng bộ giữa venueLayout và seatingMap.layoutType
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          venueLayout: value
        },
        seatingMap: {
          ...prev.seatingMap,
          layoutType: value
        }
      }));
    } else if (name === 'location.type') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          type: value
        }
      }));
    } else if (name === 'seatingMap') {
      console.log('DEBUG: seatingMap update received in useCreateEventLogic hook');
      console.log('DEBUG: Value type:', typeof value);
      
      // Ngăn cập nhật nếu đó là một function
      if (typeof value === 'function') {
        console.warn('DEBUG: Phát hiện cập nhật seatingMap với function, bỏ qua để tránh vòng lặp');
        return;
      }
      
      // Ensure the value object isn't null or undefined
      if (!value) {
        console.error('DEBUG: Received null/undefined seatingMap value');
        return;
      }
      
      if (typeof value === 'object') {
        console.log('DEBUG: SeatingMap received:',
          'layoutType:', value.layoutType,
          'sections:', Array.isArray(value.sections) ? value.sections.length : 'not array',
          'venueObjects:', Array.isArray(value.venueObjects) ? value.venueObjects.length : 'not array'
        );
        
        // Cập nhật trực tiếp nếu có sections hoặc venueObjects
        if ((Array.isArray(value.sections) && value.sections.length > 0) || 
            (Array.isArray(value.venueObjects) && value.venueObjects.length > 0)) {
          console.log('DEBUG: Direct update with sections/objects');
          
          setFormData(prev => {
            console.log('DEBUG: Current sections:', 
              prev.seatingMap?.sections?.length || 0, 
              'New sections:', value.sections?.length || 0);
            
            return {
              ...prev,
              seatingMap: {
                layoutType: value.layoutType || prev.seatingMap?.layoutType || 'theater',
                sections: Array.isArray(value.sections) ? value.sections : [],
                stage: value.stage || prev.seatingMap?.stage || { x: 400, y: 50, width: 300, height: 60 },
                venueObjects: Array.isArray(value.venueObjects) ? value.venueObjects : []
              }
            };
          });
          console.log('DEBUG: Update submitted');
          return;
        }
      }
      
      // Standard update path
      setFormData(prev => {
        console.log('DEBUG: Standard update path for seatingMap');
      
      // Đảm bảo dữ liệu seatingMap luôn có đủ các thuộc tính cần thiết
      const updatedSeatingMap = {
        layoutType: value.layoutType || prev.seatingMap?.layoutType || 'theater',
          sections: Array.isArray(value.sections) ? value.sections : (Array.isArray(prev.seatingMap?.sections) ? prev.seatingMap.sections : []),
          stage: value.stage || prev.seatingMap?.stage || { x: 400, y: 50, width: 300, height: 60 },
          venueObjects: Array.isArray(value.venueObjects) ? value.venueObjects : (Array.isArray(prev.seatingMap?.venueObjects) ? prev.seatingMap.venueObjects : [])
      };
      
        console.log('DEBUG: Updating seatingMap in hook. Sections:', updatedSeatingMap.sections.length, 'Objects:', updatedSeatingMap.venueObjects.length);
      
        return {
        ...prev,
        seatingMap: updatedSeatingMap
        };
      });
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

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      // Upload file lên server và lấy URL
      const result = await uploadImage(file, imageType);
      if (result.success) {
        // Đảm bảo lưu đúng đường dẫn từ backend
        const imageUrl = result.url;
        console.log(`🖼️ Upload ${imageType} successful:`, imageUrl);
        
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [imageType]: imageUrl
          }
        }));
      } else {
        // Có thể hiển thị thông báo lỗi ở đây nếu muốn
        console.error('Upload image failed:', result.message);
        toast.error(result.message || 'Upload ảnh thất bại');
      }
    }
  };

  const handleNextStep = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('handleNextStep called. Current step:', currentStep);
    console.log('DEBUG: formData.location.city:', formData.location.city);
    console.log('DEBUG: selectedProvinceCode:', selectedProvinceCode);
    console.log('DEBUG: provinces:', provinces);
    
    // Kiểm tra xem có phải do người dùng thực sự thao tác với nút điều hướng
    const isFromNavigation = e && e.nativeEvent && e.nativeEvent.isTrusted && 
      e.target && (e.target.classList.contains('next-button') || e.target.closest('.next-button'));
    
    // Chặn nếu không phải từ nút điều hướng và không có sự kiện đi kèm
    if (!isFromNavigation && e) {
      console.log('Step change ignored: not from navigation button');
      return;
    }
    
    // Chống việc chuyển bước liên tiếp quá nhanh
    const now = Date.now();
    if (now - lastStepChange < STEP_THROTTLE_MS) {
      console.log('Step change throttled: too fast');
      return;
    }
    setLastStepChange(now);

    if (currentStep === 1) {
      // Nếu city rỗng nhưng đã chọn code, đồng bộ lại và tự động validate lại
      if (!formData.location.city && selectedProvinceCode && !rerunNextStepRef.current) {
        const province = provinces.find(p => p.code === selectedProvinceCode);
        if (province) {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              city: province.name
            }
          }));
          rerunNextStepRef.current = true;
          setTimeout(() => {
            handleNextStep();
          }, 0);
          return;
        }
      }
      rerunNextStepRef.current = false;
      // Validation cơ bản cho tất cả template
      if (!formData.title || !formData.description) {
        toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc: Tên sự kiện, Mô tả.');
        return;
      }
      // BỎ kiểm tra thành phố ở bước 1
      // if (!isOnlineEvent && !selectedProvinceCode) {
      //   console.log('DEBUG: validate fail - city:', formData.location.city);
      //   toast.error('Vui lòng chọn thành phố.');
      //   return;
      // }
      // Đồng bộ lại city trước khi sang bước tiếp theo
      if (!formData.location.city) {
        const province = provinces.find(p => p.code === selectedProvinceCode);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            city: province ? province.name : ''
          }
        }));
      }
      console.log('Validation passed for Step 1. Moving to next step.');
      setCurrentStep(prevStep => prevStep + 1);
      
    } else if (currentStep === 2) {
      // Kiểm tra ngày tháng
      if (!formData.startDate || !formData.endDate) {
        toast.error('Vui lòng điền đầy đủ Ngày bắt đầu và Ngày kết thúc với giờ cụ thể.');
        return;
      }
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const now = new Date();
      
      // Kiểm tra thời gian trong tương lai (ít nhất 1 giờ)
      if (startDate.getTime() - now.getTime() < 60 * 60 * 1000) {
        toast.error('Ngày bắt đầu phải sau thời điểm hiện tại ít nhất 1 giờ.');
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
      
      // Validate tổng số vé không vượt quá sức chứa (cho event general và online)
      if (isGeneralEvent || isOnlineEvent) {
        const totalTickets = formData.ticketTypes.reduce((sum, ticket) => sum + (Number(ticket.totalQuantity) || 0), 0);
        const capacity = Number(formData.capacity) || 0;
        if (totalTickets > capacity) {
          toast.error('Tổng số lượng vé không được lớn hơn sức chứa.');
          return;
        }
      }
      
      // Thêm validate thành phố ở bước 2 (nếu là offline event)
      if (!isOnlineEvent && !selectedProvinceCode) {
        toast.error('Vui lòng chọn thành phố.');
          return;
      }
      
      console.log('Validation passed for Step 2. Moving to next step.');
      setCurrentStep(prevStep => prevStep + 1);
    } else if (currentStep === 3) {
      // Kiểm tra loại vé
      if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
        toast.error('Vui lòng thêm ít nhất một loại vé.');
        return;
      }
      
      let hasError = false;
      formData.ticketTypes.forEach((ticket, index) => {
        if (!ticket.name) {
          toast.error(`Loại vé #${index + 1} thiếu tên.`);
          hasError = true;
        }
        if (ticket.price < 0) {
          toast.error(`Loại vé #${index + 1} cần có giá hợp lệ.`);
          hasError = true;
        }
        if (ticket.totalQuantity <= 0) {
          toast.error(`Loại vé #${index + 1} cần có số lượng > 0.`);
          hasError = true;
        }
      });
      
      if (hasError) return;
      
      console.log('Validation passed for Step 3. Moving to next step.');
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

  // Thêm helper function để chuyển đổi định dạng rows với tối ưu hóa kích thước
  const generateRowsData = (numRows, seatsPerRow) => {
    // Giảm số lượng hàng và ghế nếu quá lớn để tránh payload quá khổ
    // Giới hạn tối đa là 15 hàng và 30 ghế mỗi hàng (giảm từ 30/50 xuống)
    const limitedRows = Math.min(numRows, 15);
    const limitedSeatsPerRow = Math.min(seatsPerRow, 30);
    
    const rows = [];
    for (let i = 0; i < limitedRows; i++) {
      const rowName = String.fromCharCode(65 + i); // A, B, C...
      
      // Mảng seats chỉ chứa số lượng và thông tin cơ bản
      const seats = [];
      for (let j = 0; j < limitedSeatsPerRow; j++) {
        seats.push({
          number: `${j + 1}`,
          status: 'available',
          // Chỉ lưu tọa độ nếu cần thiết cho việc hiển thị
          x: j * 20,
          y: 0
        });
      }
      
      rows.push({
        name: rowName,
        seats: seats
      });
    }
    return rows;
  };

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    
    console.log('🚀 Starting final submit...');
    console.log('📋 Current formData:', JSON.stringify(formData, null, 2));
    console.log('🏙️ City in formData:', formData.location.city);
    console.log('🏘️ District in formData:', formData.location.district);
    console.log('🏠 Ward in formData:', formData.location.ward);
    console.log('🏙️ Selected province code:', selectedProvinceCode);
    
    setLoading(true);
    try {
      // Validation cuối cùng trước khi submit
      if (!formData.title || !formData.description) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }
      
      // Đảm bảo city được set đúng trước khi submit
      if (!formData.location.city && selectedProvinceCode) {
        const province = provinces.find(p => p.code === selectedProvinceCode);
        if (province) {
          console.log('🔧 Fixing city before submit:', province.name);
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              city: province.name
            }
          }));
          // Đợi một chút để state update
          setTimeout(() => {
            submitEvent();
          }, 100);
          return;
        }
      }
      
      // Nếu vẫn không có city, thử lấy từ provinces
      if (!formData.location.city && selectedProvinceCode) {
        console.log('🔧 City still empty, trying to get from provinces...');
        const province = provinces.find(p => p.code === selectedProvinceCode);
        if (province) {
          console.log('🔧 Found province for city:', province.name);
          // Cập nhật formData trực tiếp
          const updatedFormData = {
            ...formData,
            location: {
              ...formData.location,
              city: province.name
            }
          };
          console.log('🔧 Updated formData with city:', updatedFormData.location.city);
          submitEventWithData(updatedFormData);
          return;
        }
      }
      
      submitEvent();
    } catch (error) {
      console.error('❌ Error in handleFinalSubmit:', error);
      toast.error('Có lỗi xảy ra khi tạo sự kiện');
      setLoading(false);
    }
  };
  
  const submitEvent = async () => {
    submitEventWithData(formData);
  };
  
  const submitEventWithData = async (data) => {
    try {
      console.log('📤 Submitting event data to backend with prepared data...');
      console.log('🏙️ Final city value:', data.location.city);
      
      // Chuẩn bị dữ liệu trước khi gửi
      const eventData = {
        ...data,
        // Đảm bảo capacity có giá trị
        capacity: data.capacity || 100,
        // Đảm bảo platform có giá trị hợp lệ cho online event
        location: {
          ...data.location,
          platform: data.location.type === 'online' ? (data.location.platform || 'zoom') : undefined
        },
        // Gửi ticketTypesData thay vì ticketTypes để backend tạo riêng
        ticketTypesData: data.ticketTypes,
        ticketTypes: [], // Gửi mảng rỗng, backend sẽ tạo
        // Đảm bảo seatingMap có cấu trúc đúng
        seatingMap: data.seatingMap ? {
          ...data.seatingMap,
          sections: data.seatingMap.sections?.map(section => ({
            ...section,
            // Đảm bảo rows là array thay vì number
            rows: Array.isArray(section.rows) ? section.rows : generateRowsData(10, 15)
          })) || []
        } : undefined
      };
      
      console.log('📋 Prepared event data:', JSON.stringify(eventData, null, 2));
      
      const response = await api.post('/events', eventData);
      
      console.log('✅ Event created successfully:', response.data);
      
      toast.success('Tạo sự kiện thành công!');
      navigate('/events');
    } catch (error) {
      console.error('❌ Error creating event:', error);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
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
      seatingMap: {
        ...prev.seatingMap,
        layoutType: layoutType // Ensure layoutType is synchronized here too
      }
    }));
  };

  // Sửa handleChange để cập nhật code khi chọn dropdown
  const handleChangeWithDropdown = (e) => {
    const { name, value } = e.target;
    console.log('🔄 handleChangeWithDropdown called:', name, value);
    
    if (name === 'location.city') {
      console.log('🏙️ City dropdown changed to code:', value);
      console.log('🏙️ Available provinces:', provinces.length);
      console.log('🏙️ Looking for province with code:', value);
      
      setSelectedProvinceCode(value);
      // Force update city name in formData
      const province = provinces.find(p => p.code === parseInt(value));
      console.log('🏙️ Found province:', province);
      
      if (province) {
        console.log('🏙️ Province name:', province.name);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            location: {
              ...prev.location,
              city: province.name
            }
          };
          console.log('🏙️ Updated formData.city to:', newFormData.location.city);
          return newFormData;
        });
      } else {
        console.error('❌ Province not found for code:', value);
        console.log('🏙️ Available province codes:', provinces.map(p => p.code).slice(0, 10));
      }
      setSelectedDistrictCode('');
      setSelectedWardCode('');
      return;
    }
    if (name === 'location.district') {
      console.log('🏘️ District dropdown changed to code:', value);
      setSelectedDistrictCode(value);
      const district = districts.find(d => d.code === value);
      console.log('🏘️ Found district:', district?.name);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          district: district ? district.name : ''
        }
      }));
      setSelectedWardCode('');
      return;
    }
    if (name === 'location.ward') {
      console.log('🏠 Ward dropdown changed to code:', value);
      setSelectedWardCode(value);
      const ward = wards.find(w => w.code === value);
      console.log('🏠 Found ward:', ward?.name);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          ward: ward ? ward.name : ''
        }
      }));
      return;
    }
    handleChange(e);
  };

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    handleChange: handleChangeWithDropdown,
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
    isSeatingEvent,
    provinces,
    districts,
    wards,
    selectedProvinceCode,
    selectedDistrictCode,
    selectedWardCode
  };
};

export default useCreateEventLogic; 