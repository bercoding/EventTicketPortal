import React, { useState } from 'react';
import './SeatingPreview.css';

const SeatingPreview = ({ seatingMap, showLabels = true, interactive = false, onSeatSelect }) => {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  if (!seatingMap || !seatingMap.sections) {
    return (
      <div className="seating-preview empty">
        <p>Chưa có sơ đồ ghế</p>
      </div>
    );
  }

  const { sections, stage } = seatingMap;

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
    const layoutType = seatingMap.layoutType || 'custom';
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
                fill={seatingMap.layoutType === 'footballStadium' ? '#3a6e2a' : 
                      seatingMap.layoutType === 'basketballArena' ? '#b75b1a' : 
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
                {seatingMap.layoutType === 'footballStadium' ? 'SÂN BÓNG ĐÁ' : 
                 seatingMap.layoutType === 'basketballArena' ? 'SÂN BÓNG RỔ' : 
                 'SÂN KHẤU'}
              </text>
              {/* Stage lights - only for theater/concert/outdoor layouts */}
              {!['footballStadium', 'basketballArena'].includes(seatingMap.layoutType) && 
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
              {seatingMap.layoutType === 'footballStadium' && (
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
              {seatingMap.layoutType === 'basketballArena' && (
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

              {/* Section capacity label */}
              <text
                x={section.x + (section.width || 180) / 2}
                y={section.y + 20}
                textAnchor="middle"
                fill="#555"
                fontSize="12"
              >
                {section.capacity || 
                 (section.rows ? section.rows.reduce((total, row) => 
                   total + (row.seats ? row.seats.length : 0), 0) : 0)} ghế
              </text>

              {/* Rows */}
              {section.rows && section.rows.map((row, rowIndex) => (
                <g key={rowIndex} className="row">
                  {/* Row label - giảm kích cỡ chữ để tránh chồng lên */}
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
                      clickable = true;
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
                        className={`seat ${clickable ? 'available' : ''} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                        onClick={clickable ? () => handleSeatClick(section.name, row.name, seat.number) : undefined}
                        onMouseEnter={clickable ? () => setHoveredSeat({sectionName: section.name, rowName: row.name, seatNumber: seat.number}) : undefined}
                        onMouseLeave={clickable ? () => setHoveredSeat(null) : undefined}
                      >
                        <rect
                          x={seat.x - seatWidth/2}
                          y={seat.y - seatHeight/2}
                          width={seatWidth}
                          height={seatHeight}
                          rx="2"
                          fill={isSelected ? '#3b82f6' : isHovered ? '#93c5fd' : seatColor}
                          stroke={isSelected || isHovered ? '#1d4ed8' : seatStrokeColor}
                          strokeWidth={isSelected || isHovered ? 2 : 1}
                          className={clickable ? 'cursor-pointer' : ''}
                        />
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="seating-legend">
          {/* Trạng thái ghế */}
          <div className="legend-section">
            <h5>Trạng thái ghế:</h5>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
              <span>Đang chọn</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
              <span>Đã bán</span>
            </div>
          </div>
          
          {/* Loại vé */}
          <div className="legend-section">
            <h5>Loại vé:</h5>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
              <span>Golden Circle</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#8B5CF6' }}></div>
              <span>VIP</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
              <span>Khu A</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
              <span>Khu B</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#F97316' }}></div>
              <span>Khu C</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
              <span>Khu D</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="seating-stats">
          <div className="stat">
            <strong>Tổng ghế:</strong> {sections.reduce((total, section) => total + section.capacity, 0)}
          </div>
          <div className="stat">
            <strong>Số khu:</strong> {sections.length}
          </div>
          <div className="stat">
            <strong>Layout:</strong> {seatingMap.layoutType || 'theater'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingPreview; 