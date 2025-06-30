import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUpload from '../../components/event/ImageUpload';
import SeatingPreview from '../../components/seating/SeatingPreview';
import InteractiveSeatingDesigner from '../../components/seating/InteractiveSeatingDesigner';
import './CreateEvent.css';

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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
};

const CreateEventWithSeating = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const templateInfo = location.state;
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVenueTemplate, setSelectedVenueTemplate] = useState(null);
  const [previewSeatingMap, setPreviewSeatingMap] = useState(null);
  const [designMode, setDesignMode] = useState('template'); // 'template' or 'custom'
  const [customSeatingMap, setCustomSeatingMap] = useState({
    layoutType: 'custom',
    sections: [],
    stage: { x: 400, y: 50, width: 200, height: 60 }
  });
  const [isEditingTicketTypesManually, setIsEditingTicketTypesManually] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: {
      type: 'offline',
      venueName: '',
      address: '',
      city: 'TP.HCM'
    },
    category: [],
    tags: [],
    visibility: 'public',
    status: 'pending',
    detailedDescription: {
      mainProgram: '',
      guests: '',
      specialExperiences: ''
    },
    termsAndConditions: '',
    images: {
      logo: '',
      banner: ''
    },
    organizer: {
      logo: '',
      name: '',
      info: ''
    }
  });

  const [seatOptions, setSeatOptions] = useState({
    totalSeats: 200,
    totalSections: 6,
    venueType: 'theater'
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

  // Apply venue template
  const applyVenueTemplate = (templateKey) => {
    const template = VENUE_TEMPLATES[templateKey];
    setSelectedVenueTemplate(templateKey);
    
    // Reset manual editing flag when applying template
    setIsEditingTicketTypesManually(false);
    
    setSeatOptions({
      totalSeats: template.defaultSeats,
      totalSections: template.defaultSections,
      venueType: template.layoutType
    });

    // Calculate ticket quantities based on percentages and preserve colors
    const calculatedTicketTypes = template.ticketTypeTemplates.map(tt => ({
      ...tt,
      quantity: Math.floor(template.defaultSeats * tt.percentage / 100)
    }));

    setTicketTypes(calculatedTicketTypes);
    console.log('🎨 Applied template with colored ticket types:', calculatedTicketTypes);
    
    // Generate preview với template mới
    setTimeout(() => {
      generatePreviewMap(template.defaultSeats, template.defaultSections, template.layoutType);
    }, 100);
  };

  // Smart seat distribution when changing total seats - preserve colors
  const handleSeatChange = (newTotalSeats) => {
    if (selectedVenueTemplate) {
      const template = VENUE_TEMPLATES[selectedVenueTemplate];
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
  const generatePreviewMap = async (totalSeats = seatOptions.totalSeats, totalSections = seatOptions.totalSections, venueType = seatOptions.venueType) => {
    try {
      console.log('🔄 Generating preview...', { totalSeats, totalSections, venueType });
      
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
        setPreviewSeatingMap(response.data.data);
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
      
      setPreviewSeatingMap({
        layoutType: venueType,
        sections: mockSections,
        stage: { x: 250, y: 20, width: 300, height: 60 }
      });
    }
  };

  const handleEventDataChange = (e) => {
    const { name, value } = e.target;
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
      setEventData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventData(prev => ({
            ...prev,
            images: {
              ...prev.images,
              [imageType]: reader.result
            }
          }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append(imageType, file);

        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5001/api/events/upload-images',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          // Update with server URL
          setEventData(prev => ({
            ...prev,
            images: {
              ...prev.images,
              [`${imageType}_url`]: `http://localhost:5001${response.data.data[imageType]}`
            }
          }));
          toast.success(`Upload ${imageType} thành công!`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Lỗi upload ${imageType}`);
      }
    }
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
    // Validation cho step 2 (thông tin cơ bản)
    if (currentStep === 2) {
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
    
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Debug: Log current state before validation
      console.log('🎛️ Form submit debug:');
      console.log('  - designMode:', designMode);
      console.log('  - seatOptions:', seatOptions);
      console.log('  - customSeatingMap sections:', customSeatingMap?.sections?.length || 0);
      console.log('  - ticketTypes:', ticketTypes.length);

      // Validate input
      if (!eventData.title || !eventData.description || !eventData.startDate || !eventData.endDate) {
        setMessage('Vui lòng điền đầy đủ thông tin cơ bản của sự kiện.');
        setLoading(false);
        return;
      }

      // Validate design mode specific requirements
      if (designMode === 'template') {
      if (seatOptions.totalSeats < 1 || seatOptions.totalSections < 1) {
        setMessage('Số ghế và số khu phải lớn hơn 0.');
        setLoading(false);
        return;
        }
      } else if (designMode === 'custom') {
        if (!customSeatingMap || !customSeatingMap.sections || customSeatingMap.sections.length === 0) {
          setMessage('Vui lòng thiết kế sơ đồ chỗ ngồi hoặc chuyển về template mode.');
          setLoading(false);
          return;
        }
      }

      if (ticketTypes.some(tt => !tt.name || tt.price <= 0 || tt.quantity <= 0)) {
        setMessage('Vui lòng điền đầy đủ thông tin loại vé và đảm bảo giá, số lượng > 0.');
        setLoading(false);
        return;
      }

      // Calculate total capacity based on design mode
      let totalCapacity;
      let finalCustomSeatingMap = customSeatingMap;
      
      if (designMode === 'custom') {
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
      } else {
        totalCapacity = seatOptions.totalSeats;
      }

      const totalTicketQuantity = ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
      if (totalTicketQuantity !== totalCapacity) {
        setMessage(`Tổng số lượng vé (${totalTicketQuantity}) phải bằng tổng capacity (${totalCapacity}).`);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Prepare images data với server URLs
      const imagesToSend = {
        logo: eventData.images.logo_url || eventData.images.logo || '',
        banner: eventData.images.banner_url || eventData.images.banner || ''
      };
      
      // Prepare organizer data với server URL  
      const organizerToSend = {
        ...eventData.organizer,
        logo: eventData.organizer.logo_url || eventData.organizer.logo || ''
      };
      
      console.log('📸 Images to send:', imagesToSend);
      console.log('👥 Organizer to send:', organizerToSend);
      
      // Debug: Log request payload
      const requestPayload = {
          ...eventData,
          images: imagesToSend,
          organizer: organizerToSend,
        seatOptions: designMode === 'template' ? seatOptions : undefined,
        customSeatingMap: designMode === 'custom' ? finalCustomSeatingMap : undefined,
        designMode,
          ticketTypes,
        templateType: 'seating'
      };
      console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await axios.post(
        'http://localhost:5001/api/events/create-with-seating',
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMessage('Tạo sự kiện thành công!');
        setTimeout(() => {
          navigate(`/events/${response.data.data._id}`);
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
      return seatingMap;
    }

    const arrangedMap = { ...seatingMap };
    let sections = [...arrangedMap.sections];
    
    // Helper function to check if two rectangles overlap
    const isOverlapping = (rect1, rect2) => {
      const margin = 30; // Minimum margin between sections
      return !(
        rect1.x + (rect1.width || 150) + margin <= rect2.x ||
        rect2.x + (rect2.width || 150) + margin <= rect1.x ||
        rect1.y + (rect1.height || 100) + margin <= rect2.y ||
        rect2.y + (rect2.height || 100) + margin <= rect1.y
      );
    };

    // Smart grid-based arrangement
    const arrangeInGrid = (sections) => {
      // Calculate stage position for reference
      const stage = seatingMap.stage || { x: 400, y: 50, width: 200, height: 60 };
      
      // Sort sections by distance from stage (VIP sections closer)
      const sortedSections = [...sections].sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - stage.x, 2) + Math.pow(a.y - stage.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - stage.x, 2) + Math.pow(b.y - stage.y, 2));
        return distA - distB;
      });

      const arrangedSections = [];
      const sectionWidth = 180; // Standard width with margin
      const sectionHeight = 130; // Standard height with margin
      const startX = Math.max(50, stage.x - sectionWidth * 2);
      const startY = stage.y + (stage.height || 60) + 50; // Below stage
      
      let currentRow = 0;
      let currentCol = 0;
      const maxCols = Math.floor(1000 / sectionWidth); // Max sections per row
      
      sortedSections.forEach((section, index) => {
        // Try original position first if it doesn't overlap
        let finalX = section.x;
        let finalY = section.y;
        let needsRepositioning = false;
        
        // Check if original position overlaps with arranged sections
        const testSection = { ...section, x: finalX, y: finalY };
        const hasOverlap = arrangedSections.some(arranged => 
          isOverlapping(testSection, arranged)
        );
        
        // Also check if too close to stage
        const tooCloseToStage = isOverlapping(testSection, stage);
        
        if (hasOverlap || tooCloseToStage) {
          needsRepositioning = true;
          
          // Use grid positioning
          finalX = startX + (currentCol * sectionWidth);
          finalY = startY + (currentRow * sectionHeight);
          
          // If still overlaps, try next position
          let attempts = 0;
          while (attempts < maxCols * 5) {
            const gridTestSection = { ...section, x: finalX, y: finalY };
            const gridHasOverlap = arrangedSections.some(arranged => 
              isOverlapping(gridTestSection, arranged)
            );
            
            if (!gridHasOverlap && !isOverlapping(gridTestSection, stage)) {
              break;
            }
            
            // Move to next grid position
            currentCol++;
            if (currentCol >= maxCols) {
              currentCol = 0;
              currentRow++;
            }
            
            finalX = startX + (currentCol * sectionWidth);
            finalY = startY + (currentRow * sectionHeight);
            attempts++;
          }
          
          console.log(`🔧 Auto-arranged section "${section.name}" from (${section.x}, ${section.y}) to (${finalX}, ${finalY})`);
        }
        
        arrangedSections.push({
          ...section,
          x: finalX,
          y: finalY
        });
        
        // Move to next grid position for next section that needs repositioning
        if (needsRepositioning) {
          currentCol++;
          if (currentCol >= maxCols) {
            currentCol = 0;
            currentRow++;
          }
        }
      });
      
      return arrangedSections;
    };

    // Apply smart arrangement
    const finalSections = arrangeInGrid(sections);
    arrangedMap.sections = finalSections;
    
    console.log(`🎯 Auto-arrange completed: ${finalSections.length} sections arranged`);
    return arrangedMap;
  };

  // Switch between design modes
  const handleDesignModeChange = (mode) => {
    setDesignMode(mode);
    
    // Reset manual editing flag when switching design mode
    setIsEditingTicketTypesManually(false);
    
    if (mode === 'custom') {
      // Initialize custom map with current template if available
      if (previewSeatingMap && previewSeatingMap.sections.length > 0) {
        setCustomSeatingMap({
          ...previewSeatingMap,
          layoutType: 'custom'
        });
      }
    }
  };

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>🎪 Tạo Sự Kiện Có Chỗ Ngồi</h2>
        <p>Tạo sự kiện với hệ thống quản lý chỗ ngồi thông minh</p>
        
        {templateInfo && (
          <div className="text-center mb-4">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
              📋 Template: {templateInfo.templateName}
            </span>
          </div>
        )}
        
        {/* Progress indicator */}
        <div className="progress-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Template</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Thông tin</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Cấu hình</div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. Xác nhận</div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-event-form">
        
        {/* Step 1: Venue Template Selection */}
        {currentStep === 1 && (
          <div className="form-section">
            <h3>🏟️ Chọn Loại Địa Điểm</h3>
            <p>Chọn template phù hợp với sự kiện của bạn để được tự động cấu hình tối ưu</p>
            
            <div className="venue-templates">
              {Object.entries(VENUE_TEMPLATES).map(([key, template]) => (
                <div 
                  key={key}
                  className={`venue-template ${selectedVenueTemplate === key ? 'selected' : ''}`}
                  onClick={() => applyVenueTemplate(key)}
                >
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-stats">
                    <span>📍 {template.defaultSections} khu vực</span>
                    <span>🪑 {template.defaultSeats} ghế</span>
                    <span>🎫 {template.ticketTypeTemplates.length} loại vé</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="step-actions">
              <button type="button" onClick={nextStep} disabled={!selectedVenueTemplate}>
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Basic Event Info */}
        {currentStep === 2 && (
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
              <button type="button" onClick={prevStep}>← Quay lại</button>
              <button type="button" onClick={nextStep}>Tiếp theo →</button>
            </div>
          </div>
        )}

        {/* Step 3: Seat & Ticket Configuration */}
        {currentStep === 3 && (
          <>
            {/* Design Mode Selection */}
            <div className="form-section">
              <h3>🎭 Thiết kế sơ đồ chỗ ngồi</h3>
              <p>Chọn cách bạn muốn thiết kế sơ đồ chỗ ngồi cho sự kiện</p>
              
              <div className="design-mode-selector">
                <div 
                  className={`design-mode-option ${designMode === 'template' ? 'selected' : ''}`}
                  onClick={() => handleDesignModeChange('template')}
                >
                  <div className="mode-icon">📋</div>
                  <h4>Sử dụng Template</h4>
                  <p>Dùng template có sẵn với layout tự động</p>
                  <ul>
                    <li>✅ Nhanh chóng, đơn giản</li>
                    <li>✅ Layout được tối ưu sẵn</li>
                    <li>✅ Phù hợp cho sự kiện cơ bản</li>
                  </ul>
                </div>
                
                <div 
                  className={`design-mode-option ${designMode === 'custom' ? 'selected' : ''}`}
                  onClick={() => handleDesignModeChange('custom')}
                >
                  <div className="mode-icon">🎨</div>
                  <h4>Thiết kế tùy chỉnh</h4>
                  <p>Kéo thả và tùy chỉnh từng khu vực</p>
                  <ul>
                    <li>🎯 Linh hoạt 100%</li>
                    <li>🎯 Tùy chỉnh vị trí tự do</li>
                    <li>🎯 Phù hợp cho sự kiện phức tạp</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Template Mode */}
            {designMode === 'template' && (
              <div className="form-section">
                <h3>🪑 Cấu Hình Ghế Ngồi (Template)</h3>
              <p>Template đã được cấu hình tự động. Bạn có thể điều chỉnh theo nhu cầu.</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalSeats">Tổng số ghế *</label>
                  <input
                    type="number"
                    id="totalSeats"
                    name="totalSeats"
                    value={seatOptions.totalSeats}
                    onChange={handleSeatOptionsChange}
                    min="1"
                    max="1000"
                    required
                  />
                  <small>Số vé sẽ được điều chỉnh tự động theo tỷ lệ</small>
                </div>

                <div className="form-group">
                  <label htmlFor="totalSections">Số khu vực *</label>
                  <input
                    type="number"
                    id="totalSections"
                    name="totalSections"
                    value={seatOptions.totalSections}
                    onChange={handleSeatOptionsChange}
                    min="1"
                    max="20"
                    required
                  />
                  <small>Layout {selectedVenueTemplate} với {seatOptions.totalSections} khu</small>
                </div>
              </div>

              {/* Live Seating Preview */}
              <div className="seating-preview-section">
                <h4>🎯 Xem Trước Sơ Đồ Ghế</h4>
                <p>{seatOptions.totalSeats} ghế phân bố thông minh trong {seatOptions.totalSections} khu vực theo layout {selectedVenueTemplate}</p>
                
                {previewSeatingMap ? (
                  <SeatingPreview 
                    seatingMap={previewSeatingMap} 
                    showLabels={true}
                    interactive={false}
                  />
                ) : (
                  <div className="preview-loading">
                    <p>🔄 Đang tạo preview...</p>
                    <small>Hãy chọn template và cấu hình để xem preview</small>
                  </div>
                )}
                
                <div className="preview-actions">
                  <button 
                    type="button" 
                    onClick={() => generatePreviewMap()}
                    className="btn-secondary"
                  >
                    🔄 Cập nhật preview
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Custom Mode */}
            {designMode === 'custom' && (
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
                  layoutType={selectedVenueTemplate}
                />
              </div>
            )}

            {/* Ticket Types */}
            <div className="form-section">
              <h3>🎫 Loại Vé</h3>
              <p>Đã được cấu hình tự động dựa trên template. Điều chỉnh giá và số lượng nếu cần.</p>
              
              {/* Manual editing indicator */}
              {isEditingTicketTypesManually && designMode === 'custom' && (
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
                        max={seatOptions.totalSeats}
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

              <div className="ticket-summary">
                <p><strong>📊 Tổng số vé:</strong> {ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0)} / {seatOptions.totalSeats} ghế</p>
                <p><strong>💰 Doanh thu dự kiến:</strong> {ticketTypes.reduce((sum, tt) => sum + (tt.price * tt.quantity), 0).toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
            
            <div className="step-actions">
              <button type="button" onClick={prevStep}>← Quay lại</button>
              <button type="button" onClick={nextStep}>Tiếp theo →</button>
            </div>
          </>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="form-section">
            <h3>✅ Xác Nhận Tạo Sự Kiện</h3>
            
            <div className="confirmation-summary">
              <div className="summary-item">
                <h4>📝 Thông tin sự kiện</h4>
                <p><strong>Tên:</strong> {eventData.title}</p>
                <p><strong>Địa điểm:</strong> {eventData.location.venueName || 'Chưa có'}</p>
                <p><strong>Thời gian:</strong> {new Date(eventData.startDate).toLocaleString('vi-VN')} - {new Date(eventData.endDate).toLocaleString('vi-VN')}</p>
              </div>
              
              <div className="summary-item">
                <h4>🏟️ Layout sự kiện</h4>
                <p><strong>Template:</strong> {VENUE_TEMPLATES[selectedVenueTemplate]?.name}</p>
                <p><strong>Tổng ghế:</strong> {seatOptions.totalSeats}</p>
                <p><strong>Số khu:</strong> {seatOptions.totalSections}</p>
              </div>
              
              <div className="summary-item">
                <h4>🎫 Danh sách vé</h4>
                {ticketTypes.map((tt, index) => (
                  <p key={index}><strong>{tt.name}:</strong> {tt.quantity} vé × {tt.price.toLocaleString('vi-VN')} VND</p>
                ))}
                <p><strong>💰 Tổng doanh thu dự kiến:</strong> {ticketTypes.reduce((sum, tt) => sum + (tt.price * tt.quantity), 0).toLocaleString('vi-VN')} VND</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="termsAndConditions">Điều khoản và điều kiện</label>
              <textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={eventData.termsAndConditions}
                onChange={handleEventDataChange}
                placeholder="Các quy định và điều kiện tham gia sự kiện"
                rows="4"
              />
            </div>
            
            <div className="step-actions">
              <button type="button" onClick={prevStep}>← Quay lại</button>
              <button
                type="submit"
                className="submit-btn primary"
                disabled={loading}
              >
                {loading ? '🔄 Đang tạo...' : '🎉 Tạo Sự Kiện'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateEventWithSeating; 