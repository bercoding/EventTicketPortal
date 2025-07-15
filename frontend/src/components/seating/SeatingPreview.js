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

  // Define venue object types
  const venueObjectTypes = {
    'entrance': { name: 'Lối vào', icon: <FaDoorOpen />, color: '#4CAF50' },
    'exit': { name: 'Lối ra', icon: <FaDoorClosed />, color: '#F44336' },
    'wc': { name: 'Nhà vệ sinh', icon: <FaToilet />, color: '#2196F3' },
    'food': { name: 'Đồ ăn', icon: <FaHamburger />, color: '#FF9800' },
    'drinks': { name: 'Đồ uống', icon: <FaGlassMartiniAlt />, color: '#9C27B0' },
    'accessibility': { name: 'Lối đi cho người khuyết tật', icon: <FaWheelchair />, color: '#607D8B' },
    'info': { name: 'Thông tin', icon: <FaInfoCircle />, color: '#00BCD4' },
    'other': { name: 'Khác', icon: <FaInfoCircle />, color: '#9E9E9E' }
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
  const handleSeatClick = (seat, section, row) => {
    const seatInfo = { sectionName: section.name, rowName: row.name, seatNumber: seat.number };
    setSelectedSeat(seatInfo);
    if (onSeatSelect) {
      onSeatSelect(seatInfo);
    }
  };

  // Xử lý khi người dùng hover vào một ghế
  const handleSeatHover = (seat, section, row) => {
    if (interactive) {
      setHoveredSeat({
        sectionName: section.name,
        rowName: row.name,
        seatNumber: seat.number
      });
    }
  };

  // Render venue objects (lối vào, lối ra, wc, etc.)
  const renderVenueObjects = () => {
    if (!normalizedSeatingMap.venueObjects || !Array.isArray(normalizedSeatingMap.venueObjects)) {
      return null;
    }

    return normalizedSeatingMap.venueObjects.map((obj, index) => {
      // Get object type - support both 'type' and 'objectType' properties
      const objectType = obj.objectType || obj.type || 'other';
      const typeInfo = venueObjectTypes[objectType.toLowerCase()] || venueObjectTypes.other;
      
      // Log for debugging
      console.log(`Rendering venue object: ${objectType}`, obj);

      return (
        <div
          key={`venue-object-${index}`}
          className="venue-object"
          style={{
            left: `${obj.x}px`,
            top: `${obj.y}px`,
            width: `${obj.width || 40}px`,
            height: `${obj.height || 40}px`,
            backgroundColor: typeInfo.color
          }}
          title={obj.label || typeInfo.name}
        >
          <div className="venue-object-icon">
            {typeInfo.icon}
          </div>
          {showLabels && (
            <div className="venue-object-label">
              {obj.label || typeInfo.name}
            </div>
          )}
        </div>
      );
    });
  };

  // Filter out any potentially problematic venue objects
  const safeVenueObjects = venueObjects.filter(obj => 
    obj && typeof obj === 'object' && (obj.objectType || obj.type)
  );

  return (
    <div className="seating-preview">
      {/* Stage */}
      {stage && (
        <div 
          className="stage"
          style={{
            left: `${stage.x}px`,
            top: `${stage.y}px`,
            width: `${stage.width}px`,
            height: `${stage.height}px`,
            background: stage.gradient ? 
              `linear-gradient(to bottom, ${stage.gradient.start || '#4f46e5'}, ${stage.gradient.end || '#1e40af'})` :
              '#4f46e5'
          }}
        >
          <div className="stage-text">SÂN KHẤU</div>
        </div>
      )}
      
      {/* Sections */}
      {sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="section">
          {/* Section name */}
          <div 
            className="section-name"
            style={{
              left: `${section.x + section.width / 2}px`,
              top: `${section.y - 25}px`
            }}
          >
            {section.name}
          </div>
          
          {/* Rows */}
          {section.rows && section.rows.map((row, rowIndex) => (
            <div key={`row-${sectionIndex}-${rowIndex}`} className="row">
              {/* Row name */}
              <div 
                className="row-name"
                style={{
                  left: `${section.x - 25}px`,
                  top: `${section.y + 20 + rowIndex * 35}px`
                }}
              >
                {row.name}
              </div>
              
              {/* Seats */}
              {row.seats && row.seats.map((seat, seatIndex) => (
                <div
                  key={`seat-${sectionIndex}-${rowIndex}-${seatIndex}`}
                  className={`seat ${seat.status} ${selectedSeat && selectedSeat.id === seat.id ? 'selected' : ''} ${hoveredSeat && hoveredSeat.id === seat.id ? 'hovered' : ''}`}
                  style={{
                    left: `${seat.x}px`,
                    top: `${seat.y}px`
                  }}
                  onClick={() => handleSeatClick(seat, section, row)}
                  onMouseEnter={() => handleSeatHover(seat, section, row)}
                  onMouseLeave={() => setHoveredSeat(null)}
                >
                  {seat.number}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      
      {/* Venue Objects */}
      {renderVenueObjects()}
    </div>
  );
};

export default SeatingPreview; 