import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { eventAPI, bookingAPI } from '../services/api';
import { FaPlus, FaMinus, FaSync, FaChair } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Seat = ({ data, onSelect, isSelected, sectionColor }) => {
    // Logic màu sắc mới:
    // - Ghế đã bán: màu đỏ (#ef4444)
    // - Ghế đang chọn: màu xanh (#10b981) 
    // - Ghế còn trống: màu của section/loại vé
    let seatColor;
    if (data.status === 'sold') {
        seatColor = '#ef4444'; // Đỏ cho ghế đã bán
    } else if (isSelected) {
        seatColor = '#10b981'; // Xanh cho ghế đang chọn
    } else {
        seatColor = sectionColor; // Màu của section cho ghế còn trống
    }
    
    return (
        <circle
            cx={data.x}
            cy={data.y}
            r={8}
            fill={seatColor}
            stroke="#fff"
            strokeWidth={1}
            opacity={data.status === 'available' ? 0.8 : 0.6}
            onClick={() => data.status === 'available' && onSelect(data)}
            className={data.status === 'available' ? 'cursor-pointer hover:opacity-100 transition-opacity' : 'cursor-not-allowed'}
        />
    );
};

// Hàm tạo màu sắc cho từng loại vé/section
const getTicketTypeColor = (sectionName) => {
    const name = sectionName?.toLowerCase() || '';
    
    // Màu sắc cho các loại vé chính
    if (name.includes('golden')) return '#F59E0B'; // Cam vàng cho Golden
    if (name.includes('vip')) return '#8B5CF6'; // Tím cho VIP
    
    // Màu sắc cho các khu A, B, C, D, E, F, G...
    if (name.includes('a') || name === 'a') return '#3B82F6'; // Xanh dương
    if (name.includes('b') || name === 'b') return '#10B981'; // Xanh lá  
    if (name.includes('c') || name === 'c') return '#F97316'; // Cam
    if (name.includes('d') || name === 'd') return '#EF4444'; // Đỏ
    if (name.includes('e') || name === 'e') return '#8B5CF6'; // Tím
    if (name.includes('f') || name === 'f') return '#F59E0B'; // Cam vàng
    if (name.includes('g') || name === 'g') return '#06B6D4'; // Cyan
    if (name.includes('h') || name === 'h') return '#84CC16'; // Lime
    if (name.includes('i') || name === 'i') return '#F472B6'; // Pink
    if (name.includes('j') || name === 'j') return '#A78BFA'; // Violet
    
    // Fallback: tạo màu dựa trên hash của tên section
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Tạo màu sắc từ hash (tránh màu quá tối hoặc quá sáng)
    const colors = [
        '#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', 
        '#F59E0B', '#06B6D4', '#84CC16', '#F472B6', '#A78BFA'
    ];
    
    return colors[Math.abs(hash) % colors.length];
};

