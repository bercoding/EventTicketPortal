import React, { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaPlus, FaMinus, FaSync, FaDoorOpen, FaDoorClosed, FaRestroom, FaHamburger, FaWineBottle } from 'react-icons/fa';

const AdvancedSeatingChart = ({ eventData, selectedSeats, onSeatSelect }) => {
  useEffect(() => {
    // Debug log when component mounts or eventData changes
    console.log('🔍 AdvancedSeatingChart: Component mounted/updated with data:', {
      hasEventData: !!eventData,
      hasSeatingMap: !!(eventData && eventData.seatingMap),
      sections: eventData?.seatingMap?.sections?.length || 0,
      firstSectionPosition: eventData?.seatingMap?.sections?.[0] 
        ? `(${typeof eventData.seatingMap.sections[0].x === 'number' ? eventData.seatingMap.sections[0].x : 'missing'}, ${typeof eventData.seatingMap.sections[0].y === 'number' ? eventData.seatingMap.sections[0].y : 'missing'})` 
        : 'N/A',
      selectedSeats: selectedSeats?.length || 0
    });
    
    // Log detailed section information for debugging
    if (eventData?.seatingMap?.sections) {
      eventData.seatingMap.sections.forEach((section, idx) => {
        console.log(`🪑 Section ${idx}: ${section.name} at (${typeof section.x === 'number' ? section.x : 'missing'}, ${typeof section.y === 'number' ? section.y : 'missing'})`);
        
        if (section.rows) {
          console.log(`  - Has ${section.rows.length} rows`);
          section.rows.forEach((row, rIdx) => {
            if (row.seats && row.seats.length > 0) {
              console.log(`    - Row ${row.name}: ${row.seats.length} seats, first seat at (${typeof row.seats[0].x === 'number' ? row.seats[0].x : 'missing'}, ${typeof row.seats[0].y === 'number' ? row.seats[0].y : 'missing'})`);
            }
          });
        }
      });
    }
    
    // Log venue objects
    if (eventData?.seatingMap?.venueObjects) {
      console.log(`🏢 Venue objects: ${eventData.seatingMap.venueObjects.length}`);
      eventData.seatingMap.venueObjects.forEach((obj, idx) => {
        console.log(`  - ${obj.type}: ${obj.label} at (${obj.x}, ${obj.y})`);
      });
    }
  }, [eventData, selectedSeats]);

  if (!eventData || !eventData.seatingMap || !eventData.ticketTypes) {
    console.error('❌ Missing required data for AdvancedSeatingChart:', {
      hasEventData: !!eventData,
      hasSeatingMap: !!(eventData && eventData.seatingMap),
      hasTicketTypes: !!(eventData && eventData.ticketTypes),
      seatingMapSections: eventData?.seatingMap?.sections?.length || 0
    });
    return <div className="text-center p-8">Đang tải sơ đồ ghế...</div>;
  }

  // Extract seating map data
  const { seatingMap, ticketTypes } = eventData;
  
  // Enhanced validation and default values
  if (!seatingMap) {
    console.error('❌ Seating map is undefined or null');
    return <div className="text-center p-8">Không thể tải sơ đồ ghế</div>;
  }

  const sections = seatingMap.sections || [];
  const stage = seatingMap.stage || { x: 400, y: 80, width: 400, height: 100 };
  
  // Use venue objects from seating map
  let venueObjects = seatingMap.venueObjects || [];
  
  // Log detailed information for debugging
  console.log('🎭 RENDERING AdvancedSeatingChart with:', {
    eventId: eventData._id,
    eventTitle: eventData.title,
    sectionsCount: sections.length,
    venueObjectsCount: venueObjects.length,
    sections: sections.map(s => ({
      name: s.name,
      position: `(${s.x}, ${s.y})`,
      size: `${s.width}x${s.height}`,
      rowCount: Array.isArray(s.rows) ? s.rows.length : 0,
      seatCount: Array.isArray(s.rows) 
        ? s.rows.reduce((acc, row) => acc + (Array.isArray(row.seats) ? row.seats.length : 0), 0) 
        : 0
    }))
  });

  // Prepare SVG viewport dimensions - INCREASED for better visibility
  const SVG_WIDTH = 1400;
  const SVG_HEIGHT = 1000;
  
  // Utility function to get colors based on seat status
  const getSeatFillColor = (seat, section) => {
    // If seat is selected, use the selected color
    const isSelected = selectedSeats && selectedSeats.some(s => 
      s._id === seat._id || 
      (s.section === section.name && s.row === seat.rowName && s.number === seat.number)
    );
    
    if (isSelected) return '#4CAF50'; // Bright green for selected
    
    // For available seats, use the ticket type color
    if (seat.status === 'available' || !seat.status) {
      if (section && section.ticketTier) {
        const ticketType = ticketTypes.find(tt => 
          tt._id === section.ticketTier || 
          tt._id.toString() === section.ticketTier.toString()
        );
        
        if (ticketType && ticketType.color) {
          return ticketType.color;
        }
      }
      return '#2196F3'; // Bright blue for available
    }
    
    // For unavailable seats, use the appropriate color
    switch (seat.status) {
      case 'reserved':
        return '#FFC107'; // Amber
      case 'sold':
        return '#F44336'; // Bright red
      case 'locked':
        return '#9E9E9E'; // Gray
      case 'maintenance':
        return '#9C27B0'; // Purple
      default:
        return '#E0E0E0'; // Light gray
    }
  };
  
  // Get a color for ticket type display
  const getTicketTypeColor = (ticketType, index) => {
    if (ticketType && ticketType.color) return ticketType.color;
    
    // Default color palette - Brighter, more distinct colors
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green
      '#9C27B0', // Purple
      '#FFC107', // Amber
      '#E91E63', // Pink
      '#00BCD4', // Cyan
    ];
    
    return colors[index % colors.length];
  };
  
  // Controls component for TransformWrapper
  const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
    <div className="absolute left-2 top-2 z-10 bg-gray-800/60 text-white p-2 flex space-x-1 rounded">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          zoomIn();
        }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaPlus size={14} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          zoomOut();
        }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaMinus size={14} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          resetTransform();
        }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaSync size={14} />
      </button>
    </div>
  );

  // Render stage
  const renderStage = () => {
    // Ensure stage has valid coordinates and dimensions
    const stageX = typeof stage.x === 'number' ? stage.x : 400;
    const stageY = typeof stage.y === 'number' ? stage.y : 80;
    const stageWidth = typeof stage.width === 'number' ? stage.width : 400;
    const stageHeight = typeof stage.height === 'number' ? stage.height : 100;
    
    console.log(`🎭 Rendering stage at (${stageX}, ${stageY}) with ${stageWidth}x${stageHeight}`);
    
    return (
      <g className="stage">
        <rect
          x={stageX}
          y={stageY}
          width={stageWidth}
          height={stageHeight}
          fill="#374151"
          stroke="#FFFFFF"
          strokeWidth={3}
          rx={8}
        />
        <text
          x={stageX + stageWidth / 2}
          y={stageY + stageHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={20}
          fontWeight="bold"
        >
          SÂN KHẤU
        </text>
      </g>
    );
  };

  // Render venue objects like entrances, exits, and facilities
  const renderVenueObjects = () => {
    if (!venueObjects || venueObjects.length === 0) return null;
    
    // Default colors for each type
    const defaultColors = {
      entrance: '#4CAF50', // Green
      exit: '#F44336',     // Red
      wc: '#2196F3',       // Blue
      food: '#FF9800',     // Orange
      drinks: '#FF9800',   // Orange
      default: '#6B7280'   // Gray
    };
    
    return (
      <g className="venue-objects">
        {venueObjects.map((object, index) => {
          // Get color based on type if not specified
          const color = object.color || defaultColors[object.type] || defaultColors.default;
          
          // Simple object rendering with SVG shapes instead of icons
          return (
            <g 
              key={`venue-object-${index}`} 
              className={`venue-object ${object.type}`}
            >
              {/* Background for facility */}
              <rect
                x={object.x}
                y={object.y}
                width={object.width || 60}
                height={object.height || 40}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={2}
                rx={8}
              />
              
              {/* Icon symbol based on type */}
              {object.type === 'entrance' && (
                <path
                  d={`M${object.x + 15},${object.y + 20} L${object.x + 30},${object.y + 10} L${object.x + 45},${object.y + 20} L${object.x + 45},${object.y + 30} L${object.x + 15},${object.y + 30} Z`}
                  fill="#FFFFFF"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                />
              )}
              
              {object.type === 'exit' && (
                <path
                  d={`M${object.x + 15},${object.y + 10} L${object.x + 45},${object.y + 10} L${object.x + 45},${object.y + 30} L${object.x + 15},${object.y + 30} Z`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}
              
              {object.type === 'wc' && (
                <circle
                  cx={object.x + 30}
                  cy={object.y + 20}
                  r={10}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}
              
              {(object.type === 'food' || object.type === 'drinks') && (
                <rect
                  x={object.x + 20}
                  y={object.y + 15}
                  width={20}
                  height={15}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  rx={2}
                />
              )}
              
              {/* Label for facility */}
              <text
                x={object.x + (object.width || 60) / 2}
                y={object.y + (object.height || 40) / 2 + 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontSize={12}
                fontWeight="bold"
              >
                {object.label || object.type.toUpperCase()}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Render sections with rows and seats
  const renderSections = () => {
    if (!sections || sections.length === 0) {
      console.warn("❌ No sections to render in seatingMap");
      return null;
    }
    
    console.log(`🎭 Rendering ${sections.length} sections in AdvancedSeatingChart`);
    
    return sections.map((section, sectionIndex) => {
      // CRITICAL FIX: Always trust the actual section coordinates
      // Only calculate as fallback if absolutely necessary
      
      // Get exact coordinates from the section data
      const sectionX = typeof section.x === 'number' ? section.x : null;
      const sectionY = typeof section.y === 'number' ? section.y : null;
      const sectionWidth = typeof section.width === 'number' ? section.width : 300;
      const sectionHeight = typeof section.height === 'number' ? section.height : 150;
      
      // Log the exact coordinates we found in the data
      console.log(`📍 Original section coordinates: ${section.name} at (${sectionX}, ${sectionY})`);
      
      // Only calculate position if coordinates are actually missing
      let finalX = sectionX;
      let finalY = sectionY;
      
      // Only if we don't have valid coordinates, try to calculate from seats
      if (finalX === null || finalY === null) {
        console.log(`🔍 Section ${section.name} missing coordinates, calculating from seats`);
        
        if (Array.isArray(section.rows) && section.rows.length > 0) {
          const firstRow = section.rows[0];
          if (Array.isArray(firstRow.seats) && firstRow.seats.length > 0) {
            // Get first and last seat in first row
            const firstSeat = firstRow.seats[0];
            
            if (typeof firstSeat.x === 'number' && typeof firstSeat.y === 'number') {
              // Calculate section position based on first seat
              finalX = firstSeat.x - 30; // Padding to the left
              finalY = firstSeat.y - 30; // Padding above
              
              console.log(`✅ Calculated section position: (${finalX}, ${finalY}) with size ${sectionWidth}x${sectionHeight}`);
            }
          }
        }
      } else {
        console.log(`✅ Using section's original position: (${finalX}, ${finalY})`);
      }
      
      // If we still don't have valid coordinates, use defaults based on section index
      if (finalX === null || finalY === null) {
        console.warn(`⚠️ Could not calculate coordinates for section ${section.name}, using defaults`);
        finalX = 100 + (sectionIndex % 3) * 400;
        finalY = 200 + Math.floor(sectionIndex / 3) * 300;
      }
      
      // Final confirmation of the coordinates we're using
      console.log(`🎭 Rendering section "${section.name}" at (${finalX}, ${finalY}) with ${sectionWidth}x${sectionHeight}`);
      
      // Determine section name
      const sectionName = section.name || `Section ${sectionIndex + 1}`;
      
      // Check for rows and seats
      let hasSeats = false;
      if (Array.isArray(section.rows)) {
        section.rows.forEach((row) => {
          if (Array.isArray(row.seats) && row.seats.length > 0) {
            hasSeats = true;
            console.log(`   🎭 Row ${row.name}: ${row.seats.length} seats`);
          }
        });
      }
      
      if (!hasSeats) {
        console.warn(`❌ Section "${section.name}" has no valid seats`);
      }
      
      // Determine section color based on ticket type
      let sectionColor = '#e5e7eb'; // Default light gray
      let ticketInfo = '';
      
      if (section.ticketTier) {
        const ticketType = ticketTypes.find(tt => 
          tt._id === section.ticketTier || 
          tt._id.toString() === section.ticketTier.toString()
        );
        
        if (ticketType) {
          sectionColor = ticketType.color || getTicketTypeColor(ticketType, sectionIndex);
          ticketInfo = ` (${ticketType.name})`;
          console.log(`🎫 Section "${section.name}" has ticket type: ${ticketType.name} with color ${sectionColor}`);
        }
      }
      
      return (
        <g key={`section-${sectionIndex}`} className="section">
          {/* Section background */}
          <rect
            x={finalX}
            y={finalY}
            width={sectionWidth}
            height={sectionHeight}
            fill={`${sectionColor}20`} 
            stroke={sectionColor}
            strokeWidth={3}
            strokeDasharray="5,3"
            rx={8}
          />
          
          {/* Section name */}
          <text
            x={finalX + sectionWidth / 2}
            y={finalY - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="bold"
            fontSize={18}
            stroke="#000000"
            strokeWidth={0.5}
            paintOrder="stroke"
          >
            {sectionName}
          </text>
          
          {/* Ticket type name - displayed below section name */}
          {ticketInfo && (
            <text
              x={finalX + sectionWidth / 2}
              y={finalY - 30}
              textAnchor="middle"
              fill={sectionColor}
              fontWeight="bold"
              fontSize={16}
              stroke="#000000"
              strokeWidth={0.3}
              paintOrder="stroke"
            >
              {ticketInfo}
            </text>
          )}
          
          {/* Render seats */}
          {Array.isArray(section.rows) && section.rows.map((row, rowIndex) => {
            if (!row || !Array.isArray(row.seats) || row.seats.length === 0) {
              return null;
            }
            
            // Calculate row label position
            let labelX = null;
            let labelY = null;
            
            // Tính toán vị trí nhãn hàng dựa trên cách tính toán vị trí ghế mới
            // Đặt nhãn hàng bên trái hàng
            if (section.rows && section.rows.length > 0) {
              // Tính số hàng và số ghế tối đa trong một hàng
              const totalRows = section.rows.length;
              const maxSeatsInRow = Math.max(...section.rows.map(r => r.seats ? r.seats.length : 0));
              
              // Tính khoảng cách giữa các ghế và khoảng cách giữa các hàng
              const seatSpacingX = sectionWidth / (maxSeatsInRow + 1);
              const seatSpacingY = sectionHeight / (totalRows + 1);
              
              // Tính vị trí nhãn hàng - đặt bên trái hàng
              labelX = finalX - 20; // Lùi 20px về bên trái so với section
              labelY = finalY + (rowIndex + 1) * seatSpacingY; // Cùng chiều cao với hàng ghế
            }
            
            return (
              <g key={`row-${sectionIndex}-${rowIndex}`} className="row">
                {/* Row label */}
                {labelX !== null && labelY !== null && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={14}
                    fontWeight="bold"
                    stroke="#000000"
                    strokeWidth={0.3}
                  >
                    {row.name}
                  </text>
                )}
                
                {/* Seats */}
                {row.seats.map((seat, seatIndex) => {
                  if (!seat) {
                    return null;
                  }
                  
                  // Tính toán lại vị trí ghế dựa trên kích thước section và vị trí trong hàng
                  // Thay vì sử dụng tọa độ từ database, chúng ta sẽ tính toán vị trí để đảm bảo phân bố đều
                  
                  // Tính số hàng và số ghế tối đa trong một hàng
                  const totalRows = section.rows.length;
                  const maxSeatsInRow = Math.max(...section.rows.map(r => r.seats ? r.seats.length : 0));
                  
                  // Tính khoảng cách giữa các ghế và khoảng cách giữa các hàng
                  const seatSpacingX = sectionWidth / (maxSeatsInRow + 1);
                  const seatSpacingY = sectionHeight / (totalRows + 1);
                  
                  // Tính vị trí ghế trong section
                  const relativeX = (seatIndex + 1) * seatSpacingX;
                  const relativeY = (rowIndex + 1) * seatSpacingY;
                  
                  // Tính toán vị trí cuối cùng của ghế
                  const seatX = finalX + relativeX;
                  const seatY = finalY + relativeY;
                  
                  // Log để debug
                  if (seatIndex === 0 && rowIndex === 0) {
                    console.log(`Section ${section.name}: ${sectionWidth}x${sectionHeight} at (${finalX}, ${finalY})`);
                    console.log(`Row ${row.name}, Seat ${seat.number}: calculated position (${seatX}, ${seatY})`);
                    console.log(`Spacing: X=${seatSpacingX}, Y=${seatSpacingY}, Total rows: ${totalRows}, Max seats: ${maxSeatsInRow}`);
                  }
                  
                  // Determine if this seat is selected
                  const isSelected = selectedSeats && selectedSeats.some(s => 
                    s._id === seat._id || 
                    (s.section === section.name && s.row === row.name && s.number === seat.number)
                  );
                  
                  // Determine seat status
                  const isAvailable = seat.status !== 'sold' && seat.status !== 'reserved';
                  
                  // Determine seat size based on density
                  const seatSize = 18; // Default seat size
                  
                  // Generate unique identifier for the seat
                  const seatId = `seat-${section.name}-${row.name}-${seat.number}`;
                  
                  // Determine fill color based on status
                  const fillColor = getSeatFillColor(seat, section);
                  
                  return (
                    <g 
                      key={`seat-${sectionIndex}-${rowIndex}-${seatIndex}`} 
                      className={`seat ${isSelected ? 'selected' : ''} ${isAvailable ? 'available' : 'unavailable'}`}
                      onClick={() => {
                        if (onSeatSelect && isAvailable) {
                          const seatData = {
                            _id: seat._id || seatId,
                            section: section.name,
                            sectionName: section.name,
                            row: row.name,
                            number: seat.number,
                            price: ticketTypes.find(tt => tt._id === section.ticketTier)?.price || 0,
                            status: seat.status || 'available',
                            // Lưu lại vị trí tính toán để có thể sử dụng sau này
                            calculatedX: relativeX,
                            calculatedY: relativeY
                          };
                          onSeatSelect(seatData);
                        }
                      }}
                    >
                      {/* Seat shape */}
                      <rect
                        x={seatX - seatSize/2}
                        y={seatY - seatSize/2}
                        width={seatSize}
                        height={seatSize}
                        rx={4}
                        fill={fillColor}
                        stroke={isSelected ? '#ffffff' : '#000000'}
                        strokeWidth={isSelected ? 2 : 0.5}
                        style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                      />
                      
                      {/* Seat number */}
                      <text
                        x={seatX}
                        y={seatY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={isSelected || seat.status === 'sold' || seat.status === 'reserved' ? '#FFFFFF' : '#000000'}
                        fontSize={10}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {seat.number}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      );
    });
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      <div className="absolute top-16 right-2 z-10 bg-blue-700/80 text-white p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="font-bold mb-2">Hướng dẫn sử dụng:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Nhấn vào ghế trống để chọn</li>
          <li>Nhấn lại để bỏ chọn</li>
          <li>Dùng +/- để phóng to/thu nhỏ</li>
          <li>Kéo để di chuyển sơ đồ</li>
        </ul>
      </div>
      
      <TransformWrapper
        initialScale={0.7}
        minScale={0.3}
        maxScale={3}
        defaultPositionX={0}
        defaultPositionY={0}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            <Controls zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} />
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ background: '#1a202c' }}>
                {renderStage()}
                {renderVenueObjects()}
                {renderSections()}
              </svg>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default AdvancedSeatingChart; 