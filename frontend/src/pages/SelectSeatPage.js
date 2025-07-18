import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { toast } from 'react-toastify';
import AdvancedSeatingChart from '../components/AdvancedSeatingChart';

import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave } from 'react-icons/fa';
import { getEventPlaceholder, handleImageError } from '../utils/imageHelpers';


// Component Chú giải (Legend)
const SeatingChartLegend = ({ ticketTypes }) => {
    // Hàm tạo màu sắc cho từng loại vé (giống như trong AdvancedSeatingChart)
    const getTicketTypeColor = (ticketType, index) => {
        // Nếu ticketType đã có màu sắc, sử dụng nó
        if (ticketType?.color) {
            return ticketType.color;
        }
        
        // Màu sắc dựa trên tên loại vé
        const name = ticketType?.name?.toLowerCase() || '';
        
        if (name.includes('vvip') || name.includes('golden')) return '#FFD700'; // Vàng cho VVIP/Golden
        if (name.includes('vip')) return '#8B5CF6'; // Tím cho VIP  
        if (name.includes('thường') || name.includes('standard')) return '#3B82F6'; // Xanh dương cho thường
        if (name.includes('lầu') || name.includes('balcony')) return '#F59E0B'; // Cam cho lầu
        
        // Màu sắc mặc định dựa trên index
        const defaultColors = [
            '#3B82F6', // Blue
            '#8B5CF6', // Purple  
            '#10B981', // Green
            '#F59E0B', // Orange
            '#EF4444', // Red
            '#06B6D4', // Cyan
            '#84CC16', // Lime
            '#F472B6', // Pink
        ];
        
        return defaultColors[index % defaultColors.length];
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner mt-4">
            <h4 className="text-lg font-bold text-center text-gray-700 mb-3">CHÚ GIẢI</h4>
            <ul className="space-y-2">
                {ticketTypes.map((tt, index) => (
                    <li key={tt._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div 
                                className="w-4 h-4 rounded-full mr-3" 
                                style={{ backgroundColor: getTicketTypeColor(tt, index) }}
                            ></div>
                            <span className="text-gray-600">{tt.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                            {tt.price.toLocaleString('vi-VN')} đ
                        </span>
                    </li>
                ))}
                <li className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-3 bg-red-500"></div>
                        <span className="text-gray-600">Đã bán / Không thể chọn</span>
                    </div>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-3 bg-green-500"></div>
                        <span className="text-gray-600">Ghế bạn chọn</span>
                    </div>
                </li>
            </ul>
        </div>
    );
};

// Component Tóm tắt đơn hàng
const OrderSummary = ({ selectedSeats, totalAmount }) => (
    <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">TÓM TẮT ĐƠN HÀNG</h3>
        <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
            {selectedSeats.length > 0 ? (
                selectedSeats.map(seat => (
                    <div key={seat._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center">
                            <FaChair className="mr-2 text-gray-500" />
                            Ghế {seat.number} ({seat.sectionName})
                        </span>
                        <span className="font-medium text-gray-700">
                            {(seat.price || 0).toLocaleString('vi-VN')} đ
                        </span>
                    </div>
                ))
            ) : (
                <p className="text-gray-500 text-center py-4">Vui lòng chọn ghế từ sơ đồ.</p>
            )}
        </div>
        <div className="mt-4 pt-4 border-t-2 border-dashed">
            <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800 flex items-center">
                    <FaMoneyBillWave className="mr-2" />
                    TỔNG CỘNG
                </span>
                <span className="text-blue-600">
                    {totalAmount.toLocaleString('vi-VN')} đ
                </span>
            </div>
        </div>
    </div>
);


const SelectSeatPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Immediate protection against null/undefined eventId
    useEffect(() => {
        console.log('🔍 SelectSeatPage: eventId validation:', { id, type: typeof id });
        
        if (!id || id === 'null' || id === 'undefined') {
            console.error('❌ SelectSeatPage: Invalid eventId detected, redirecting to events list');
            toast.error('Không tìm thấy sự kiện. Chuyển về danh sách sự kiện...');
            navigate('/events', { replace: true });
            return;
        }
    }, [id, navigate]);

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);


     useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                console.log('🔍 SelectSeatPage: Fetching event with ID:', id);
                const response = await eventAPI.getEventById(id);
                console.log('📦 SelectSeatPage: API Response:', response);
                
                let eventDataFromResponse = null;
                
                if (response.success && response.data) {
                    eventDataFromResponse = response.data;
                } else if (response.data?.success) {
                    eventDataFromResponse = response.data.data;
                } else {
                    console.log('❌ SelectSeatPage: API returned unsuccessful response:', response);
                    toast.error('Không thể tải thông tin sự kiện.');
                    navigate('/');
                    return;
                }
                
                // Log thông tin sự kiện đã tải
                console.log('✅ SelectSeatPage: Event loaded successfully:', eventDataFromResponse.title);
                
                // Kiểm tra và log thông tin seatingMap
                console.log('🪑 SeatingMap data:', eventDataFromResponse.seatingMap);
                
                // Always generate a reliable demo seating map
                let shouldUseDemo = true;
                
                // Only use real seating map if it's fully valid
                if (eventDataFromResponse.seatingMap) {
                    console.log('✅ Found seatingMap in database:', eventDataFromResponse.seatingMap);
                    
                    // IMPORTANT: Always try to use the original seating map first
                    // Only fall back to demo if absolutely necessary
                    shouldUseDemo = false;
                    
                    // Ensure layoutType is set
                    if (!eventDataFromResponse.seatingMap.layoutType) {
                        eventDataFromResponse.seatingMap.layoutType = 'theater';
                    }
                    
                    // Ensure sections exist
                    if (!eventDataFromResponse.seatingMap.sections || !Array.isArray(eventDataFromResponse.seatingMap.sections) || eventDataFromResponse.seatingMap.sections.length === 0) {
                        console.warn('⚠️ No sections found in seating map, may need to use demo');
                        shouldUseDemo = true;
                    } else {
                        console.log(`✅ Found ${eventDataFromResponse.seatingMap.sections.length} sections in database seatingMap`);
                    }
                    
                    // Log the original seating map for debugging
                    console.log('Original seatingMap sections:', eventDataFromResponse.seatingMap.sections);
                    console.log('Original seatingMap venueObjects:', eventDataFromResponse.seatingMap.venueObjects);
                } else {
                    console.warn('⚠️ No valid seating map found, using demo instead');
                    shouldUseDemo = true;
                }
                
                if (shouldUseDemo) {
                    console.warn('⚠️ Generating demo seating map for event');
                    eventDataFromResponse.seatingMap = createDemoSeatingMap(eventDataFromResponse.ticketTypes || []);
                    
                    console.log('🎭 Generated demo seatingMap:', 
                        `${eventDataFromResponse.seatingMap.sections.length} sections, ` +
                        `${eventDataFromResponse.seatingMap.sections.reduce((total, sec) => 
                            total + (sec.rows?.length || 0), 0)} rows, ` +
                        `${eventDataFromResponse.seatingMap.sections.reduce((total, sec) => 
                            total + sec.rows?.reduce((r, row) => r + (row.seats?.length || 0), 0) || 0, 0)} seats`
                    );
                } else {
                    console.log(`🪑 Using ${eventDataFromResponse.seatingMap.sections.length} sections from database seatingMap`);
                    
                    // IMPORTANT: Make sure each section has valid coordinates
                    eventDataFromResponse.seatingMap.sections.forEach((section, idx) => {
                        console.log(`🪑 Section ${idx}: ${section.name} with ${section.rows?.length || 0} rows`);
                        
                        // Explicitly log coordinates to verify they exist
                        if (typeof section.x === 'number' && typeof section.y === 'number') {
                            console.log(`✅ Section ${section.name} has valid coordinates: (${section.x}, ${section.y}), size: ${section.width}x${section.height}`);
                        } else {
                            console.warn(`⚠️ Section ${section.name} is missing coordinates`);
                            
                            // Calculate coordinates from first row's first seat if available
                            if (Array.isArray(section.rows) && section.rows.length > 0 &&
                                Array.isArray(section.rows[0].seats) && section.rows[0].seats.length > 0) {
                                
                                const firstSeat = section.rows[0].seats[0];
                                if (typeof firstSeat.x === 'number' && typeof firstSeat.y === 'number') {
                                    section.x = firstSeat.x - 20;
                                    section.y = firstSeat.y - 20;
                                    section.width = section.width || 300; 
                                    section.height = section.height || 200;
                                    console.log(`🛠️ Generated coordinates for section ${section.name}: (${section.x}, ${section.y})`);
                                }
                            }
                        }
                    });
                }
                
                setEventData(eventDataFromResponse);
            } catch (error) {
                console.error('❌ SelectSeatPage: Fetch event error:', error);
                toast.error('Lỗi khi tải sự kiện.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, navigate]);

    // Function to create a demo seating map
    const createDemoSeatingMap = (ticketTypes) => {
      console.log('🎭 Creating demo seating map with ticket types:', ticketTypes);
      
      // Default ticket tier if no ticket types available
      let defaultTicketTierId = null;
      if (ticketTypes && ticketTypes.length > 0) {
        defaultTicketTierId = ticketTypes[0]._id;
      }
      
      // Create three sections with better spacing
      const sections = [
        {
          name: "Khu A (Premium)",
          x: 100,
          y: 200,
          width: 350,
          height: 200,
          ticketTier: defaultTicketTierId,
          rows: []
        },
        {
          name: "Khu B (VIP)", 
          x: 650,
          y: 200,
          width: 350,
          height: 200,
          ticketTier: ticketTypes.length > 1 ? ticketTypes[1]._id : defaultTicketTierId,
          rows: []
        },
        {
          name: "Khu C (Standard)",
          x: 375,
          y: 450,
          width: 350, 
          height: 150,
          ticketTier: ticketTypes.length > 2 ? ticketTypes[2]._id : defaultTicketTierId,
          rows: []
        }
      ];

      // Generate rows per section with good spacing
      sections.forEach((section, sectionIndex) => {
        const rowCount = sectionIndex === 2 ? 4 : 5; // Fewer rows for last section
        
        for (let r = 0; r < rowCount; r++) {
          const rowName = String.fromCharCode(65 + r); // A, B, C, etc.
          const rowY = section.y + 40 + (r * 35); // Good spacing between rows
          
          const seats = [];
          const seatCount = sectionIndex === 2 ? 8 : 10; // Fewer seats for last section
          
          for (let s = 0; s < seatCount; s++) {
            seats.push({
              // Remove _id field to let MongoDB generate ObjectIds
              number: s + 1,
              status: 'available',
              x: section.x + 30 + (s * 30), // Good spacing between seats
              y: rowY
            });
          }
          
          section.rows.push({
            name: rowName,
            seats: seats
          });
        }
      });

      // Define venue objects (lối ra, lối vào, wc, etc.)
      const venueObjects = [
        { 
          type: 'entrance',
          label: 'LỐI VÀO',
          x: 100,
          y: 550,
          width: 100,
          height: 40
        },
        { 
          type: 'exit',
          label: 'LỐI RA',
          x: 800,
          y: 550,
          width: 100,
          height: 40
        },
        { 
          type: 'wc',
          label: 'WC',
          x: 100, 
          y: 620,
          width: 80,
          height: 40
        },
        { 
          type: 'wc',
          label: 'WC',
          x: 820,
          y: 620,
          width: 80,
          height: 40
        },
        { 
          type: 'food',
          label: 'ĐỒ ĂN',
          x: 250,
          y: 620,
          width: 80,
          height: 40
        },
        { 
          type: 'drinks',
          label: 'NƯỚC',
          x: 650,
          y: 620,
          width: 80,
          height: 40
        }
      ];

      return {
        layoutType: 'theater', // Ensure layoutType is always set
        sections,
        stage: {
          x: 400,
          y: 80,
          width: 400,
          height: 100
        },
        venueObjects
      };
    };

     const handleSeatSelect = (seatToSelect) => {
    if (seatToSelect.status !== 'available' && !selectedSeats.some(s => s._id === seatToSelect._id)) {
      toast.info("Ghế này không còn trống hoặc không có sẵn.");
      return;
    }

    let newSelectedSeats = [];
    const isAlreadySelected = selectedSeats.some(seat => 
      seat._id === seatToSelect._id || 
      (seat.section === seatToSelect.section && seat.row === seatToSelect.row && seat.number === seatToSelect.number)
    );

    if (isAlreadySelected) {
      newSelectedSeats = selectedSeats.filter(seat => seat._id !== seatToSelect._id);
    } else {
      // Find the section containing this seat to get ticket type info
      const section = eventData.seatingMap.sections.find(sec => 
        sec.name === seatToSelect.section || sec.name === seatToSelect.sectionName
      );
      
      if (!section) {
        console.error('❌ Could not find section for seat:', seatToSelect);
        toast.error("Lỗi: Không thể xác định khu vực của ghế");
        return;
      }
      
      // Find the matching ticket type
      let ticketType = null;
      if (section.ticketTier && eventData.ticketTypes) {
        ticketType = eventData.ticketTypes.find(tt => 
          tt._id === section.ticketTier || 
          tt._id.toString() === section.ticketTier.toString()
        );
      }
      
      if (!ticketType && eventData.ticketTypes && eventData.ticketTypes.length > 0) {
        // Default to first ticket type if no match
        ticketType = eventData.ticketTypes[0];
        console.warn('⚠️ Using default ticket type for seat:', seatToSelect);
      }
      
      const price = ticketType ? ticketType.price : 0;
      console.log('💲 Ticket price for selected seat:', price);
      
      const enrichedSeat = {
        ...seatToSelect,
        price,
        ticketTypeName: ticketType?.name || 'Vé Thường',
        ticketTypeId: ticketType?._id || null,
        sectionName: seatToSelect.section || seatToSelect.sectionName,
        rowName: seatToSelect.row || seatToSelect.rowName,
        seatNumber: seatToSelect.number
      };
      
      newSelectedSeats = [...selectedSeats, enrichedSeat];
    }

    setSelectedSeats(newSelectedSeats);
    
    // Calculate new total
    const newTotal = newSelectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
    setTotalAmount(newTotal);
    
    // Debug log
    console.log('🎫 Selected seats updated:', newSelectedSeats.map(s => `${s.section || s.sectionName} - ${s.row || s.rowName} - ${s.number}`));
  };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="loader"></div></div>;
    }

    if (!eventData) {
        return <div className="text-center text-red-500 mt-10">Không tìm thấy dữ liệu sự kiện.</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Left Column: Seating Chart */}
            <div className="flex-grow w-2/3 p-4">
                <div className="w-full h-full bg-white rounded-xl shadow-lg flex flex-col">
                    <div className="p-4 border-b">
                        <button onClick={() => navigate(`/events/${id}`)} className="text-blue-600 hover:underline">
                            &larr; Trở về chi tiết sự kiện
                        </button>
                        <h2 className="text-2xl font-bold text-center text-gray-800">CHỌN VÉ CỦA BẠN</h2>
                    </div>
                    <div className="flex-grow p-2 relative">
                        <AdvancedSeatingChart
                            eventData={eventData}
                            selectedSeats={selectedSeats}
                            onSeatSelect={handleSeatSelect}
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Information & Summary */}
            <div className="w-1/3 min-w-[380px] bg-gray-50 p-4 flex flex-col space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <img 
                        src={eventData.images?.banner || '/default-event.jpg'} 
                        onError={handleImageError} 
                        alt={eventData.title}
                        className="w-full h-40 object-cover rounded-md mb-3"
                    />
                    <h3 className="text-xl font-bold text-gray-800">{eventData.title}</h3>
                    <div className="text-gray-600 mt-2 space-y-1">
                        <p className="flex items-center"><FaCalendarAlt className="mr-2 text-gray-500" /> {new Date(eventData.startDate).toLocaleString('vi-VN')}</p>
                        <p className="flex items-center"><FaMapMarkerAlt className="mr-2 text-gray-500" /> {eventData.location?.venueName || 'Địa điểm chưa xác định'}</p>
                    </div>
                </div>

                <SeatingChartLegend ticketTypes={eventData.ticketTypes} />

                <div className="flex-grow"></div>

                <OrderSummary selectedSeats={selectedSeats} totalAmount={totalAmount} />
                
                <button 
                    onClick={() => {
                        console.log('🎫 SelectSeatPage: Proceeding to checkout with data:', {
                            eventId: id,
                            selectedSeats,
                            totalAmount
                        });
                        
                        // Validate before navigation
                        if (!id || id === 'null' || id === 'undefined') {
                            console.error('❌ SelectSeatPage: Invalid eventId detected!', { id, typeof: typeof id });
                            toast.error('Lỗi: Thông tin sự kiện không hợp lệ');
                            return;
                        }
                        
                        if (selectedSeats.length === 0) {
                            toast.error('Vui lòng chọn ít nhất một ghế');
                            return;
                        }
                        
                        // Clean up localStorage first to prevent quota issues
                        try {
                            localStorage.removeItem('checkoutState');
                        } catch (e) {
                            console.warn('Failed to clear checkoutState:', e);
                        }

                        // Store checkout state with minimal data
                        const checkoutState = {
                            eventId: id,
                            eventTitle: eventData.title,
                            selectedSeats: selectedSeats.map(seat => ({
                                _id: seat._id,
                                sectionName: seat.sectionName,
                                rowName: seat.rowName,
                                seatNumber: seat.number || seat.seatNumber,
                                price: seat.price,
                                ticketType: seat.ticketType
                            })),
                            totalAmount: totalAmount,
                            bookingType: 'seating'
                        };
                        
                        console.log('💾 SelectSeatPage: Storing checkout state:', checkoutState);
                        
                        try {
                            localStorage.setItem('checkoutState', JSON.stringify(checkoutState));
                        } catch (e) {
                            console.error('Failed to save checkout state to localStorage:', e);
                            toast.error('Lỗi lưu trữ dữ liệu. Vui lòng thử lại hoặc xóa cache trình duyệt.');
                            return;
                        }
                        
                        // Navigate to checkout with state
                        navigate('/checkout', { state: checkoutState });
                    }}
                    disabled={selectedSeats.length === 0}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                >
                    {selectedSeats.length === 0 ? 'CHỌN GHẾ ĐỂ TIẾP TỤC' : `TIẾN HÀNH THANH TOÁN (${selectedSeats.length} ghế)`}
                </button>
            </div>
        </div>
    );
};

export default SelectSeatPage; 