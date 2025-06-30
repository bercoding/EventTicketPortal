import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ImageUpload from '../../components/event/ImageUpload';
import SeatingPreview from '../../components/seating/SeatingPreview';
import InteractiveSeatingDesigner from '../../components/seating/InteractiveSeatingDesigner';
import './CreateEvent.css';
import { uploadImage } from '../../services/api';

// Venue templates với layout thông minh
const VENUE_TEMPLATES = {
  stadium: {
    name: 'Sân vận động',
    description: '3 khu VIP phía trước, các khu khác xung quanh',
    defaultSections: 8,
    defaultSeats: 300,
    layoutType: 'stadium',
    ticketTypeTemplates: [
      { name: 'VIP Tier 1', price: 800000, description: 'Hàng ghế đầu, view tốt nhất', percentage: 15, color: '#8B5CF6' },
      { name: 'VIP Tier 2', price: 600000, description: 'Khu VIP phía sau', percentage: 20, color: '#3B82F6' },
      { name: 'Thường A', price: 400000, description: 'Khu khán đài chính', percentage: 35, color: '#10B981' },
      { name: 'Thường B', price: 250000, description: 'Khu khán đài phụ', percentage: 30, color: '#F97316' }
    ],
    stageSize: { width: 200, height: 60 }
  },
  theater: {
    name: 'Nhà hát / Hội trường',
    description: 'Layout truyền thống với ghế sắp xếp theo hàng',
    defaultSections: 6,
    defaultSeats: 200,
    layoutType: 'theater',
    ticketTypeTemplates: [
      { name: 'VIP', price: 500000, description: 'Ghế hạng sang phía trước', percentage: 30, color: '#8B5CF6' },
      { name: 'Thường', price: 300000, description: 'Ghế thông thường', percentage: 70, color: '#3B82F6' }
    ],
    stageSize: { width: 200, height: 60 }
  },
  concert: {
    name: 'Concert Hall',
    description: 'Sân khấu trung tâm với khu VIP gần sân khấu',
    defaultSections: 10,
    defaultSeats: 500,
    layoutType: 'concert',
    ticketTypeTemplates: [
      { name: 'Golden Circle', price: 1500000, description: 'Gần sân khấu nhất', percentage: 10, color: '#F59E0B' },
      { name: 'VIP', price: 800000, description: 'Khu VIP với dịch vụ đặc biệt', percentage: 20, color: '#8B5CF6' },
      { name: 'Thường A', price: 500000, description: 'Khu khán đài chính', percentage: 40, color: '#3B82F6' },
      { name: 'Thường B', price: 300000, description: 'Khu khán đài xa', percentage: 30, color: '#10B981' }
    ],
    stageSize: { width: 200, height: 60 }
  },
  outdoor: {
    name: 'Sự kiện ngoài trời',
    description: 'Không gian mở với các khu vực linh hoạt',
    defaultSections: 5,
    defaultSeats: 150,
    layoutType: 'outdoor',
    ticketTypeTemplates: [
      { name: 'VIP Front', price: 600000, description: 'Khu vực phía trước', percentage: 25, color: '#8B5CF6' },
      { name: 'General', price: 350000, description: 'Khu vực chung', percentage: 75, color: '#3B82F6' }
    ],
    stageSize: { width: 200, height: 60 }
  },
  footballStadium: {
    name: 'Sân vận động bóng đá',
    description: 'Layout sân bóng chuyên nghiệp với VIP tầng trên, khán đài chính và khu góc',
    defaultSections: 12,
    defaultSeats: 1000,
    layoutType: 'footballStadium',
    ticketTypeTemplates: [
      { name: 'VIP Box', price: 2500000, description: 'Hộp VIP tầng trên (DB1, DB2, DC1, DC2)', percentage: 20, color: '#DC2626' },
      { name: 'Premium', price: 1500000, description: 'Khán đài cao cấp gần sân (DA1, DA2)', percentage: 20, color: '#7C3AED' },
      { name: 'Khán đài Chính', price: 1000000, description: 'Khán đài chính hai bên (DA3, DA4)', percentage: 30, color: '#2563EB' },
      { name: 'Khán đài Góc', price: 700000, description: 'Khu vực góc sân (KD_A, KD_B, KD_C)', percentage: 20, color: '#059669' },
      { name: 'FOH', price: 400000, description: 'Khu vực FOH và các khu xa', percentage: 10, color: '#D97706' }
    ],
    stageSize: { width: 400, height: 200 }
  },
  basketballArena: {
    name: 'Sân bóng rổ',
    description: 'Arena bóng rổ với khán đài bao quanh sân',
    defaultSections: 8,
    defaultSeats: 600,
    layoutType: 'basketballArena',
    ticketTypeTemplates: [
      { name: 'Courtside', price: 1500000, description: 'Ghế sát sân với trải nghiệm tốt nhất', percentage: 10, color: '#DC2626' },
      { name: 'Lower Bowl', price: 800000, description: 'Tầng dưới gần sân', percentage: 30, color: '#7C3AED' },
      { name: 'Club Level', price: 600000, description: 'Tầng club với tiện ích', percentage: 25, color: '#2563EB' },
      { name: 'Upper Bowl', price: 350000, description: 'Tầng trên với giá hợp lý', percentage: 35, color: '#059669' }
    ],
    stageSize: { width: 350, height: 180 }
  }
};

