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
                
                if (response.success && response.data) {
                    console.log('✅ SelectSeatPage: Event loaded successfully:', response.data.title);
                    setEventData(response.data);
                } else if (response.data?.success) {
                    console.log('✅ SelectSeatPage: Event loaded successfully (nested structure):', response.data.data.title);
                    setEventData(response.data.data);
                } else {
                    console.log('❌ SelectSeatPage: API returned unsuccessful response:', response);
                    toast.error('Không thể tải thông tin sự kiện.');
                    navigate('/');
                }
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

     const handleSeatSelect = (seatToSelect) => {
        if (seatToSelect.status !== 'available' && !selectedSeats.some(s => s._id === seatToSelect._id)) {
            toast.info("Ghế này không còn trống hoặc không có sẵn.");
            return;
        }

        let newSelectedSeats = [];
        const isAlreadySelected = selectedSeats.some(seat => seat._id === seatToSelect._id);

        if (isAlreadySelected) {
            newSelectedSeats = selectedSeats.filter(seat => seat._id !== seatToSelect._id);
        } else {
            const section = eventData.seatingMap.sections.find(sec => 
                sec.rows.some(row => row.seats.some(s => s._id === seatToSelect._id))
            );
            const ticketType = eventData.ticketTypes.find(tt => tt._id === section.ticketTier);

            const seatWithDetails = {
                ...seatToSelect,
                price: ticketType?.price || 0,
                sectionName: section?.name || 'N/A'
            };
            newSelectedSeats = [...selectedSeats, seatWithDetails];
        }

        setSelectedSeats(newSelectedSeats);
        const newTotal = newSelectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
        setTotalAmount(newTotal);
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
                    <div className="flex-grow p-2">
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
                        src={eventData.images.banner} 
                        onError={handleImageError} 
                        alt={eventData.title}
                        className="w-full h-40 object-cover rounded-md mb-3"
                    />
                    <h3 className="text-xl font-bold text-gray-800">{eventData.title}</h3>
                    <div className="text-gray-600 mt-2 space-y-1">
                        <p className="flex items-center"><FaCalendarAlt className="mr-2 text-gray-500" /> {new Date(eventData.startDate).toLocaleString('vi-VN')}</p>
                        <p className="flex items-center"><FaMapMarkerAlt className="mr-2 text-gray-500" /> {eventData.location.venueName}</p>
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
                                seatNumber: seat.seatNumber,
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
                    TIẾN HÀNH THANH TOÁN
                </button>
            </div>


        </div>
    );
};

export default SelectSeatPage; 