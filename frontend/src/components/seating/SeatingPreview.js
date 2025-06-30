import React from 'react';
import './SeatingPreview.css';

const SeatingPreview = ({ seatingMap, showLabels = true, interactive = false }) => {
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
      return "0 0 1000 800"; // Default fallback
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Include stage bounds
    if (stage) {
      minX = Math.min(minX, stage.x);
      minY = Math.min(minY, stage.y);
      maxX = Math.max(maxX, stage.x + stage.width);
      maxY = Math.max(maxY, stage.y + stage.height);
    }

    // Include all sections bounds
    sections.forEach(section => {
      // Calculate section bounds from seats if not provided
      let bounds = { x: 0, y: 0, width: 100, height: 100 };
      
      if (section.rows && section.rows.length > 0) {
        const allSeats = section.rows.flatMap(row => row.seats || []);
        if (allSeats.length > 0) {
          const validSeats = allSeats.filter(seat => !isNaN(seat.x) && !isNaN(seat.y));
          if (validSeats.length > 0) {
            const seatMinX = Math.min(...validSeats.map(seat => seat.x)) - 10;
            const seatMaxX = Math.max(...validSeats.map(seat => seat.x)) + 20;
            const seatMinY = Math.min(...validSeats.map(seat => seat.y)) - 10;
            const seatMaxY = Math.max(...validSeats.map(seat => seat.y)) + 20;
            bounds = {
              x: seatMinX,
              y: seatMinY,
              width: seatMaxX - seatMinX,
              height: seatMaxY - seatMinY
            };
          }
        }
      }
      
      // Use provided bounds or calculated bounds
      const finalBounds = {
        x: !isNaN(section.x) ? section.x : bounds.x,
        y: !isNaN(section.y) ? section.y : bounds.y,
        width: !isNaN(section.width) ? section.width : bounds.width,
        height: !isNaN(section.height) ? section.height : bounds.height
      };
      
      minX = Math.min(minX, finalBounds.x - 20);
      minY = Math.min(minY, finalBounds.y - 30); // Extra space for labels
      maxX = Math.max(maxX, finalBounds.x + finalBounds.width + 20);
      maxY = Math.max(maxY, finalBounds.y + finalBounds.height + 40); // Extra space for capacity labels
    });

    // Add padding around content
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate width and height
    const width = maxX - minX;
    const height = maxY - minY;

    // Ensure minimum size
    const minWidth = 600;
    const minHeight = 400;
    
    const finalWidth = Math.max(width, minWidth);
    const finalHeight = Math.max(height, minHeight);
    
    // Center the viewport if content is smaller than minimum
    const adjustedMinX = width < minWidth ? minX - (minWidth - width) / 2 : minX;
    const adjustedMinY = height < minHeight ? minY - (minHeight - height) / 2 : minY;

    return `${adjustedMinX} ${adjustedMinY} ${finalWidth} ${finalHeight}`;
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
                fill="#1a1a1a"
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
                    fill="#228B22"
                    stroke="white"
                    strokeWidth="3"
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
                    x={stage.x + stage.width/2 - 25}
                    y={stage.y + 10}
                    width="50"
                    height="25"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <rect
                    x={stage.x + stage.width/2 - 25}
                    y={stage.y + stage.height - 35}
                    width="50"
                    height="25"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Goal areas */}
                  <rect
                    x={stage.x + stage.width/2 - 12}
                    y={stage.y + 10}
                    width="24"
                    height="12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <rect
                    x={stage.x + stage.width/2 - 12}
                    y={stage.y + stage.height - 22}
                    width="24"
                    height="12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Goals */}
                  <rect
                    x={stage.x + stage.width / 2 - 15}
                    y={stage.y + 5}
                    width="30"
                    height="5"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1"
                  />
                  <rect
                    x={stage.x + stage.width / 2 - 15}
                    y={stage.y + stage.height - 10}
                    width="30"
                    height="5"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1"
                  />
                  
                  {/* Corner arcs */}
                  <path
                    d={`M ${stage.x + 10} ${stage.y + 10} A 8 8 0 0 1 ${stage.x + 18} ${stage.y + 10}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${stage.x + stage.width - 18} ${stage.y + 10} A 8 8 0 0 1 ${stage.x + stage.width - 10} ${stage.y + 10}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${stage.x + 10} ${stage.y + stage.height - 10} A 8 8 0 0 1 ${stage.x + 18} ${stage.y + stage.height - 10}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${stage.x + stage.width - 18} ${stage.y + stage.height - 10} A 8 8 0 0 1 ${stage.x + stage.width - 10} ${stage.y + stage.height - 10}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              )}
              
              {/* Basketball court markings */}
              {seatingMap.layoutType === 'basketballArena' && (
                <g>
                  {/* Center circle */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height / 2}
                    r="15"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Center line */}
                  <line
                    x1={stage.x + stage.width / 2}
                    y1={stage.y}
                    x2={stage.x + stage.width / 2}
                    y2={stage.y + stage.height}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Free throw circles */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + 15}
                    r="8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height - 15}
                    r="8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                  {/* Baskets */}
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y}
                    r="3"
                    fill="orange"
                  />
                  <circle
                    cx={stage.x + stage.width / 2}
                    cy={stage.y + stage.height}
                    r="3"
                    fill="orange"
                  />
                </g>
              )}
            </g>
          )}

          {/* Sections */}
          {sections.map((section, sectionIndex) => {
            const sectionColor = getTicketTypeColor(section.name);
            const sectionLabel = getSectionLabel(section.name);
            
            // Calculate section bounds from seats if not provided
            let sectionBounds = { x: 0, y: 0, width: 100, height: 100 };
            if (section.rows && section.rows.length > 0) {
              const allSeats = section.rows.flatMap(row => row.seats || []);
              if (allSeats.length > 0) {
                const validSeats = allSeats.filter(seat => !isNaN(seat.x) && !isNaN(seat.y));
                if (validSeats.length > 0) {
                  const minX = Math.min(...validSeats.map(seat => seat.x)) - 10;
                  const maxX = Math.max(...validSeats.map(seat => seat.x)) + 20;
                  const minY = Math.min(...validSeats.map(seat => seat.y)) - 10;
                  const maxY = Math.max(...validSeats.map(seat => seat.y)) + 20;
                  sectionBounds = {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                  };
                }
              }
            }
            
            // Use provided bounds or calculated bounds
            const bounds = {
              x: !isNaN(section.x) ? section.x : sectionBounds.x,
              y: !isNaN(section.y) ? section.y : sectionBounds.y,
              width: !isNaN(section.width) ? section.width : sectionBounds.width,
              height: !isNaN(section.height) ? section.height : sectionBounds.height
            };
            
            return (
              <g key={sectionIndex} className="section">
                {/* Section Background */}
                <rect
                  x={bounds.x - 10}
                  y={bounds.y - 10}
                  width={bounds.width + 20}
                  height={bounds.height + 20}
                  fill={sectionColor}
                  opacity="0.1"
                  stroke={sectionColor}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  rx="8"
                />
                
                {/* Section Label */}
                {showLabels && (
                  <text
                    x={bounds.x + bounds.width / 2}
                    y={bounds.y - 15}
                    textAnchor="middle"
                    fill={sectionColor}
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {sectionLabel}
                  </text>
                )}

                {/* Seats */}
                {section.rows && section.rows.map((row, rowIndex) => (
                  <g key={rowIndex} className="row">
                    {row.seats && row.seats.map((seat, seatIndex) => {
                      // Validate seat coordinates
                      const seatX = !isNaN(seat.x) ? seat.x : 50 + seatIndex * 30;
                      const seatY = !isNaN(seat.y) ? seat.y : 100 + rowIndex * 30;
                      
                      return (
                        <g key={seatIndex} className="seat-group">
                          <circle
                            cx={seatX}
                            cy={seatY}
                            r="8"
                            fill={getSeatStatusColor(seat, sectionColor)}
                            stroke="#fff"
                            strokeWidth="1"
                            opacity={seat.status === 'available' ? 0.8 : 0.3}
                            className={interactive ? 'seat-interactive' : 'seat'}
                          />
                          {/* Seat number for small sections */}
                          {section.rows.length <= 5 && (
                            <text
                              x={seatX}
                              y={seatY + 3}
                              textAnchor="middle"
                              fill="white"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {seat.seatNumber || seat.number || `${seatIndex + 1}`}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Row label */}
                    {showLabels && row.seats && row.seats.length > 0 && (
                      <text
                        x={(!isNaN(row.seats[0].x) ? row.seats[0].x : 50) - 20}
                        y={(!isNaN(row.seats[0].y) ? row.seats[0].y : 100 + rowIndex * 30) + 3}
                        textAnchor="middle"
                        fill="#666"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {row.rowLetter || row.name || `R${rowIndex + 1}`}
                      </text>
                    )}
                  </g>
                ))}

                {/* Section capacity */}
                {showLabels && (
                  <text
                    x={bounds.x + bounds.width / 2}
                    y={bounds.y + bounds.height + 25}
                    textAnchor="middle"
                    fill="#666"
                    fontSize="10"
                  >
                    {section.capacity || (section.rows ? section.rows.reduce((total, row) => total + (row.seats ? row.seats.length : 0), 0) : 0)} ghế
                  </text>
                )}
              </g>
            );
          })}
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