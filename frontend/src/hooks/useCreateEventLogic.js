import React, { useState, useEffect } from 'react';
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

  // Địa chỉ hành chính Việt Nam
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  // Fetch provinces khi mount
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(() => setProvinces([]));
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

  // Khi chọn tỉnh, cập nhật formData.location.city
  useEffect(() => {
    const province = provinces.find(p => p.code === selectedProvinceCode);
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city: province ? province.name : ''
      }
    }));
  }, [selectedProvinceCode]);

  // Khi chọn quận, cập nhật formData.location.district
  useEffect(() => {
    const district = districts.find(d => d.code === selectedDistrictCode);
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
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [imageType]: result.url
          }
        }));
      } else {
        // Có thể hiển thị thông báo lỗi ở đây nếu muốn
        alert(result.message || 'Upload ảnh thất bại');
      }
    }
  };

  const handleNextStep = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('handleNextStep called. Current step:', currentStep);
    
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
      // Validation cơ bản cho tất cả template
      if (!formData.title || !formData.description) {
        toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc: Tên sự kiện, Mô tả.');
        return;
      }

      // Không kiểm tra địa điểm ở bước 1 nữa, chỉ kiểm tra các thông tin cơ bản
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
      
      // Kiểm tra thông tin địa điểm ở bước 2 (nếu là sự kiện offline)
      if (!isOnlineEvent) {
        if (!formData.location.venueName) {
          toast.error('Vui lòng nhập tên địa điểm.');
          return;
        }
        if (!formData.location.address) {
          toast.error('Vui lòng nhập địa chỉ.');
          return;
        }
        if (!formData.location.city) {
          toast.error('Vui lòng chọn thành phố.');
          return;
        }
      } else {
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
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!user || user.role !== 'event_owner') {
      toast.error('Bạn không có quyền tạo sự kiện');
      return;
    }

    try {
      setLoading(true);

      console.log('User object in handleFinalSubmit:', user);
      console.log('User ID in handleFinalSubmit:', user?._id);
      console.log('Template info:', templateInfo);
      console.log('Form data before submission:', formData);
      console.log('Seating map data:', formData.seatingMap);

      // Validate required fields
      if (!formData.title || !formData.description) {
        toast.error('Vui lòng điền đầy đủ thông tin cơ bản của sự kiện');
        setLoading(false);
        return;
      }

      // Validate ticket types
      if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
        toast.error('Vui lòng thêm ít nhất một loại vé');
        setLoading(false);
        return;
      }

      for (const ticket of formData.ticketTypes) {
        if (!ticket.name || ticket.price < 0 || ticket.totalQuantity <= 0) {
          toast.error('Vui lòng kiểm tra lại thông tin loại vé');
          setLoading(false);
          return;
        }
      }

      // Kiểm tra kết nối đến backend
      try {
        console.log('Testing API connection...');
        const testResponse = await api.get('/health-check');
        console.log('API connection test successful:', testResponse.data);
      } catch (connectionError) {
        console.error('API connection test failed:', connectionError);
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
        setLoading(false);
        return;
      }

      // Tính toán capacity và seatOptions dựa trên template
      let payload;
      let apiEndpoint = '/events';
      
      if (isSeatingEvent) {
        // Sự kiện có ghế ngồi
        console.log("Đang xử lý sự kiện có ghế ngồi");
        apiEndpoint = '/events/create-with-seating';
        
        const totalTickets = formData.ticketTypes.reduce((sum, ticket) => sum + ticket.totalQuantity, 0);
        
        // Ensure seatingMap is properly aligned with venue layout
        const venueLayout = formData.seatingMap?.layoutType || 'theater';
        
        const locationData = {
          type: formData.location.type || 'offline',
          venueName: formData.location.venueName,
          address: formData.location.address,
          ward: formData.location.ward,
          district: formData.location.district,
          city: formData.location.city,
          country: formData.location.country || 'Vietnam',
          venueLayout: venueLayout // Use the same value for both properties
        };

        // Convert rows from number to proper schema structure
        const processedSeatingMap = {
          ...formData.seatingMap,
          layoutType: venueLayout, // Ensure it matches venueLayout
          sections: Array.isArray(formData.seatingMap?.sections) ? 
            formData.seatingMap.sections.map(section => {
              // Convert numeric rows to rowSchema structure
              if (typeof section.rows === 'number' || typeof section.rows === 'string') {
                // Giới hạn số lượng hàng và ghế để tránh payload quá lớn
                const numRows = Math.min(parseInt(section.rows) || 10, 15);
                const seatsPerRow = Math.min(parseInt(section.seatsPerRow) || 15, 30);
                
                return {
                  ...section,
                  rows: generateRowsData(numRows, seatsPerRow)
                };
              } else if (!Array.isArray(section.rows)) {
                // If rows is neither a number nor an array, create a default array
                return {
                  ...section,
                  rows: generateRowsData(10, 15) // Default values
                };
              }
              return section;
            }) : []
        };
        
        console.log('Processed seating map for submission:', processedSeatingMap);

        payload = {
          ...formData,
          organizers: [user._id],
          location: locationData,
          organizer: formData.organizer || { name: user.username || 'Event Organizer' },
          seatOptions: {
            totalSeats: totalTickets || formData.capacity || 100,
            totalSections: processedSeatingMap?.sections?.length || 5,
            venueType: formData.location.venueLayout || 'theater'
          },
          // Ensure capacity is set explicitly
          capacity: totalTickets || formData.capacity || 100,
          // Send empty array for ticketTypes to prevent casting errors
          // Ticket types will be created separately in the backend
          ticketTypes: [],
          // Store the original ticket types data in a separate field
          ticketTypesData: formData.ticketTypes,
          templateType: templateInfo?.templateType || 'seating',
          seatingMap: processedSeatingMap // Use the processed seating map
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
          ticketTypes: [], // Gửi mảng rỗng cho ticketTypes
          ticketTypesData: formData.ticketTypes, // Gửi loại vé thực tế ở field này
          templateType: templateInfo?.templateType || 'general'
        };
      }

      console.log('API endpoint:', apiEndpoint);
      console.log('Submitting event data:', payload);

      // Thực hiện API call với timeout dài hơn
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await api.post(apiEndpoint, payload, {
          signal: controller.signal,
          timeout: 30000
        });
        
        clearTimeout(timeoutId);
        
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
          toast.success(`Tạo sự kiện "${eventTitle}" thành công!`);
          
          // Navigate after a short delay to ensure toast is shown
          setTimeout(() => {
            navigate('/my-events');
          }, 2000);
        } else {
          console.error('❌ Invalid response structure:', response.data);
          throw new Error('Không nhận được ID sự kiện từ server');
        }
      } catch (apiError) {
        if (apiError.name === 'AbortError') {
          console.error('API request timed out');
          toast.error('Yêu cầu bị hủy do quá thời gian chờ. Vui lòng thử lại sau.');
        } else {
          throw apiError; // Re-throw to be caught by the outer catch
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
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
    if (name === 'location.city') {
      setSelectedProvinceCode(value);
      setSelectedDistrictCode('');
      setSelectedWardCode('');
      return;
    }
    if (name === 'location.district') {
      setSelectedDistrictCode(value);
      setSelectedWardCode('');
      return;
    }
    if (name === 'location.ward') {
      setSelectedWardCode(value);
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