const BookingPage = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

    const ticketTypeMap = useMemo(() => {
        if (!event?.ticketTypes) return {};
        return event.ticketTypes.reduce((acc, tt) => {
            acc[tt._id] = tt;
            return acc;
        }, {});
    }, [event]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                console.log('🔍 BookingPage: Fetching event with ID:', eventId);
                const response = await eventAPI.getEventById(eventId);
                console.log('📦 BookingPage: API Response:', response);
                
                if (response.success) {
                    const eventData = response.data;
                    console.log('✅ BookingPage: Event loaded:', eventData.title);
                    
                    // Kiểm tra xem sự kiện có seatingMap không
                    const hasSeatingMap = eventData.seatingMap && 
                                         eventData.seatingMap.sections && 
                                         eventData.seatingMap.sections.length > 0;
                    
                    if (hasSeatingMap) {
                        console.log('🔄 BookingPage: Event has seatingMap, redirecting to SelectSeatPage');
                        navigate(`/events/${eventId}/select-seats`, { replace: true });
                        return;
                    }
                    
                    // CRITICAL FIX: ALL events without seatingMap should go to SimpleTicketBooking
                    console.log('🔄 BookingPage: Event has NO seatingMap, redirecting to SimpleTicketBooking');
                    console.log('  - Location type:', eventData.location?.type);
                    console.log('  - Venue layout:', eventData.location?.venueLayout);
                    console.log('  - Has ticketTypes:', eventData.ticketTypes?.length > 0);
                    
                    navigate(`/simple-booking/${eventId}`, { replace: true });
                    return;
                } else {
                    console.log('❌ BookingPage: API returned unsuccessful response');
                    setError('Không thể tải thông tin sự kiện');
                }
            } catch (error) {
                console.error('❌ BookingPage: Error:', error);
                setError('Có lỗi xảy ra khi tải sự kiện');
            } finally {
                setLoading(false);
            }
        };
        
        if (eventId) {
            fetchEvent();
        } else {
            setError('ID sự kiện không hợp lệ');
            setLoading(false);
        }
    }, [eventId, navigate]);

    // CRITICAL: Monitor event state changes for debugging
    useEffect(() => {
        console.log('🔍 Event state changed:', {
            event: event,
            eventId: event?._id,
            loading: loading,
            timestamp: new Date().toISOString()
        });
        
        if (event === null && !loading) {
            console.error('🚨 WARNING: Event is null but not loading! This could cause checkout issues.');
        }
    }, [event, loading]);
    
    // IMMEDIATE URL VALIDATION - After all hooks are declared
    useEffect(() => {
        if (!eventId || eventId === 'null' || eventId === 'undefined') {
            console.error('🚨 IMMEDIATE BLOCK: Invalid eventId detected:', eventId);
            toast.error('URL không hợp lệ. Đang chuyển hướng về trang sự kiện.');
            navigate('/events', { replace: true });
        }
    }, [eventId, navigate]);

    const handleSelectSeat = (seat) => {
        let seatSection, seatRow;

        // Find the section and row for the selected seat
        for (const sec of event.seatingMap.sections) {
            for (const r of sec.rows) {
                if (r.seats.some(s => s._id === seat._id)) {
                    seatSection = sec;
                    seatRow = r;
                    break;
                }
            }
            if (seatSection) break;
        }

        if (!seatSection || !seatRow) {
            toast.error("Lỗi: Không thể tìm thấy thông tin ghế.");
            return;
        }

        const ticketType = ticketTypeMap[seatSection.ticketTier];

        if (!ticketType) {
            toast.error("Không thể xác định loại vé cho ghế này.");
            return;
        }

        // ===== ENHANCED DEBUG: Log tất cả dữ liệu raw =====
        console.log('=== ENHANCED FRONTEND SEAT DEBUG ===');
        console.log('Raw seat object:', JSON.stringify(seat, null, 2));
        console.log('seat._id:', seat._id);
        console.log('seat.number:', seat.number);
        console.log('seat.seatNumber:', seat.seatNumber);
        console.log('seatSection object:', JSON.stringify(seatSection, null, 2));
        console.log('seatSection.name:', seatSection.name);
        console.log('seatRow object:', JSON.stringify(seatRow, null, 2));
        console.log('seatRow.name:', seatRow.name);
        console.log('ticketType object:', JSON.stringify(ticketType, null, 2));
        console.log('ticketType.name:', ticketType.name);
        console.log('ticketType.price:', ticketType.price);
        console.log('seat.overridePrice:', seat.overridePrice);
        console.log('=====================================');

        // Create a complete seat object with all necessary info for the backend
        const seatWithTicketInfo = { 
            _id: seat._id,
            sectionName: seatSection.name,
            rowName: seatRow.name,
            seatNumber: seat.number || seat.seatNumber, // Try both fields
            ticketType: ticketType.name,
            price: seat.overridePrice || ticketType.price,
        };

        // Additional fallback: if rowName is still missing, try to parse from seat.number
        if (!seatWithTicketInfo.rowName && seat.number) {
            // seat.number format is usually like "B1-1" where "B1" is row and "1" is seat number
            const parts = seat.number.split('-');
            if (parts.length >= 2) {
                seatWithTicketInfo.rowName = parts[0]; // "B1"
                seatWithTicketInfo.seatNumber = parts.slice(1).join('-'); // "1" or remaining parts
            }
        }

        // Additional fallback: if seatNumber is still missing, try to parse from seat.number
        if (!seatWithTicketInfo.seatNumber && seat.number) {
            const parts = seat.number.split('-');
            if (parts.length >= 2) {
                seatWithTicketInfo.seatNumber = parts.slice(1).join('-'); // Everything after first dash
            } else {
                seatWithTicketInfo.seatNumber = seat.number; // Use full number as fallback
            }
        }

        // Validation before adding to selectedSeats
        if (!seatWithTicketInfo.sectionName) {
            toast.error("Lỗi: Thông tin khu vực ghế bị thiếu.");
            return;
        }
        
        if (!seatWithTicketInfo.rowName) {
            console.error("❌ rowName is undefined/empty!", {
                seatRow,
                seatRowName: seatRow?.name,
                seatSection,
                seatSectionName: seatSection?.name,
                seatNumber: seat.number,
                parsedFromSeatNumber: seat.number ? seat.number.split('-')[0] : 'N/A'
            });
            toast.error("Lỗi: Thông tin hàng ghế bị thiếu.");
            return;
        }
        
        if (!seatWithTicketInfo.seatNumber) {
            toast.error("Lỗi: Thông tin số ghế bị thiếu.");
            return;
        }

        console.log('=== FINAL SEAT OBJECT TO BE SENT ===');
        console.log('seatWithTicketInfo:', JSON.stringify(seatWithTicketInfo, null, 2));
        console.log('All fields present check:');
        console.log('  _id:', seatWithTicketInfo._id ? '✅' : '❌');
        console.log('  sectionName:', seatWithTicketInfo.sectionName ? '✅' : '❌');
        console.log('  rowName:', seatWithTicketInfo.rowName ? '✅' : '❌');
        console.log('  seatNumber:', seatWithTicketInfo.seatNumber ? '✅' : '❌');
        console.log('  ticketType:', seatWithTicketInfo.ticketType ? '✅' : '❌');
        console.log('  price:', seatWithTicketInfo.price ? '✅' : '❌');
        console.log('====================================');

        setSelectedSeats(prev => {
            const isSelected = prev.some(s => s._id === seat._id);
            if (isSelected) {
                return prev.filter(s => s._id !== seat._id);
            } else {
                return [...prev, seatWithTicketInfo];
            }
        });
    };

    const getTotalPrice = () => {
        return selectedSeats.reduce((total, seat) => total + seat.price, 0);
    };

    const proceedToCheckout = () => {
        console.log('=== PROCEED TO CHECKOUT DEBUG ===');
        console.log('selectedSeats.length:', selectedSeats.length);
        console.log('event:', event);
        console.log('event?._id:', event?._id);
        console.log('loading:', loading);
        console.log('error:', error);
        console.log('================================');

        if (selectedSeats.length === 0) {
            toast.warn('Vui lòng chọn ít nhất một ghế.');
            return;
        }
        
        // Additional loading check
        if (loading) {
            toast.warn('Dữ liệu sự kiện đang được tải. Vui lòng chờ...');
            return;
        }
        
        // Validate event and eventId before proceeding
        if (!event || !event._id) {
            console.error('⚠️ Event or event._id is missing at checkout time!');
            console.error('Event state:', event);
            console.error('URL eventId:', eventId);
            toast.error('Thông tin sự kiện không hợp lệ. Vui lòng tải lại trang và thử lại.');
            // Force reload to get fresh event data
            window.location.reload();
            return;
        }
        
        // Clean up localStorage first to prevent quota issues
        try {
            localStorage.removeItem('checkoutState');
        } catch (e) {
            console.warn('Failed to clear checkoutState:', e);
        }

        const checkoutState = { 
            selectedSeats: selectedSeats.map(seat => ({
                _id: seat._id,
                sectionName: seat.sectionName,
                rowName: seat.rowName,
                seatNumber: seat.seatNumber,
                price: seat.price,
                ticketType: seat.ticketType
            })), 
            eventId: event._id,
            eventTitle: event.title,
            bookingType: 'seating'
        };
        
        console.log('✅ Checkout state created:', checkoutState);

        // Double-check eventId before storing
        if (typeof checkoutState.eventId !== 'string' || checkoutState.eventId === 'null' || checkoutState.eventId === 'undefined') {
            console.error('🚨 CRITICAL: Invalid eventId detected before storing!');
            console.error('Corrupted eventId:', checkoutState.eventId, typeof checkoutState.eventId);
            toast.error('Lỗi hệ thống: ID sự kiện không hợp lệ. Vui lòng tải lại trang.');
            return;
        }

        // Store in localStorage with error handling
        try {
            const checkoutStateString = JSON.stringify(checkoutState);
            console.log('💾 Storing to localStorage:', checkoutStateString);
            localStorage.setItem('checkoutState', checkoutStateString);
        } catch (e) {
            console.error('Failed to save checkout state to localStorage:', e);
            toast.error('Lỗi lưu trữ dữ liệu. Vui lòng thử lại hoặc xóa cache trình duyệt.');
            return;
        }

        // Navigate to checkout
        navigate('/checkout', { state: checkoutState });
    };

    // Handle invalid eventId - render early return component
    if (!eventId || eventId === 'null' || eventId === 'undefined') {
        return (
            <div className="flex h-screen bg-gray-900 text-white font-sans items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">🚫 URL không hợp lệ</h2>
                    <p className="mb-4">ID sự kiện không tồn tại hoặc không hợp lệ</p>
                    <button 
                        onClick={() => navigate('/events')}
                        className="bg-green-500 px-6 py-3 rounded-lg hover:bg-green-600"
                    >
                        Về trang sự kiện
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="text-center mt-8">Đang tải sơ đồ ghế...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!event) return null;

    if (!event.seatingMap || !event.seatingMap.sections || event.seatingMap.sections.length === 0) {
        return <div className="flex h-screen bg-gray-900 text-white font-sans items-center justify-center"><p>Sự kiện này không có sơ đồ chỗ ngồi.</p></div>;
    }

    const allSeats = event.seatingMap.sections.flatMap(s => s.rows?.flatMap(r => r.seats || []) || []).filter(seat => seat && typeof seat.x === 'number' && typeof seat.y === 'number');

    // --- DEBUG LOG 2: DANH SÁCH GHẾ SAU KHI LỌC ---
    console.log("--- [DEBUG] DANH SÁCH GHẾ HỢP LỆ ĐỂ TÍNH TOÁN ---", allSeats);

    if (allSeats.length === 0) {
        return <div className="flex h-screen bg-gray-900 text-white font-sans items-center justify-center"><p>Sơ đồ chỗ ngồi của sự kiện này hiện đang trống hoặc có lỗi dữ liệu.</p></div>;
    }

    const padding = 50;
    
    // Tính toán viewport bao gồm cả sân khấu và ghế
    let minX = Math.min(...allSeats.map(s => s.x));
    let minY = Math.min(...allSeats.map(s => s.y));
    let maxX = Math.max(...allSeats.map(s => s.x));
    let maxY = Math.max(...allSeats.map(s => s.y));
    
    // Nếu có sân khấu, mở rộng viewport để bao gồm sân khấu
    if (event.seatingMap.stage) {
        minX = Math.min(minX, event.seatingMap.stage.x);
        minY = Math.min(minY, event.seatingMap.stage.y);
        maxX = Math.max(maxX, event.seatingMap.stage.x + event.seatingMap.stage.width);
        maxY = Math.max(maxY, event.seatingMap.stage.y + event.seatingMap.stage.height);
    }
    
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const viewPortWidth = maxX - minX;
    const viewPortHeight = maxY - minY;

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            {/* Main content - Seating chart */}
            <div className="flex-1 flex flex-col">
                 <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
                    <button 
                        onClick={() => {
                            // Validate eventId before navigation
                            if (eventId && eventId !== 'null' && eventId !== 'undefined') {
                                navigate(`/events/${eventId}`);
                            } else {
                                console.warn('⚠️ Invalid eventId for navigation, going to events list');
                                navigate('/events');
                            }
                        }} 
                        className="text-lg hover:text-green-400"
                    >
                        ← Trở về
                    </button>
                    <h1 className="text-xl font-bold text-center">Chọn vé</h1>
                    <div className="legend space-y-2">
                        <div className="mb-3">
                            <h4 className="text-sm font-semibold mb-2">Trạng thái ghế:</h4>
                            <div className="space-y-1">
                                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div><span className="text-sm">Đang chọn</span></div>
                                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div><span className="text-sm">Đã bán</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Loại vé:</h4>
                            <div className="space-y-1">
                                {event.ticketTypes.map(tt => (
                                    <div key={tt._id} className="flex items-center">
                                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getTicketTypeColor(tt.name) }}></div>
                                        <span className="text-sm">{tt.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-black">
                     <TransformWrapper initialScale={1} minScale={0.5} maxScale={5}>
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
                                    <button onClick={() => zoomIn()} className="bg-gray-700 p-2 rounded-full"><FaPlus /></button>
                                    <button onClick={() => zoomOut()} className="bg-gray-700 p-2 rounded-full"><FaMinus /></button>
                                    <button onClick={() => resetTransform()} className="bg-gray-700 p-2 rounded-full"><FaSync /></button>
                                </div>
                                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                    <svg viewBox={`${minX} ${minY} ${viewPortWidth} ${viewPortHeight}`} className="w-full h-full">
                                        {/* Render enhanced stage */}
                                        {event.seatingMap.stage ? (
                                            <g>
                                                {/* Stage gradient background */}
                                                <defs>
                                                    <linearGradient id="stageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" style={{ stopColor: event.seatingMap.stage.gradient?.start || '#4f46e5', stopOpacity: 1 }} />
                                                        <stop offset="100%" style={{ stopColor: event.seatingMap.stage.gradient?.end || '#1e40af', stopOpacity: 1 }} />
                                                    </linearGradient>
                                                </defs>
                                                
                                                {/* Main stage */}
                                                <rect 
                                                    x={event.seatingMap.stage.x} 
                                                    y={event.seatingMap.stage.y} 
                                                    width={event.seatingMap.stage.width} 
                                                    height={event.seatingMap.stage.height} 
                                                    fill="url(#stageGradient)" 
                                                    rx="8" 
                                                    stroke="#fbbf24" 
                                                    strokeWidth="2"
                                                />
                                                
                                                {/* Stage lighting */}
                                                {event.seatingMap.stage.lighting?.map((light, index) => (
                                                    <circle 
                                                        key={index}
                                                        cx={light.x} 
                                                        cy={light.y} 
                                                        r={light.radius} 
                                                        fill="#fbbf24" 
                                                        opacity="0.8"
                                                    />
                                                ))}
                                                
                                                {/* Stage label */}
                                                <text 
                                                    x={event.seatingMap.stage.centerX} 
                                                    y={event.seatingMap.stage.centerY + 5} 
                                                    fill="white" 
                                                    textAnchor="middle" 
                                                    fontSize="24" 
                                                    fontWeight="bold"
                                                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                                                >
                                                    SÂN KHẤU
                                                </text>
                                            </g>
                                        ) : (
                                            /* Fallback simple stage */
                                            <g>
                                                <rect x="250" y="50" width="300" height="50" fill="#374151" rx="5" />
                                                <text x="400" y="85" fill="white" textAnchor="middle" fontSize="24" fontWeight="bold">SÂN KHẤU</text>
                                            </g>
                                        )}
                                        
                                        {event.seatingMap.sections.map((section, sectionIndex) => {
                                            const ticketType = ticketTypeMap[section.ticketTier];
                                            if (!ticketType) return null;

                                            const sectionColor = getTicketTypeColor(section.name);
                                            
                                            // Debug logs để kiểm tra màu sắc
                                            console.log(`[COLOR DEBUG] Section: ${section.name}, Color: ${sectionColor}`);
                                            
                                            const getLabelPosition = () => {
                                                if (section.labelPosition && typeof section.labelPosition.x === 'number' && typeof section.labelPosition.y === 'number') {
                                                    return section.labelPosition;
                                                }
                                                
                                                const sectionSeats = (section.rows || []).flatMap(r => r.seats || []);
                                                const validSeats = sectionSeats.filter(s => s && typeof s.x === 'number' && typeof s.y === 'number');

                                                if (validSeats.length > 0) {
                                                    const avgX = validSeats.reduce((sum, s) => sum + s.x, 0) / validSeats.length;
                                                    const minY = Math.min(...validSeats.map(s => s.y));
                                                    return { x: avgX, y: minY - 20 }; // Place label above the seats
                                                }
                                                return null; // Cannot determine position
                                            };

                                            const labelPosition = getLabelPosition();

                                            // Tính toán boundaries của section để vẽ background
                                            const sectionSeats = (section.rows || []).flatMap(r => r.seats || []);
                                            const validSeats = sectionSeats.filter(s => s && typeof s.x === 'number' && typeof s.y === 'number');
                                            
                                            let sectionBounds = null;
                                            if (validSeats.length > 0) {
                                                const minX = Math.min(...validSeats.map(s => s.x));
                                                const maxX = Math.max(...validSeats.map(s => s.x));
                                                const minY = Math.min(...validSeats.map(s => s.y));
                                                const maxY = Math.max(...validSeats.map(s => s.y));
                                                sectionBounds = {
                                                    x: minX - 15,
                                                    y: minY - 15,
                                                    width: maxX - minX + 30,
                                                    height: maxY - minY + 30
                                                };
                                            }

                                            return (
                                                <g key={section.name || sectionIndex}>
                                                    {/* Section Background */}
                                                    {sectionBounds && (
                                                        <rect
                                                            x={sectionBounds.x}
                                                            y={sectionBounds.y}
                                                            width={sectionBounds.width}
                                                            height={sectionBounds.height}
                                                            fill={sectionColor}
                                                            opacity="0.2"
                                                            stroke={sectionColor}
                                                            strokeWidth="2"
                                                            strokeDasharray="5,5"
                                                            rx="8"
                                                        />
                                                    )}
                                                    
                                                    {/* Section Label */}
                                                    {labelPosition && (
                                                        <text 
                                                            x={labelPosition.x} 
                                                            y={labelPosition.y} 
                                                            fill={sectionColor}
                                                            textAnchor="middle"
                                                            fontSize="14"
                                                            fontWeight="bold"
                                                            className="pointer-events-none"
                                                        >
                                                            {section.name} ({ticketType.name})
                                                        </text>
                                                    )}
                                                    
                                                    {/* Seats */}
                                                    {section.rows && section.rows.map((row, rowIndex) => 
                                                        row.seats && row.seats.map((seat, seatIndex) => {
                                                            // --- DEBUG LOG 3: GHI LOG TỪNG GHẾ TRƯỚC KHI VẼ ---
                                                            console.log(`[DEBUG] Đang xử lý Section ${sectionIndex}, Row ${rowIndex}, Seat ${seatIndex}:`, seat);
                                                            
                                                            if (seat && typeof seat.x === 'number' && typeof seat.y === 'number') {
                                                                return (
                                                                    <Seat 
                                                                        key={seat._id || seatIndex} 
                                                                        data={seat}
                                                                        onSelect={handleSelectSeat}
                                                                        isSelected={selectedSeats.some(s => s._id === seat._id)}
                                                                        sectionColor={sectionColor}
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })
                                                    )}

                                                    {/* Section capacity info */}
                                                    {labelPosition && sectionBounds && (
                                                        <text
                                                            x={labelPosition.x}
                                                            y={sectionBounds.y + sectionBounds.height + 15}
                                                            textAnchor="middle"
                                                            fill="#666"
                                                            fontSize="10"
                                                        >
                                                            {validSeats.length} ghế - {ticketType.price.toLocaleString()}đ
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                </div>
            </div>

            {/* Sidebar - Event Info & Booking Summary */}
            <div className="w-96 bg-gray-800 p-6 flex flex-col border-l border-gray-700">
                <h2 className="text-2xl font-bold mb-1">{event.title}</h2>
                <p className="text-sm text-gray-400 mb-6">{new Date(event.startDate).toLocaleString('vi-VN')}</p>

                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Giá vé</h3>
                    <div className="space-y-2">
                        {event.ticketTypes.map(tt => (
                            <div key={tt._id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center">
                                    <div className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: getTicketTypeColor(tt.name) }}></div>
                                    {tt.name}
                                </span>
                                <span className="font-bold">{tt.price.toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto border-t border-b border-gray-700 py-4">
                     <h3 className="font-semibold text-lg mb-3">Vé đã chọn</h3>
                     {selectedSeats.length > 0 ? (
                        <div className="space-y-2">
                            {selectedSeats.map(seat => {
                                const section = event.seatingMap.sections.find(sec => sec.rows.some(r => r.seats.some(s => s._id === seat._id)));
                                const ticketType = ticketTypeMap[section?.ticketTier];
                                return (
                                    <div key={seat._id} className="flex items-center text-sm p-2 bg-gray-700 rounded-md">
                                        <FaChair style={{color: getTicketTypeColor(section?.name)}} className="mr-3 shrink-0"/>
                                        <span>Khu {section?.name} - Ghế {seat.seatNumber}</span>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                        <p className="text-gray-500 text-sm italic">Vui lòng chọn vé từ sơ đồ.</p>
                     )}
                </div>

                <div className="mt-auto pt-6">
                    <div className="flex justify-between font-bold text-xl mb-4">
                        <span>Tổng cộng</span>
                        <span>{getTotalPrice().toLocaleString()}đ</span>
                    </div>
                    <button 
                        onClick={proceedToCheckout}
                        disabled={selectedSeats.length === 0 || loading || !event || !event._id}
                        className="w-full bg-green-500 py-3 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {loading || !event || !event._id 
                            ? 'Đang tải thông tin sự kiện...' 
                            : selectedSeats.length === 0 
                                ? 'Vui lòng chọn vé' 
                                : `Thanh toán (${selectedSeats.length} vé)`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPage; 