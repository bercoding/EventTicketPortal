import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { FaPlus, FaMinus, FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUsers, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SimpleTicketBooking = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await eventAPI.getEventById(eventId);
        
        console.log("🎫 Fetching event for simple booking:", response.data);
        
        if (response && response.success && response.data) {
          setEvent(response.data);
          
          // Initialize selectedTickets array with 0 quantity for each ticket type
          const initialTickets = response.data.ticketTypes?.map(ticketType => ({
            ticketTypeId: ticketType._id,
            name: ticketType.name,
            price: ticketType.price,
            quantity: 0,
            maxQuantity: Math.min(
              ticketType.availableQuantity ?? ticketType.totalQuantity ?? 0,
              10
            ), // Limit to 10 per type
            description: ticketType.description
          })) || [];
          
          setSelectedTickets(initialTickets);
          console.log("✅ Event loaded successfully:", response.data.title);
        } else {
          console.error("❌ Invalid response structure:", response);
          toast.error("Không tìm thấy sự kiện.");
          navigate('/');
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết sự kiện:", err);
        toast.error("Lỗi khi tải dữ liệu sự kiện.");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, navigate]);

  const updateTicketQuantity = (ticketTypeId, change) => {
    setSelectedTickets(prev => prev.map(ticket => {
      if (ticket.ticketTypeId === ticketTypeId) {
        const newQuantity = Math.max(0, Math.min(ticket.maxQuantity, ticket.quantity + change));
        return { ...ticket, quantity: newQuantity };
      }
      return ticket;
    }));
  };

  const getTotalQuantity = () => {
    return selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  const getTotalPrice = () => {
    return selectedTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
  };

  const proceedToCheckout = () => {
    const selectedTicketsForCheckout = selectedTickets.filter(ticket => ticket.quantity > 0);
    
    if (selectedTicketsForCheckout.length === 0) {
      toast.error('Vui lòng chọn ít nhất một vé!');
      return;
    }

    // Validate eventId
    if (!event?._id || event._id === 'null' || event._id === 'undefined') {
      console.error('🚨 Invalid eventId in checkout:', event?._id);
      toast.error('Lỗi hệ thống: ID sự kiện không hợp lệ. Vui lòng tải lại trang.');
      return;
    }

    // Clean up localStorage first to prevent quota issues
    try {
      localStorage.removeItem('checkoutState');
    } catch (e) {
      console.warn('Failed to clear checkoutState:', e);
    }

    const checkoutState = {
      eventId: event._id,
      eventTitle: event.title,
      selectedTickets: selectedTicketsForCheckout.map(ticket => ({
        ticketTypeId: ticket.ticketTypeId,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity
      })),
      totalPrice: getTotalPrice(),
      totalQuantity: getTotalQuantity(),
      bookingType: 'simple'
    };

    console.log('🎫 Simple checkout state:', checkoutState);

    // Store in localStorage for checkout page with error handling
    try {
      localStorage.setItem('checkoutState', JSON.stringify(checkoutState));
    } catch (e) {
      console.error('Failed to save checkout state to localStorage:', e);
      toast.error('Lỗi lưu trữ dữ liệu. Vui lòng thử lại hoặc xóa cache trình duyệt.');
      return;
    }
    
    // Navigate to checkout with state
    navigate('/checkout', { state: checkoutState });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
          <p className="mt-4 text-xl text-gray-300">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl text-gray-300">Không tìm thấy sự kiện</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Event Image */}
            <div className="w-full lg:w-1/3">
              <img
                src={event.images?.banner || event.images?.logo || '/default-event.jpg'}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
            
            {/* Event Info */}
            <div className="w-full lg:w-2/3">
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
              <div className="space-y-3 text-lg">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-green-400" />
                  <span>{formatDateTime(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaClock className="text-blue-400" />
                  <span>
                    {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-red-400" />
                  <span>
                    {event.location?.type === 'online' 
                      ? `Online - ${event.location?.platform || 'Nền tảng trực tuyến'}`
                      : `${event.location?.venueName || 'Địa điểm'}, ${event.location?.address || event.location?.city || ''}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaUsers className="text-yellow-400" />
                  <span>Sự kiện {event.location?.type === 'online' ? 'trực tuyến' : 'ngoài trời'}</span>
                </div>
              </div>
              
              {/* Display seating map information if available */}
              {event.seatingMap && event.seatingMap.sections && event.seatingMap.sections.length > 0 && (
                <div className="mt-4 bg-blue-900/40 p-4 rounded-lg border border-blue-400/30">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-400 text-xl mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-blue-300">Thông báo về ghế ngồi</h3>
                      <p className="text-blue-200 text-sm mt-1">
                        Sự kiện này có sơ đồ chỗ ngồi, tuy nhiên bạn không cần chọn chỗ ngồi cụ thể. 
                        Vị trí ngồi sẽ được bố trí khi bạn đến sự kiện.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Selection */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">
            <FaTicketAlt className="inline mr-3 text-green-400" />
            Chọn vé
          </h2>
          
          {event.seatingMap && event.seatingMap.sections && event.seatingMap.sections.length > 0 && (
            <div className="mb-8 bg-blue-900/40 p-6 rounded-lg border border-blue-400/30 text-center">
              <h3 className="font-bold text-xl text-blue-300 mb-2">Sự kiện có sơ đồ chỗ ngồi</h3>
              <p className="text-blue-100">
                Bạn đang mua vé cho sự kiện có sơ đồ chỗ ngồi. Tuy nhiên, hệ thống hiện đang áp dụng 
                phương thức mua vé không cần chọn chỗ ngồi cụ thể. Vị trí sẽ được phân bổ theo thứ tự 
                đến trước, ngồi trước khi bạn đến tham dự sự kiện.
              </p>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {selectedTickets.map((ticket, index) => (
              <div key={ticket.ticketTypeId} className={`p-6 ${index !== selectedTickets.length - 1 ? 'border-b border-gray-700' : ''}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Ticket Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{ticket.name}</h3>
                    <p className="text-gray-400 mb-3">{ticket.description || 'Vé tham gia sự kiện'}</p>
                    <div className="text-2xl font-bold text-green-400">
                      {formatPrice(ticket.price)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Còn lại: {ticket.maxQuantity} vé
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateTicketQuantity(ticket.ticketTypeId, -1)}
                      disabled={ticket.quantity === 0}
                      className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <FaMinus />
                    </button>
                    
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold">{ticket.quantity}</div>
                      <div className="text-sm text-gray-400">vé</div>
                    </div>
                    
                    <button
                      onClick={() => updateTicketQuantity(ticket.ticketTypeId, 1)}
                      disabled={ticket.quantity >= ticket.maxQuantity}
                      className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right lg:w-32">
                    <div className="text-lg font-semibold">
                      {formatPrice(ticket.price * ticket.quantity)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {ticket.quantity} × {formatPrice(ticket.price)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl">Tổng số vé:</span>
              <span className="text-xl font-semibold">{getTotalQuantity()} vé</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-2xl">
              <span>Tổng tiền:</span>
              <span className="font-bold text-green-400">{formatPrice(getTotalPrice())}</span>
            </div>
            
            <button
              onClick={proceedToCheckout}
              disabled={getTotalQuantity() === 0}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              {getTotalQuantity() === 0 ? 'Chọn vé để tiếp tục' : `Thanh toán ${formatPrice(getTotalPrice())}`}
            </button>
          </div>

          {/* Event Description */}
          {event.description && (
            <div className="mt-8 bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Về sự kiện này</h3>
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleTicketBooking; 