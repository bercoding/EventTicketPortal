import React from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import { FaPlus, FaMinus, FaSyncAlt } from 'react-icons/fa';

// Component Controls để zoom in, zoom out, reset
const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-2 left-2 z-10 bg-white bg-opacity-70 p-1 rounded-lg shadow-md">
      <button onClick={() => zoomIn()} className="p-2 text-gray-700 hover:bg-gray-200 rounded-md">
        <FaPlus />
      </button>
      <button onClick={() => zoomOut()} className="p-2 text-gray-700 hover:bg-gray-200 rounded-md">
        <FaMinus />
      </button>
      <button onClick={() => resetTransform()} className="p-2 text-gray-700 hover:bg-gray-200 rounded-md">
        <FaSyncAlt />
      </button>
    </div>
  );
};


const AdvancedSeatingChart = ({ eventData, selectedSeats, onSeatSelect }) => {
  if (!eventData || !eventData.seatingMap || !eventData.ticketTypes) {
    return <div className="text-center p-8">Đang tải sơ đồ ghế...</div>;
  }

  const { seatingMap, ticketTypes } = eventData;
  const { sections, stage } = seatingMap;

  // Kiểm tra dữ liệu sections
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return <div className="text-center p-8">Không có dữ liệu ghế.</div>;
  }

  // Tạo một map từ ticketTypeId sang thông tin chi tiết (màu sắc, giá)
  const ticketTypeMap = ticketTypes.reduce((acc, tt) => {
    acc[tt._id] = tt;
    return acc;
  }, {});

  // Hàm tạo màu sắc cho từng loại vé
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

  // Cập nhật ticketTypeMap với màu sắc
  const ticketTypesWithColors = ticketTypes.map((tt, index) => ({
    ...tt,
    color: getTicketTypeColor(tt, index)
  }));

  const ticketTypeMapWithColors = ticketTypesWithColors.reduce((acc, tt) => {
    acc[tt._id] = tt;
    return acc;
  }, {});

  const getSeatClassName = (seat) => {
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    if (isSelected) {
      return 'cursor-pointer animate-pulse';
    }
    if (seat.status === 'booked') {
      return 'opacity-40 cursor-not-allowed';
    }
     if (seat.status === 'unavailable') {
      return 'opacity-20 cursor-not-allowed';
    }
    return 'cursor-pointer hover:stroke-2 hover:stroke-yellow-400';
  };

  const getSeatFillColor = (seat, section) => {
     const isSelected = selectedSeats.some(s => s._id === seat._id);
    if (isSelected) {
      return '#10b981'; // Green for selected seats
    }
     if (seat.status === 'booked' || seat.status === 'sold') {
      return '#ef4444'; // Red for booked/sold seats
    }
    if (seat.status === 'unavailable') {
      return '#9ca3af'; // Gray for unavailable seats
    }
    
    // Tìm màu sắc dựa trên section's ticketTier
    const ticketType = ticketTypeMapWithColors[section.ticketTier];
    return ticketType?.color || '#60a5fa'; // Default to blue if no color found
  }

  // --- START ADVANCED BOUNDING BOX CALCULATION ---

  // 1. Find the precise bounding box of all elements
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const allElements = [...sections];
  if (stage) {
    allElements.push({
      // Treat stage as a section for bounding box calculation
      rows: [{
        seats: [
          { x: stage.x, y: stage.y },
          { x: stage.x + stage.width, y: stage.y + stage.height }
        ]
      }]
    });
  }
  
  allElements.forEach(sec => {
    if (!sec || !sec.rows || !Array.isArray(sec.rows)) return;
    sec.rows.forEach(row => {
      if (!row || !row.seats || !Array.isArray(row.seats)) return;
      row.seats.forEach(seat => {
        if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number') return;
        minX = Math.min(minX, seat.x);
        maxX = Math.max(maxX, seat.x);
        minY = Math.min(minY, seat.y);
        maxY = Math.max(maxY, seat.y);
      });
    });
  });

  // 2. Calculate dimensions and add padding
  const PADDING = 50;
  let contentWidth, contentHeight;

  if (minX === Infinity) {
    // Fallback if no elements are found
    contentWidth = 800;
    contentHeight = 600;
    minX = 0;
    minY = 0;
  } else {
    contentWidth = (maxX - minX) + (PADDING * 2);
    contentHeight = (maxY - minY) + (PADDING * 2);
  }

  // --- END ADVANCED BOUNDING BOX CALCULATION ---

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative">
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={5}
        limitToBounds={true}
        centerOnInit={true}
      >
        <Controls />
        <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: contentWidth, height: contentHeight }}
        >
          {/* Use a group with a transform to normalize coordinates */}
          <svg width={contentWidth} height={contentHeight} style={{ background: 'transparent' }}>
            <g transform={`translate(${-minX + PADDING}, ${-minY + PADDING})`}>
              {/* Render Stage */}
              {stage && stage.x !== undefined && stage.y !== undefined && (
                   <g>
                    <rect 
                        x={stage.x} 
                        y={stage.y} 
                        width={stage.width} 
                        height={stage.height} 
                        fill="#1f2937" 
                        stroke="#4b5563"
                        strokeWidth="2"
                        rx="10"
                    />
                    <text x={stage.centerX || stage.x + (stage.width / 2)} y={stage.centerY + 5 || stage.y + (stage.height / 2)} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">SÂN KHẤU</text>
                </g>
              )}

              {/* Render Sections and Seats */}
              {sections.map((section, sectionIndex) => {
                if (!section || !section.rows || !Array.isArray(section.rows)) return null;
                
                // Tính toán boundaries của section để vẽ background
                const sectionSeats = section.rows.flatMap(r => r.seats || []);
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
                
                // Lấy màu sắc của section
                const ticketType = ticketTypeMapWithColors[section.ticketTier];
                const sectionColor = ticketType?.color || '#9ca3af';
                
                return (
                  <g key={section.name || `section-${sectionIndex}`}>
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
                    
                    {/* Section Name Label - tính toán vị trí dựa trên ghế đầu tiên */}
                    {section.rows.length > 0 && section.rows[0].seats && section.rows[0].seats.length > 0 && (
                      <text 
                        x={section.rows[0].seats[0].x || 0} 
                        y={(section.rows[0].seats[0].y || 0) - 10} 
                        textAnchor="start" 
                        fill={sectionColor}
                        fontSize="16" 
                        fontWeight="bold"
                      >
                        {section.name} ({ticketType?.name || 'N/A'})
                      </text>
                    )}
                    
                    {section.rows.map((row, rowIndex) => {
                      if (!row || !row.seats || !Array.isArray(row.seats)) return null;
                      
                      return (
                        <g key={row.name || `${section.name || 'section'}-row-${rowIndex}`}>
                          {row.seats.map((seat, seatIndex) => {
                            if (!seat || typeof seat.x !== 'number' || typeof seat.y !== 'number') return null;
                            
                            return (
                              <circle
                                key={seat._id || `seat-${sectionIndex}-${rowIndex}-${seatIndex}`}
                                cx={seat.x}
                                cy={seat.y}
                                r={8} // Bán kính ghế
                                fill={getSeatFillColor(seat, section)}
                                className={getSeatClassName(seat)}
                                onClick={() => {
                                    if (seat.status === 'available') {
                                        onSeatSelect(seat);
                                    }
                                }}
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default AdvancedSeatingChart; 