// Define constants for seating layout
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1000;

// Stage dimensions based on venue type
const STAGE_DIMENSIONS = {
  footballStadium: { width: 320, height: 220, x: 440, y: 50 }, // Sân bóng đá - lớn nhất
  basketballArena: { width: 280, height: 180, x: 460, y: 70 }, // Sân bóng rổ - trung bình
  theater: { width: 240, height: 80, x: 480, y: 50 }, // Nhà hát - nhỏ, rộng
  concert: { width: 220, height: 80, x: 490, y: 50 }, // Concert - nhỏ, rộng
  conference: { width: 200, height: 60, x: 500, y: 50 }, // Hội nghị - nhỏ nhất
  outdoor: { width: 250, height: 80, x: 475, y: 50 }, // Ngoài trời - trung bình
  custom: { width: 200, height: 60, x: 500, y: 50 }, // Tùy chỉnh - mặc định
};

// Create initial stage based on venue type
const getInitialStage = (venueType) => {
  const dimensions = STAGE_DIMENSIONS[venueType] || STAGE_DIMENSIONS.custom;
  return {
    ...dimensions,
    type: venueType === 'footballStadium' ? 'footballField' : 
          venueType === 'basketballArena' ? 'basketballCourt' : 'stage'
  };
};

const CreateEventWithSeating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEventData = location.state?.eventData || {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: {
      venueName: '',
      address: ''
    },
    images: {
      logo: '',
      banner: ''
    }
  };
  
  const [eventData, setEventData] = useState(initialEventData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [designMode, setDesignMode] = useState('custom'); // Luôn là 'custom'
  const [customSeatingMap, setCustomSeatingMap] = useState({
    layoutType: 'custom',
    sections: [],
    stage: { x: 400, y: 50, width: 200, height: 60 }
  });
  const [isEditingTicketTypesManually, setIsEditingTicketTypesManually] = useState(false);
  
  const [seatOptions, setSeatOptions] = useState({
    venueType: 'custom',
    hasSeatingChart: true,
    ticketTypes: [
      { name: 'Standard', price: 0, color: '#3B82F6' }
    ]
  });

  const [ticketTypes, setTicketTypes] = useState([
    {
      name: 'VIP',
      price: 500000,
      description: 'Vé hạng VIP với vị trí tốt nhất',
      quantity: 60,
      color: '#8B5CF6'
    },
    {
      name: 'Thường',
      price: 300000,
      description: 'Vé thường với giá hợp lý',
      quantity: 140,
      color: '#3B82F6'
    }
  ]);

  // Smart seat distribution when changing total seats - preserve colors
  const handleSeatChange = (newTotalSeats) => {
    if (seatOptions.venueType) {
      const template = VENUE_TEMPLATES[seatOptions.venueType];
      const updatedTicketTypes = ticketTypes.map(tt => {
        const templateTT = template.ticketTypeTemplates.find(t => t.name === tt.name);
        const percentage = templateTT ? templateTT.percentage : (tt.quantity / seatOptions.totalSeats * 100);
        return {
          ...tt,
          quantity: Math.floor(newTotalSeats * percentage / 100),
          color: tt.color || templateTT?.color || '#6B7280' // Preserve existing color
        };
      });
      setTicketTypes(updatedTicketTypes);
    }
    
    setSeatOptions(prev => ({ ...prev, totalSeats: parseInt(newTotalSeats) }));
    generatePreviewMap(newTotalSeats, seatOptions.totalSections, seatOptions.venueType);
  };

  // Generate preview seating map
  const generatePreviewMap = async (
    totalSeats = seatOptions.totalSeats, 
    totalSections = seatOptions.totalSections, 
    venueType = seatOptions.venueType,
    stageSize
  ) => {
    try {
      console.log('🔄 Generating preview...', { totalSeats, totalSections, venueType, stageSize });
      
      const response = await axios.post('http://localhost:5001/api/events/preview-seating', {
        seatOptions: { totalSeats, totalSections, venueType },
        ticketTypes: ticketTypes.map(tt => ({ ...tt, _id: `temp_${tt.name}` }))
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ Preview generated successfully');
        setCustomSeatingMap(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error generating preview:', error);
      
      // Better fallback with mock sections
      const mockSections = [];
      const seatsPerSection = Math.floor(totalSeats / totalSections);
      
      for (let i = 0; i < Math.min(totalSections, 3); i++) {
        mockSections.push({
          name: `Khu ${String.fromCharCode(65 + i)}`,
          capacity: seatsPerSection,
          x: 100 + i * 200,
          y: 200 + i * 50,
          width: 150,
          height: 100,
          rows: [{
            rowNumber: 1,
            rowLetter: 'A',
            seats: Array.from({ length: Math.min(seatsPerSection, 10) }, (_, j) => ({
              seatNumber: j + 1,
              x: 100 + i * 200 + j * 15,
              y: 200 + i * 50,
              status: 'available'
            }))
          }]
        });
      }
      
      // Kích thước stage tùy chỉnh theo loại sân
      const defaultStageSize = {
        width: venueType === 'footballStadium' ? 400 :
               venueType === 'basketballArena' ? 350 :
               200,
        height: venueType === 'footballStadium' ? 200 :
                venueType === 'basketballArena' ? 180 :
                60
      };
      
      const stageDimensions = stageSize || defaultStageSize;
      
      setCustomSeatingMap({
        layoutType: venueType,
        sections: mockSections,
        stage: { 
          x: 400 - (stageDimensions.width / 2), // Căn giữa theo chiều ngang
          y: 20, 
          width: stageDimensions.width, 
          height: stageDimensions.height 
        }
      });
    }
  };

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Upload to server using helper function
        const result = await uploadImage(file, imageType);
        
        if (result.success) {
          // Thông báo thành công
          alert(`Upload ${imageType} thành công!`);
          return result.url;
        } else {
          alert(`Lỗi upload ${imageType}: ${result.message}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (error.response?.status === 401) {
          alert(`Lỗi xác thực, vui lòng đăng nhập lại để upload ${imageType}`);
        } else {
          alert(`Lỗi upload ${imageType}: ${error.message}`);
        }
      }
    }
    return null;
  };

  const handleSeatOptionsChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalSeats') {
      handleSeatChange(value);
    } else {
      const newSeatOptions = { ...seatOptions, [name]: parseInt(value) };
      setSeatOptions(newSeatOptions);
      // Generate preview khi thay đổi venueType hoặc totalSections
      setTimeout(() => {
        generatePreviewMap(newSeatOptions.totalSeats, newSeatOptions.totalSections, newSeatOptions.venueType);
      }, 300);
    }
  };

  const handleTicketTypeChange = (index, field, value) => {
    // Mark as manually editing when user changes ticket types
    console.log(`🎛️ User manually changed ticket type [${index}].${field} = ${value}`);
    console.log(`🎛️ Before: isEditingTicketTypesManually = ${isEditingTicketTypesManually}`);
    setIsEditingTicketTypesManually(true);
    console.log(`🎛️ After: isEditingTicketTypesManually = true`);
    
    const updatedTicketTypes = [...ticketTypes];
    
    if (field === 'price' || field === 'quantity') {
      updatedTicketTypes[index][field] = parseInt(value) || 0;
    } else {
      updatedTicketTypes[index][field] = value;
    }
    
    setTicketTypes(updatedTicketTypes);
    console.log(`🎛️ Updated ticket types:`, updatedTicketTypes);
    
    // Log màu sắc change để debug
    if (field === 'color') {
      console.log(`🎨 Color changed for ${updatedTicketTypes[index].name}: ${value}`);
    }
  };

  const addTicketType = () => {
    // Mark as manually editing when user adds ticket type
    setIsEditingTicketTypesManually(true);
    
    // Generate màu ngẫu nhiên cho ticket type mới
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#F59E0B', '#06B6D4', '#84CC16'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setTicketTypes([...ticketTypes, {
      name: '',
      price: 0,
      description: '',
      quantity: 0,
      color: randomColor
    }]);
  };

  const removeTicketType = (index) => {
    if (ticketTypes.length > 1) {
      // Mark as manually editing when user removes ticket type
      setIsEditingTicketTypesManually(true);
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const nextStep = () => {
    // Validation cho step 1 (thông tin cơ bản)
    if (currentStep === 1) {
      if (!eventData.startDate || !eventData.endDate) {
        setMessage('Vui lòng điền đầy đủ Ngày bắt đầu và Ngày kết thúc với giờ cụ thể.');
        return;
      }
      
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      const now = new Date();
      
      // Kiểm tra thời gian trong tương lai
      if (startDate <= now) {
        setMessage('Ngày bắt đầu phải trong tương lai (ít nhất 1 giờ từ bây giờ).');
        return;
      }
      
      if (startDate >= endDate) {
        setMessage('Ngày kết thúc phải sau ngày bắt đầu.');
        return;
      }
      
      // Kiểm tra thời lượng tối thiểu (ít nhất 30 phút)
      const diffMs = endDate - startDate;
      if (diffMs < 30 * 60 * 1000) {
        setMessage('Sự kiện phải có thời lượng ít nhất 30 phút.');
        return;
      }
      
      // Clear message nếu validation pass
      setMessage('');
    }
    
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Handle event data change
  const handleEventDataChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties like location.venueName
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEventData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Debug: Log current state before validation
      console.log('🎛️ Form submit debug:');
      console.log('  - customSeatingMap sections:', customSeatingMap?.sections?.length || 0);
      console.log('  - ticketTypes:', ticketTypes.length);

      // Validate input
      if (!eventData) {
        setMessage('Không có dữ liệu sự kiện. Vui lòng quay lại bước trước.');
        setLoading(false);
        return;
      }

      // Validate seating map
      if (!customSeatingMap || !customSeatingMap.sections || customSeatingMap.sections.length === 0) {
        setMessage('Vui lòng thiết kế sơ đồ chỗ ngồi.');
        setLoading(false);
        return;
      }

      if (ticketTypes.some(tt => !tt.name || tt.price <= 0 || tt.quantity <= 0)) {
        setMessage('Vui lòng điền đầy đủ thông tin loại vé và đảm bảo giá, số lượng > 0.');
        setLoading(false);
        return;
      }

      // Calculate total capacity
      let totalCapacity;
      let finalCustomSeatingMap = customSeatingMap;
      
      // Auto-arrange sections to prevent overlapping
      console.log('🔧 Auto-arranging sections to prevent overlaps...');
      finalCustomSeatingMap = autoArrangeSections(customSeatingMap);
      
      // Log changes if any
      const hasChanges = finalCustomSeatingMap.sections.some((section, index) => {
        const original = customSeatingMap.sections[index];
        return original && (section.x !== original.x || section.y !== original.y);
      });
      
      if (hasChanges) {
        console.log('✅ Sections auto-arranged to prevent overlaps');
        // Update state to show arranged positions (optional)
        setCustomSeatingMap(finalCustomSeatingMap);
        
        // Show success message
        setMessage('🔧 Các sections đã được tự động căn chỉnh để tránh chồng lấp. Vị trí tổng thể vẫn được giữ nguyên.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        console.log('✅ No overlapping sections detected');
      }
      
      totalCapacity = finalCustomSeatingMap.sections.reduce((total, section) => total + (section.capacity || 0), 0);

      const totalTicketQuantity = ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
      if (totalTicketQuantity !== totalCapacity) {
        setMessage(`Tổng số lượng vé (${totalTicketQuantity}) phải bằng tổng capacity (${totalCapacity}).`);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Prepare request payload
      const requestPayload = {
        ...eventData,
        seatingMap: finalCustomSeatingMap,
        ticketTypes: ticketTypes
      };
      
      console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await axios.post(
        'http://localhost:5001/api/events',
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setMessage('Tạo sự kiện thành công!');
        setTimeout(() => {
          navigate('/my-events');
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom seating map changes
  const handleCustomSeatingMapChange = (newSeatingMap) => {
    console.log(`🗺️ Seating map changed, manual editing flag: ${isEditingTicketTypesManually}`);
    setCustomSeatingMap(newSeatingMap);
    
    // Only auto-update ticket types if user hasn't manually edited them
    if (!isEditingTicketTypesManually) {
      console.log(`🔄 AUTO-UPDATE MODE: Creating new ticket types from sections`);
      // Auto-update ticket types based on sections - preserve existing colors
      const newTicketTypes = [];
      const sectionTicketTypes = new Set();
      
      newSeatingMap.sections.forEach(section => {
        if (section.ticketType && !sectionTicketTypes.has(section.ticketType)) {
          sectionTicketTypes.add(section.ticketType);
          const existingTicketType = ticketTypes.find(tt => tt.name === section.ticketType);
          
          // Calculate total capacity for this ticket type across all sections
          const totalCapacityForType = newSeatingMap.sections
            .filter(s => s.ticketType === section.ticketType)
            .reduce((sum, s) => sum + (s.capacity || 0), 0);
          
          newTicketTypes.push({
            name: section.ticketType,
            price: existingTicketType?.price || 300000,
            description: existingTicketType?.description || `Vé ${section.ticketType}`,
            quantity: totalCapacityForType,
            color: existingTicketType?.color || getDefaultColorForTicketType(section.ticketType)
          });
        }
      });
      
      if (newTicketTypes.length > 0) {
        console.log(`🔄 AUTO-UPDATE: Replacing ${ticketTypes.length} ticket types with ${newTicketTypes.length} new ones`);
        setTicketTypes(newTicketTypes);
        console.log('🎨 Auto-updated ticket types with preserved colors:', newTicketTypes);
      }
    } else {
      console.log(`🎛️ MANUAL MODE: Only updating quantities for existing ticket types`);
      // User is manually editing, only update quantities for matching ticket types
      const updatedTicketTypes = ticketTypes.map(tt => {
        const totalCapacityForType = newSeatingMap.sections
          .filter(s => s.ticketType === tt.name)
          .reduce((sum, s) => sum + (s.capacity || 0), 0);
        
        // Only update quantity if there are sections with this ticket type
        if (totalCapacityForType > 0) {
          return { ...tt, quantity: totalCapacityForType };
        }
        return tt;
      });
      
      setTicketTypes(updatedTicketTypes);
      console.log('🔄 Updated quantities only for existing ticket types (manual mode):', updatedTicketTypes);
    }
  };

  // Helper function to get default color for ticket type
  const getDefaultColorForTicketType = (ticketTypeName) => {
    const colorMap = {
      'VIP': '#8B5CF6',
      'Premium': '#F59E0B',
      'Standard': '#3B82F6',
      'Economy': '#10B981',
      'Golden': '#FFD700',
      'Silver': '#C0C0C0'
    };
    
    return colorMap[ticketTypeName] || '#6B7280';
  };

  // Auto-arrange sections to prevent overlapping
  const autoArrangeSections = (seatingMap) => {
    if (!seatingMap || !seatingMap.sections || seatingMap.sections.length === 0) {
      return seatingMap; // Nothing to arrange
    }

    // Clone to avoid mutation
    const clonedMap = JSON.parse(JSON.stringify(seatingMap));
    
    const isOverlapping = (rect1, rect2) => {
      // Thêm margin để đảm bảo khoảng cách an toàn
      const margin = 25; // Tăng lên từ 15 để đảm bảo khoảng cách lớn hơn
      return rect1.x < rect2.x + rect2.width + margin &&
         rect1.x + rect1.width + margin > rect2.x &&
         rect1.y < rect2.y + rect2.height + margin &&
         rect1.y + rect1.height + margin > rect2.y;
    };
    
    const arrangeInGrid = (sections) => {
      // Calculate optimal spacing based on layout type
      const layoutType = clonedMap.layoutType || 'custom';
      
      // Xác định khoảng cách giữa các khu vực dựa trên loại layout
      const spacingConfig = {
        footballStadium: {
          horizontalGap: 150,  // Tăng từ 100
          verticalGap: 120,    // Tăng từ 80
          stagePadding: 300,   // Tăng từ 250
          startX: 100,
          startY: 300,
          sectionPadding: 30   // Tăng từ 15
        },
        basketballArena: {
          horizontalGap: 120,  // Tăng từ 80
          verticalGap: 100,    // Tăng từ 70
          stagePadding: 250,   // Tăng từ 220
          startX: 120,
          startY: 280,
          sectionPadding: 25   // Tăng từ 12
        },
        default: {
          horizontalGap: 80,   // Tăng từ 60
          verticalGap: 70,     // Tăng từ 50
          stagePadding: 150,   // Tăng từ 120
          startX: 50,
          startY: 200,
          sectionPadding: 20   // Tăng từ 10
        }
      };
      
      const config = spacingConfig[layoutType] || spacingConfig.default;

      // Define stage padding - space around the stage
      const stage = clonedMap.stage || { x: 400, y: 50, width: 200, height: 60 };
      const stageBottom = stage.y + stage.height;

      // Get max width and height of sections for better arrangement
      let maxSectionWidth = 0;
      let maxSectionHeight = 0;
      sections.forEach(section => {
        maxSectionWidth = Math.max(maxSectionWidth, section.width || 120);
        maxSectionHeight = Math.max(maxSectionHeight, section.height || 100);
      });

      // Tăng kích thước tối thiểu để giảm chồng lấn
      maxSectionWidth = Math.max(maxSectionWidth, 180);  // Tăng từ 150
      maxSectionHeight = Math.max(maxSectionHeight, 150); // Tăng từ 120

      // Determine column count based on screen space
      const totalWidth = CANVAS_WIDTH - config.startX * 2;
      const columnsCount = Math.floor(totalWidth / (maxSectionWidth + config.horizontalGap));
      const columns = Math.max(1, Math.min(columnsCount, 3)); // Giảm từ 4 xuống 3 cột

      // Special layout for stadium/arena types
      if (['footballStadium', 'basketballArena'].includes(layoutType)) {
        // Place sections in U shape around the stage/field
        const leftStart = stage.x - config.stagePadding;
        const rightStart = stage.x + stage.width + config.horizontalGap;
        const bottomStart = stageBottom + config.verticalGap;
        
        // Calculate how many sections on each side
        const totalSections = sections.length;
        const sectionsPerSide = Math.max(1, Math.ceil(totalSections / 3));
        
        // Phân bổ lại các khu vực xung quanh sân
        sections.forEach((section, index) => {
          // Đặt độ rộng và cao tối thiểu để tránh sections quá nhỏ
          section.width = Math.max(section.width || 180, 180);
          section.height = Math.max(section.height || 150, 150);
          
          // Tính toán vị trí dựa trên index
          const groupIndex = Math.floor(index / sectionsPerSide);
          const indexInGroup = index % sectionsPerSide;
          
          if (groupIndex === 0) {
            // Left side sections - Đặt các khu vực bên trái cách xa hơn
            section.x = leftStart - section.width - config.sectionPadding * (indexInGroup + 1) * 1.5;
            section.y = stageBottom + indexInGroup * (section.height + config.verticalGap);
          } else if (groupIndex === 1) {
            // Bottom sections - Đặt các khu vực dưới cùng cách xa hơn
            const totalWidth = sectionsPerSide * section.width + (sectionsPerSide - 1) * config.horizontalGap * 1.5;
            const startX = stage.x + (stage.width - totalWidth) / 2;
            
            section.x = startX + indexInGroup * (section.width + config.horizontalGap * 1.5);
            section.y = bottomStart + config.stagePadding;
          } else {
            // Right side sections - Đặt các khu vực bên phải cách xa hơn
            section.x = rightStart + config.sectionPadding * (indexInGroup + 1) * 1.5;
            section.y = stageBottom + indexInGroup * (section.height + config.verticalGap);
          }
          
          // Đảm bảo nhãn khu vực được đặt ở vị trí phù hợp
          section.labelX = section.x + section.width / 2;
          section.labelY = section.y - 20;
        });
      } else {
        // Non-sports venues - standard grid layout with improved spacing
        const rows = Math.ceil(sections.length / columns);
        const horizontalSpacing = config.horizontalGap + maxSectionWidth;
        const verticalSpacing = config.verticalGap + maxSectionHeight;
        
        sections.forEach((section, index) => {
          // Đặt độ rộng và cao tối thiểu để tránh sections quá nhỏ
          section.width = Math.max(section.width || 180, 180);
          section.height = Math.max(section.height || 150, 150);
          
          // Calculate position based on grid pattern
          const row = Math.floor(index / columns);
          const col = index % columns;
          
          // Position below stage with padding
          const topStart = stageBottom + config.stagePadding;
          
          section.x = config.startX + col * (horizontalSpacing + 20); // Thêm 20px spacing
          section.y = topStart + row * (verticalSpacing + 20); // Thêm 20px spacing
          
          // Đảm bảo nhãn khu vực được đặt ở vị trí phù hợp
          section.labelX = section.x + section.width / 2;
          section.labelY = section.y - 20;
        });
      }
      
      // Check for any overlaps and fix them
      let hasOverlap = true;
      const maxIterations = 15; // Tăng từ 10 lên 15
      let iteration = 0;
      
      while (hasOverlap && iteration < maxIterations) {
        hasOverlap = false;
        iteration++;
        
        // Check all pairs of sections for overlaps
        for (let i = 0; i < sections.length; i++) {
          for (let j = i + 1; j < sections.length; j++) {
            const section1 = sections[i];
            const section2 = sections[j];
            
            if (isOverlapping(section1, section2)) {
              hasOverlap = true;
              // Move section2 to avoid overlap - sử dụng chiến lược phân tán
              if (section1.x <= section2.x) {
                // section2 nằm bên phải section1
                section2.x = section1.x + section1.width + config.sectionPadding * 2;
              } else {
                // section2 nằm bên trái section1
                section2.x = section1.x - section2.width - config.sectionPadding * 2;
              }
              
              // Nếu vẫn chồng lên theo chiều dọc
              if (isOverlapping(section1, section2)) {
                if (section1.y <= section2.y) {
                  // section2 nằm bên dưới section1
                  section2.y = section1.y + section1.height + config.sectionPadding * 2;
                } else {
                  // section2 nằm bên trên section1
                  section2.y = section1.y - section2.height - config.sectionPadding * 2;
                }
              }
              
              // Cập nhật lại vị trí nhãn
              section2.labelX = section2.x + section2.width / 2;
              section2.labelY = section2.y - 20;
            }
          }
        }
      }
      
      return sections;
    };
    
    clonedMap.sections = arrangeInGrid(clonedMap.sections);
    return clonedMap;
  };

  // Switch between design modes
  const handleDesignModeChange = (mode) => {
    // Luôn đặt mode là 'custom' bất kể input
    setDesignMode('custom');
    
    // Reset manual editing flag
    setIsEditingTicketTypesManually(false);
  };

  useEffect(() => {
    if (seatOptions.venueType && (!customSeatingMap || customSeatingMap.layoutType !== seatOptions.venueType)) {
      // Update stage and layout type when venue type changes
      const newStage = getInitialStage(seatOptions.venueType);
      setCustomSeatingMap(prevMap => ({
        ...prevMap,
        stage: newStage,
        layoutType: seatOptions.venueType
      }));
    }
  }, [seatOptions.venueType]);

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>🎪 Tạo Sự Kiện Có Chỗ Ngồi</h2>
        <p>Tạo sự kiện với hệ thống quản lý chỗ ngồi thông minh</p>
        
        {/* Progress indicator - Bỏ bước 1 */}
        <div className="progress-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Thông tin</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Cấu hình</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Xác nhận</div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-event-form">
        
        {/* Bỏ Step 1: Venue Template Selection */}
        
        {/* Step 1: Basic Event Info (đổi từ step 2) */}
        {currentStep === 1 && (
          <div className="form-section">
            <h3>📝 Thông Tin Sự Kiện</h3>
            
            {/* Upload Images Section */}
            <div className="form-section">
              <h4>🖼️ Hình Ảnh Sự Kiện</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUpload
                  image={eventData.images.logo}
                  handleImageUpload={handleImageUpload}
                  type="logo"
                  title="Thêm logo sự kiện"
                  description="(Tỷ lệ 720x950, tối đa 5MB)"
                />
                <ImageUpload
                  image={eventData.images.banner}
                  handleImageUpload={handleImageUpload}
                  type="banner"
                  title="Thêm ảnh nền sự kiện"
                  description="(Tỷ lệ 1200x720, tối đa 10MB)"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">Tên sự kiện *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={eventData.title}
                onChange={handleEventDataChange}
                placeholder="Ví dụ: Concert nhạc pop 2024"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả ngắn *</label>
              <textarea
                id="description"
                name="description"
                value={eventData.description}
                onChange={handleEventDataChange}
                placeholder="Mô tả ngắn gọn về sự kiện"
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Ngày bắt đầu *</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={eventData.startDate}
                  onChange={handleEventDataChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">Ngày kết thúc *</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={eventData.endDate}
                  onChange={handleEventDataChange}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="venueName">Tên địa điểm</label>
              <input
                type="text"
                id="venueName"
                name="location.venueName"
                value={eventData.location.venueName}
                onChange={handleEventDataChange}
                placeholder="Ví dụ: Sân vận động Mỹ Đình"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input
                type="text"
                id="address"
                name="location.address"
                value={eventData.location.address}
                onChange={handleEventDataChange}
                placeholder="Địa chỉ cụ thể"
              />
            </div>

            {/* Organizer Information Section */}

            
            <div className="step-actions">
              <button type="button" onClick={nextStep}>Tiếp theo →</button>
            </div>
          </div>
        )}

        {/* Step 2: Seat & Ticket Configuration (đổi từ step 3) */}
        {currentStep === 2 && (
          <>
            {/* Bỏ Design Mode Selection */}
            
            {/* Custom Mode */}
            <div className="form-section">
              <h3>🎨 Thiết kế sơ đồ tùy chỉnh</h3>
              <p>Kéo thả các khu vực, sân khấu để tạo layout phù hợp với sự kiện của bạn</p>
              
              {/* Info about auto-arrange */}
              <div className="info-box">
                <p>ℹ️ <strong>Lưu ý:</strong> Khi tạo sự kiện, hệ thống sẽ tự động căn chỉnh các sections để tránh chồng lấp, nhưng vẫn giữ nguyên layout tổng thể mà bạn đã thiết kế.</p>
              </div>
              
              {/* Auto-arrange button */}
              <div className="auto-arrange-section">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    console.log('🔧 Manual auto-arrange triggered');
                    const arrangedMap = autoArrangeSections(customSeatingMap);
                    setCustomSeatingMap(arrangedMap);
                    console.log('✅ Sections auto-arranged manually');
                  }}
                >
                  🔧 Xem trước căn chỉnh tự động
                </button>
                <small>Kiểm tra cách hệ thống sẽ căn chỉnh các sections để tránh chồng lấp</small>
              </div>
              
              <InteractiveSeatingDesigner
                initialSeatingMap={customSeatingMap}
                onSeatingMapChange={handleCustomSeatingMapChange}
                ticketTypes={ticketTypes}
                onTicketTypesChange={setTicketTypes}
              />
            </div>

            {/* Ticket Types */}
            <div className="form-section">
              <h3>🎫 Loại Vé</h3>
              <p>Thiết lập các loại vé cho sự kiện của bạn.</p>
              
              {/* Manual editing indicator */}
              {isEditingTicketTypesManually && (
                <div className="manual-editing-indicator">
                  <p>📝 Bạn đang chỉnh sửa thủ công. Ticket types sẽ không tự động sync với seating map.</p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditingTicketTypesManually(false)}
                  >
                    🔄 Bật lại Auto-sync với seating map
                  </button>
                </div>
              )}
              
              {ticketTypes.map((ticketType, index) => (
                <div key={index} className="ticket-type-item">
                  <div className="ticket-type-header">
                    <h4>🎫 {ticketType.name || `Loại vé ${index + 1}`}</h4>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        className="remove-ticket-type"
                        onClick={() => removeTicketType(index)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên loại vé *</label>
                      <input
                        type="text"
                        value={ticketType.name}
                        onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                        placeholder="VIP, Thường, ..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Giá (VND) *</label>
                      <input
                        type="number"
                        value={ticketType.price}
                        onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                        min="0"
                        placeholder="500000"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Số lượng *</label>
                      <input
                        type="number"
                        value={ticketType.quantity}
                        onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Màu sắc</label>
                      <div className="color-picker-container">
                        <input
                          type="color"
                          value={ticketType.color || '#6B7280'}
                          onChange={(e) => handleTicketTypeChange(index, 'color', e.target.value)}
                          className="color-picker"
                        />
                        <span className="color-preview" style={{ backgroundColor: ticketType.color || '#6B7280' }}></span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      value={ticketType.description}
                      onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                      placeholder="Mô tả về loại vé này"
                      rows="2"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="add-ticket-type"
                onClick={addTicketType}
              >
                + Thêm loại vé
              </button>

              <div className="step-actions">
                <button type="button" onClick={prevStep}>← Quay lại</button>
                <button type="button" onClick={nextStep}>Tiếp theo →</button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirmation (đổi từ step 4) */}
        {currentStep === 3 && (
          <div className="form-section">
            <h3>✅ Xác Nhận Thông Tin</h3>
            <p>Vui lòng kiểm tra lại thông tin trước khi tạo sự kiện</p>
            
            <div className="confirmation-details">
              <div className="confirmation-section">
                <h4>📝 Thông Tin Sự Kiện</h4>
                <div className="confirmation-item">
                  <span>Tên sự kiện:</span>
                  <strong>{eventData.title}</strong>
                </div>
                <div className="confirmation-item">
                  <span>Thời gian:</span>
                  <strong>
                    {new Date(eventData.startDate).toLocaleString('vi-VN')} - {new Date(eventData.endDate).toLocaleString('vi-VN')}
                  </strong>
                </div>
                <div className="confirmation-item">
                  <span>Địa điểm:</span>
                  <strong>{eventData.location.venueName}, {eventData.location.address}</strong>
                </div>
              </div>
              
              <div className="confirmation-section">
                <h4>🎫 Thông Tin Vé</h4>
                <div className="ticket-types-summary">
                  {ticketTypes.map((tt, index) => (
                    <div key={index} className="ticket-type-summary">
                      <div className="ticket-color" style={{ backgroundColor: tt.color }}></div>
                      <div className="ticket-details">
                        <strong>{tt.name}</strong>
                        <span>{tt.quantity} vé × {tt.price.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="confirmation-item total">
                  <span>Tổng số vé:</span>
                  <strong>{ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0)} vé</strong>
                </div>
              </div>
              
              <div className="confirmation-section">
                <h4>🗺️ Sơ Đồ Chỗ Ngồi</h4>
                <div className="seating-map-summary">
                  <p>Sơ đồ tùy chỉnh với {customSeatingMap.sections.length} khu vực</p>
                  <div className="seating-preview-container">
                    <SeatingPreview 
                      seatingMap={customSeatingMap} 
                      showLabels={true}
                      interactive={false}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="step-actions">
              <button type="button" onClick={prevStep}>← Quay lại</button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? '🔄 Đang xử lý...' : '✅ Tạo Sự Kiện'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateEventWithSeating; 