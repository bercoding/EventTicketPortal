import React, { useState } from 'react';
import { FaDoorOpen, FaDoorClosed, FaToilet, FaHamburger, FaGlassMartiniAlt, FaWheelchair, FaInfoCircle } from 'react-icons/fa';
import './SeatingPreview.css';

const SeatingPreview = ({ seatingMap, showLabels = true, interactive = false, onSeatSelect }) => {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Handle completely missing seatingMap
  if (!seatingMap) {
    return (
      <div className="seating-preview empty">
        <p>Chưa có sơ đồ ghế</p>
      </div>
    );
  }

  // Ensure sections exist with fallbacks
  const normalizedSeatingMap = {
    ...seatingMap, // Keep all original properties
    layoutType: seatingMap.layoutType || 'theater',
    sections: Array.isArray(seatingMap.sections) ? seatingMap.sections : [],
    stage: seatingMap.stage || { x: 400, y: 50, width: 300, height: 60 },
    venueObjects: Array.isArray(seatingMap.venueObjects) 
      ? seatingMap.venueObjects.map(obj => ({
          ...obj, // Keep all original properties
          // Ensure objectType is consistent (some objects might use 'type' instead of 'objectType')
          objectType: obj.objectType || obj.type || 'other',
          // Ensure dimensions are numbers but preserve original values
          width: Number(obj.width) || 30,
          height: Number(obj.height) || 30,
          x: Number(obj.x) || 0,
          y: Number(obj.y) || 0,
          rotation: Number(obj.rotation) || 0
        })) 
      : []
  };
  
  // Log the normalized seating map for debugging
  console.log('Normalized seatingMap:', 
    `layoutType=${normalizedSeatingMap.layoutType}, ` +
    `sections=${normalizedSeatingMap.sections.length}, ` +
    `venueObjects=${normalizedSeatingMap.venueObjects.length}`
  );

  // If no sections at all, show empty message
  if (normalizedSeatingMap.sections.length === 0) {
    return (
      <div className="seating-preview empty">
        <p>Chưa có khu vực ghế nào</p>
      </div>
    );
  }

  const { sections, stage, venueObjects = [] } = normalizedSeatingMap;

  // Định nghĩa các loại venue object
  const venueObjectTypes = {
    'entrance': { name: 'Lối vào', icon: <FaDoorOpen />, color: '#4CAF50' },
    'exit': { name: 'Lối ra', icon: <FaDoorClosed />, color: '#F44336' },
    'restroom': { name: 'Nhà vệ sinh', icon: <FaToilet />, color: '#2196F3' },
    'food': { name: 'Quầy thức ăn', icon: <FaHamburger />, color: '#FF9800' },
    'drinks': { name: 'Quầy nước', icon: <FaGlassMartiniAlt />, color: '#9C27B0' },
    'accessible': { name: 'Lối đi cho người khuyết tật', icon: <FaWheelchair />, color: '#03A9F4' },
    'info': { name: 'Quầy thông tin', icon: <FaInfoCircle />, color: '#607D8B' },
    'other': { name: 'Khác', icon: <FaInfoCircle />, color: '#607D8B' }
  };

  // Color mapping cho các loại vé - cập nhật với màu sắc mới
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

  // Màu sắc trạng thái ghế theo yêu cầu mới
  const getSeatStatusColor = (seat, sectionColor) => {
    if (seat.status === 'sold') return '#EF4444'; // Ghế đã bán - màu đỏ
    if (seat.status === 'selected') return '#10B981'; // Ghế đang chọn - màu xanh
    return sectionColor; // Ghế còn trống - màu của section/loại vé
  };

  const getSectionLabel = (sectionName) => {
    const name = sectionName.toLowerCase();
    if (name.includes('golden')) return 'Golden Circle';
    if (name.includes('vip')) return `VIP ${sectionName.split('-')[1] || ''}`;
    return `Khu ${sectionName}`;
  };

  // Calculate dynamic viewBox to fit all content
  const calculateViewBox = () => {
    if (!sections || sections.length === 0) {
      // Nếu không có sections, hiển thị viewport mặc định tập trung vào stage
      return stage ? `${stage.x - 100} ${stage.y - 50} 400 300` : "0 0 1000 800";
    }

    // Tính toán phạm vi của tất cả các sections và stage
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Đưa stage vào phạm vi nếu có
    if (stage) {
      minX = Math.min(minX, stage.x);
      minY = Math.min(minY, stage.y);
      maxX = Math.max(maxX, stage.x + stage.width);
      maxY = Math.max(maxY, stage.y + stage.height);
    }

    // Đưa tất cả sections vào phạm vi
    sections.forEach(section => {
      if (section.x && section.y && section.width && section.height) {
        minX = Math.min(minX, section.x);
        minY = Math.min(minY, section.y);
        maxX = Math.max(maxX, section.x + section.width);
        maxY = Math.max(maxY, section.y + section.height);
        
        // Cần tính cả vị trí nhãn nếu có
        if (section.labelX && section.labelY) {
          minX = Math.min(minX, section.labelX - 50);
          minY = Math.min(minY, section.labelY - 10);
        }
      }
      
      // Check for rows and seats
      if (section.rows) {
        section.rows.forEach(row => {
          if (row.seats) {
            row.seats.forEach(seat => {
              if (seat.x != null && seat.y != null) {
                minX = Math.min(minX, seat.x - 10);
                minY = Math.min(minY, seat.y - 10);
                maxX = Math.max(maxX, seat.x + 10);
                maxY = Math.max(maxY, seat.y + 10);
              }
            });
          }
        });
      }
    });
    
    // Đưa tất cả venue objects vào phạm vi
    if (venueObjects && venueObjects.length > 0) {
      venueObjects.forEach(obj => {
        if (obj.x && obj.y && obj.width && obj.height) {
          minX = Math.min(minX, obj.x - 5);
          minY = Math.min(minY, obj.y - 5);
          maxX = Math.max(maxX, obj.x + obj.width + 5);
          maxY = Math.max(maxY, obj.y + obj.height + 5);
        }
      });
    }

    // Thêm padding quanh nội dung
    const padding = {
      top: 70,    // Nhiều padding ở trên để chứa nhãn sections
      right: 50,
      bottom: 50,
      left: 70    // Nhiều padding bên trái để chứa nhãn rows
    };
    
    // Đảm bảo minX, minY không phải là Infinity (trường hợp không có sections)
    if (minX === Infinity) minX = 0;
    if (minY === Infinity) minY = 0;
    if (maxX === -Infinity) maxX = 1000;
    if (maxY === -Infinity) maxY = 800;
    
    minX -= padding.left;
    minY -= padding.top;
    maxX += padding.right;
    maxY += padding.bottom;

    // Tính toán width và height
    const width = maxX - minX;
    const height = maxY - minY;

    // Xác định viewport dựa trên loại layout
    const layoutType = normalizedSeatingMap.layoutType || 'custom';
    let viewportWidth = width;
    let viewportHeight = height;
    
    // Đối với layout sân vận động lớn, điều chỉnh viewport
    if (layoutType === 'footballStadium' || layoutType === 'basketballArena') {
      // Đảm bảo tỷ lệ khung hình phù hợp và tăng kích thước để nhìn toàn cảnh
      viewportWidth = Math.max(width, height * 1.5);
      viewportHeight = Math.max(height, width * 0.7);
      
      // Căn giữa nội dung trong viewport
      minX = minX - (viewportWidth - width) / 2;
      minY = minY - (viewportHeight - height) / 2;
    } else {
      // Đảm bảo kích thước tối thiểu cho viewport
      const minViewportWidth = 800;
      const minViewportHeight = 600;
      
      viewportWidth = Math.max(width, minViewportWidth);
      viewportHeight = Math.max(height, minViewportHeight);
      
      // Căn giữa nội dung trong viewport
      minX = minX - (viewportWidth - width) / 2;
      minY = minY - (viewportHeight - height) / 2;
    }
    
    return `${minX} ${minY} ${viewportWidth} ${viewportHeight}`;
  };

  // Lấy màu sắc cho section, với trạng thái active hoặc không
  const getSectionColor = (section, isActive) => {
    const baseColor = getTicketTypeColor(section.name);
    return baseColor; // Trong trường hợp active, có thể đổi độ đậm nhạt
  };

  // Xử lý khi người dùng click vào một ghế
  const handleSeatClick = (sectionName, rowName, seatNumber) => {
    const seatInfo = { sectionName, rowName, seatNumber };
    setSelectedSeat(seatInfo);
    if (onSeatSelect) {
      onSeatSelect(seatInfo);
    }
  };

  // Render venue objects như lối vào, nhà vệ sinh, ...
  const renderVenueObject = (object) => {
    const objectType = object.objectType || object.type || 'other';
    const typeInfo = venueObjectTypes[objectType] || venueObjectTypes['other'];
    
    // Default values for safety
    const defaultColor = '#888888';
    const defaultName = object.label || typeInfo.name || 'Vật thể';

    return (
      <g 
        key={object.id}
        className="venue-object"
        transform={`translate(${object.x}, ${object.y}) rotate(${object.rotation || 0}, ${object.width/2}, ${object.height/2})`}
      >
        {/* Object background */}
        <rect
          x={0}
          y={0}
          width={object.width || 30}
          height={object.height || 30}
          fill={object.color || (typeInfo ? typeInfo.color : defaultColor)}
          fillOpacity="0.8"
          stroke={object.color || (typeInfo ? typeInfo.color : defaultColor)}
          strokeWidth="1.5"
          rx="3"
        />
        
        {/* Object label */}
        {showLabels && (
          <text
            x={(object.width || 30) / 2}
            y={-8}
            textAnchor="middle"
            fill={object.color || (typeInfo ? typeInfo.color : defaultColor)}
            fontSize="12"
            fontWeight="bold"
            className="venue-object-label"
          >
            {object.label || defaultName}
          </text>
        )}
        
        {/* Object icon/text */}
        <text
          x={(object.width || 30) / 2}
          y={(object.height || 30) / 2 + 5}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          className="venue-object-text"
        >
          {objectType ? objectType.charAt(0).toUpperCase() : '?'}
        </text>
      </g>
    );
  };

  // Filter out any potentially problematic venue objects
  const safeVenueObjects = venueObjects.filter(obj => 
    obj && typeof obj === 'object' && (obj.objectType || obj.type)
  );

  return (
    <div className="seating-preview">
      <div className="seating-container">
        <svg viewBox={calculateViewBox()} className="seating-svg">
          {/* Stage */}
          {stage && (
            <g className="stage">
              <rect
                x={stage.x}
                y={stage.y}
                width={stage.width}
                height={stage.height}
                fill={normalizedSeatingMap.layoutType === 'footballStadium' ? '#3a6e2a' : 
                      normalizedSeatingMap.layoutType === 'basketballArena' ? '#b75b1a' : 
                      "#1a1a1a"}
                stroke="#333"
                strokeWidth="2"
                rx="5"
              />
              <text
                x={stage.x + stage.width / 2}
                y={stage.y + stage.height / 2 + 5}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {normalizedSeatingMap.layoutType === 'footballStadium' ? 'SÂN BÓNG ĐÁ' : 
                 normalizedSeatingMap.layoutType === 'basketballArena' ? 'SÂN BÓNG RỔ' : 
                 'SÂN KHẤU'}
              </text>
              {/* Stage lights - only for theater/concert/outdoor layouts */}
              {!['footballStadium', 'basketballArena'].includes(normalizedSeatingMap.layoutType) && 
                Array.from({ length: 7 }, (_, i) => (
                <circle
                  key={i}
                  cx={stage.x + 50 + i * 50}
                  cy={stage.y - 10}
                  r="3"
                  fill="#FFF700"
                  opacity="0.8"
                />
                ))
              }
              
              {/* Football field markings */}
              {normalizedSeatingMap.layoutType === 'footballStadium' && (
                <g>
                  {/* Pitch background */}
                  <rect
                    x={stage.x + 10}
                    y={stage.y + 10}
                    width={stage.width - 20}
                    height={stage.height - 20}
                    fill="#4a8c3a"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Center circle */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height / 2}
                    r="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Center spot */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height / 2}
                    r="2"
                    fill="white"
                  />
                  
                  {/* Center line */}
                  <line
                    x1={stage.x + stage.width / 2}
                    y1={stage.y + 10}
                    x2={stage.x + stage.width / 2}
                    y2={stage.y + stage.height - 10}
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Penalty areas */}
                  <rect
                    x={stage.x + stage.width/2 - 40}
                    y={stage.y + 10}
                    width="80"
                    height="25"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={stage.x + stage.width/2 - 40}
                    y={stage.y + stage.height - 35}
                    width="80"
                    height="25"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  
                  {/* Goals */}
                  <rect
                    x={stage.x + stage.width / 2 - 20}
                    y={stage.y + 8}
                    width="40"
                    height="4"
                    fill="white"
                  />
                  <rect
                    x={stage.x + stage.width / 2 - 20}
                    y={stage.y + stage.height - 12}
                    width="40"
                    height="4"
                    fill="white"
                  />
                </g>
              )}
              
              {/* Basketball court markings */}
              {normalizedSeatingMap.layoutType === 'basketballArena' && (
                <g>
                  {/* Court background */}
                  <rect
                    x={stage.x + 10}
                    y={stage.y + 10}
                    width={stage.width - 20}
                    height={stage.height - 20}
                    fill="#c67941"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Center circle */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height / 2}
                    r="15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  
                  {/* Center line */}
                  <line
                    x1={stage.x + stage.width / 2}
                    y1={stage.y + 10}
                    x2={stage.x + stage.width / 2}
                    y2={stage.y + stage.height - 10}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  
                  {/* Three-point lines */}
                  <path
                    d={`M${stage.x + 30} ${stage.y + 30} 
                        A 40 40 0 0 1 ${stage.x + stage.width - 30} ${stage.y + 30}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                  <path
                    d={`M${stage.x + 30} ${stage.y + stage.height - 30} 
                        A 40 40 0 0 0 ${stage.x + stage.width - 30} ${stage.y + stage.height - 30}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                  
                  {/* Free throw lines */}
                  <line 
                    x1={stage.x + 50}
                    y1={stage.y + 35}
                    x2={stage.x + stage.width - 50}
                    y2={stage.y + 35}
                    stroke="white"
                    strokeWidth="1"
                  />
                  <line 
                    x1={stage.x + 50}
                    y1={stage.y + stage.height - 35}
                    x2={stage.x + stage.width - 50}
                    y2={stage.y + stage.height - 35}
                    stroke="white"
                    strokeWidth="1"
                  />
                  
                  {/* Baskets */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + 15}
                    r="3"
                    fill="orange"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height - 15}
                    r="3"
                    fill="orange"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </g>
              )}
            </g>
          )}

          {/* Sections */}
          {sections && sections.map((section, index) => (
            <g key={index} className={`section ${selectedSeat?.sectionName === section.name ? 'selected-section' : ''}`}>
              {/* Section background */}
              <rect
                x={section.x}
                y={section.y}
                width={section.width || 180}
                height={section.height || 150}
                rx="5"
                fill={getTicketTypeColor(section.name)}
                fillOpacity="0.3"
                stroke={getTicketTypeColor(section.name)}
                strokeWidth="1.5"
                className={hoveredSeat?.sectionName === section.name ? 'hovered-section' : ''}
              />
              
              {/* Section label - sử dụng vị trí từ section hoặc tính toán nếu không có */}
              {showLabels && (
              <text
                x={section.labelX || section.x + (section.width || 180) / 2}
                y={section.labelY || section.y - 15}
                textAnchor="middle"
                fill={getTicketTypeColor(section.name)}
                fontSize="14"
                fontWeight="bold"
              >
                {section.name}
              </text>
              )}

              {/* Section capacity label */}
              {showLabels && (
              <text
                x={section.x + (section.width || 180) / 2}
                y={section.y + (section.height || 150) / 2}
                textAnchor="middle"
                fill="#555"
                fontSize="14"
                fontWeight="bold"
              >
                {section.capacity || 
                 (section.rows ? section.rows.reduce((total, row) => 
                   total + (row.seats ? row.seats.length : 0), 0) : 0)} ghế
              </text>
              )}

              {/* Only render rows and seats visually if section is not simplified */}
              {!section.simplified && section.rows && section.rows.map((row, rowIndex) => (
                <g key={rowIndex} className="row">
                  {/* Row label - giảm kích cỡ chữ để tránh chồng lên */}
                  {showLabels && (
                  <text
                    x={section.x - 15}
                    y={row.seats && row.seats[0] ? row.seats[0].y + 4 : section.y + rowIndex * 20 + 15}
                    textAnchor="end"
                    fill="#555"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {row.name}
                  </text>
                  )}
                  
                  {/* Seats */}
                  {row.seats && row.seats.map((seat, seatIndex) => {
                    // Xác định màu của ghế dựa trên trạng thái
                    let seatColor = "#ccc";
                    let seatStrokeColor = "#999";
                    let clickable = false;
                    
                    if (seat.status === 'sold' || seat.status === 'reserved') {
                      seatColor = "#f87171"; // Màu đỏ cho ghế đã bán
                      seatStrokeColor = "#ef4444";
                    } else if (seat.status === 'available') {
                      seatColor = "#22c55e"; // Màu xanh cho ghế có sẵn
                      seatStrokeColor = "#16a34a";
                      clickable = interactive;
                    } else if (seat.status === 'selected') {
                      seatColor = "#60a5fa"; // Màu xanh dương cho ghế đã chọn
                      seatStrokeColor = "#3b82f6";
                    }
                    
                    // Kiểm tra xem ghế này có phải là ghế được chọn không
                    const isSelected = 
                      selectedSeat && 
                      selectedSeat.sectionName === section.name &&
                      selectedSeat.rowName === row.name &&
                      selectedSeat.seatNumber === seat.number;
                    
                    // Kiểm tra xem ghế này có phải là ghế đang hover không
                    const isHovered =
                      hoveredSeat && 
                      hoveredSeat.sectionName === section.name &&
                      hoveredSeat.rowName === row.name &&
                      hoveredSeat.seatNumber === seat.number;
                      
                    // Đặt kích thước ghế nhỏ hơn một chút để tránh chồng lấn
                    const seatWidth = 8;
                    const seatHeight = 8;
                      
                    return (
                      <g 
                        key={seatIndex} 
                        className={`seat ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${clickable ? 'clickable' : ''}`}
                        onClick={() => interactive && clickable ? handleSeatClick(section.name, row.name, seat.number) : null}
                        onMouseOver={() => {
                          if (interactive && clickable) {
                            setHoveredSeat({
                              sectionName: section.name,
                              rowName: row.name,
                              seatNumber: seat.number
                            });
                          }
                        }}
                        onMouseOut={() => {
                          if (interactive) {
                            setHoveredSeat(null);
                          }
                        }}
                      >
                        <rect
                          x={seat.x - seatWidth/2}
                          y={seat.y - seatHeight/2}
                          width={seatWidth}
                          height={seatHeight}
                          rx={2}
                          fill={isSelected ? "#3b82f6" : isHovered ? "#93c5fd" : seatColor}
                          stroke={isSelected || isHovered ? "#2563eb" : seatStrokeColor}
                          strokeWidth={isSelected || isHovered ? 2 : 1}
                          style={{ cursor: clickable ? 'pointer' : 'default' }}
                        />
                        {/* Seat number - only shown when hovered if interactive */}
                        {((interactive && isHovered) || (showLabels && !interactive)) && (
                          <text
                            x={seat.x}
                            y={seat.y + seatHeight + 10}
                            textAnchor="middle"
                            fill="#111"
                            fontSize="8"
                            style={{ pointerEvents: 'none' }}
                          >
                            {seat.number}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
          ))}

          {/* Render venue objects like entrances, exits, restrooms etc. */}
          {safeVenueObjects && safeVenueObjects.length > 0 && safeVenueObjects.map((object, index) => {
            return renderVenueObject({...object, id: object.id || `venue-${index}`});
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="seating-legend">
        <div className="legend-title">Chú thích:</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: "#22c55e" }}></div>
            <span>Ghế trống</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: "#f87171" }}></div>
            <span>Ghế đã bán</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: "#60a5fa" }}></div>
            <span>Ghế đang chọn</span>
          </div>
          
          {/* Show venue objects in legend if they exist */}
          {safeVenueObjects && safeVenueObjects.length > 0 && (
            <>
              {safeVenueObjects.some(obj => (obj.objectType || obj.type) === 'entrance') && (
                <div className="legend-item">
                  <div className="color-box" style={{ backgroundColor: "#4CAF50" }}></div>
                  <span>Lối vào</span>
                </div>
              )}
              {safeVenueObjects.some(obj => (obj.objectType || obj.type) === 'exit') && (
                <div className="legend-item">
                  <div className="color-box" style={{ backgroundColor: "#F44336" }}></div>
                  <span>Lối ra</span>
                </div>
              )}
              {safeVenueObjects.some(obj => (obj.objectType || obj.type) === 'restroom') && (
                <div className="legend-item">
                  <div className="color-box" style={{ backgroundColor: "#2196F3" }}></div>
                  <span>Nhà vệ sinh</span>
                </div>
              )}
              {safeVenueObjects.some(obj => (obj.objectType || obj.type) === 'food') && (
                <div className="legend-item">
                  <div className="color-box" style={{ backgroundColor: "#FF9800" }}></div>
                  <span>Quầy thức ăn</span>
                </div>
              )}
              {safeVenueObjects.some(obj => (obj.objectType || obj.type) === 'drinks') && (
                <div className="legend-item">
                  <div className="color-box" style={{ backgroundColor: "#9C27B0" }}></div>
                  <span>Quầy nước</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingPreview; 