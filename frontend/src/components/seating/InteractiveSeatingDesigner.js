import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaUndo, FaRedo, FaTrash, FaDoorOpen, FaDoorClosed, FaToilet, FaHamburger, FaGlassMartiniAlt, FaWheelchair, FaInfoCircle } from 'react-icons/fa';
import './InteractiveSeatingDesigner.css';

const InteractiveSeatingDesigner = ({ 
  initialSeatingMap, 
  onSeatingMapChange, 
  ticketTypes = [],
  onTicketTypesChange,
  layoutType = 'custom' // Add layout type prop
}) => {
  // Canvas dimensions - made larger for better space
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

  // Lấy kích thước stage mặc định dựa trên loại layout
  const getDefaultStageSize = () => {
    switch (layoutType) {
      case 'footballStadium':
        return { width: 400, height: 200 };
      case 'basketballArena':
        return { width: 350, height: 180 };
      default:
        return { width: 200, height: 60 };
    }
  };

  // State management
  const [seatingMap, setSeatingMap] = useState(initialSeatingMap || {
    stage: { 
      x: 500, 
      y: 100, 
      ...getDefaultStageSize()
    },
    sections: [],
    venueObjects: []  // New array for venue objects like entrances
  });

  // Update stage size when layoutType changes
  useEffect(() => {
    if (layoutType && (!initialSeatingMap || !initialSeatingMap.stage)) {
      const defaultSize = getDefaultStageSize();
      const currentStage = seatingMap.stage || {};
      
      // Update stage size but keep position if possible
      setSeatingMap(prevMap => ({
        ...prevMap,
        stage: {
          x: currentStage.x || 500,
          y: currentStage.y || 100,
          width: defaultSize.width,
          height: defaultSize.height
        }
      }));
    }
  }, [layoutType]);

  // Thêm edit mode cho venue objects
  const [editMode, setEditMode] = useState('select'); // 'select', 'add-section', 'add-entrance', 'add-exit', etc.
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [renderKey, setRenderKey] = useState(0); // Force re-render counter
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, element: null });
  
  // History for undo/redo
  const [history, setHistory] = useState([seatingMap]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);

  // Thêm biến state cho selectedRowIndex
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // Định nghĩa các loại venue object có thể thêm
  const venueObjectTypes = {
    'entrance': { name: 'Lối vào', icon: <FaDoorOpen />, color: '#4CAF50', width: 30, height: 30 },
    'exit': { name: 'Lối ra', icon: <FaDoorClosed />, color: '#F44336', width: 30, height: 30 },
    'restroom': { name: 'Nhà vệ sinh', icon: <FaToilet />, color: '#2196F3', width: 30, height: 30 },
    'food': { name: 'Quầy thức ăn', icon: <FaHamburger />, color: '#FF9800', width: 40, height: 30 },
    'drinks': { name: 'Quầy nước', icon: <FaGlassMartiniAlt />, color: '#9C27B0', width: 40, height: 30 },
    'accessible': { name: 'Lối đi cho người khuyết tật', icon: <FaWheelchair />, color: '#03A9F4', width: 30, height: 30 },
    'info': { name: 'Quầy thông tin', icon: <FaInfoCircle />, color: '#607D8B', width: 30, height: 30 },
  };

  // Update parent when seating map changes
  useEffect(() => {
    console.log('🔄 Seating map updated:', seatingMap);
    onSeatingMapChange?.(seatingMap);
  }, [seatingMap, onSeatingMapChange]);

  // Force re-render when ticketTypes change to update colors
  useEffect(() => {
    console.log('🎨 TicketTypes updated, forcing color refresh:', ticketTypes);
    // Force a complete state update to trigger re-render
    setSeatingMap(prevMap => ({ 
      ...prevMap, 
      sections: [...prevMap.sections], // Create new arrays to force re-render
      stage: { ...prevMap.stage }
    }));
    // Also increment render key to force complete re-render
    setRenderKey(prev => prev + 1);
  }, [ticketTypes]);

  // Save state to history
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...seatingMap });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setSeatingMap(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedElement(null);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setSeatingMap(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedElement(null);
    }
  };

  // Calculate dynamic viewBox based on content
  const calculateViewBox = () => {
    // Default view if no content
    if (!seatingMap.sections || seatingMap.sections.length === 0) {
      const stageWidth = seatingMap.stage?.width || 200;
      const stageHeight = seatingMap.stage?.height || 60;
      
      // Adjust default viewport based on layout type
      let defaultWidth = CANVAS_WIDTH;
      let defaultHeight = CANVAS_HEIGHT;
      
      // For football and basketball, zoom out more
      if (layoutType === 'footballStadium' || layoutType === 'basketballArena') {
        defaultWidth = CANVAS_WIDTH * 1.5;
        defaultHeight = CANVAS_HEIGHT * 1.5;
      }
      
      return `0 0 ${defaultWidth} ${defaultHeight}`;
    }

    // Calculate bounding box including all sections and stage
    let minX = CANVAS_WIDTH;
    let minY = CANVAS_HEIGHT;
    let maxX = 0;
    let maxY = 0;
    
    // Include stage in bounding box
    if (seatingMap.stage) {
      minX = Math.min(minX, seatingMap.stage.x);
      minY = Math.min(minY, seatingMap.stage.y);
      maxX = Math.max(maxX, seatingMap.stage.x + seatingMap.stage.width);
      maxY = Math.max(maxY, seatingMap.stage.y + seatingMap.stage.height);
    }
    
    // Include all sections
    seatingMap.sections.forEach(section => {
      minX = Math.min(minX, section.x);
      minY = Math.min(minY, section.y);
      maxX = Math.max(maxX, section.x + (section.width || 100));
      maxY = Math.max(maxY, section.y + (section.height || 80));
    });
    
    // Add padding
    const padding = layoutType === 'footballStadium' || layoutType === 'basketballArena' ? 150 : 100;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = maxX + padding;
    maxY = maxY + padding;
    
    // Calculate dimensions
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Ensure minimum size and reasonable aspect ratio
    const minWidth = layoutType === 'footballStadium' ? 1200 : 
                     layoutType === 'basketballArena' ? 1000 : 800;
    const minHeight = layoutType === 'footballStadium' ? 800 : 
                      layoutType === 'basketballArena' ? 700 : 600;
    
    const finalWidth = Math.max(width, minWidth);
    const finalHeight = Math.max(height, minHeight);
    
    // Center the viewport if content is smaller than minimum
    const adjustedMinX = width < minWidth ? minX - (minWidth - width) / 2 : minX;
    const adjustedMinY = height < minHeight ? minY - (minHeight - height) / 2 : minY;
    
    return `${adjustedMinX} ${adjustedMinY} ${finalWidth} ${finalHeight}`;
  };

  // Get SVG coordinates from mouse event with dynamic viewBox
  const getSVGCoordinates = (event) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    
    // Calculate relative position within the SVG element
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    
    // Convert to SVG coordinate system
    const x = viewBox.x + relativeX * viewBox.width;
    const y = viewBox.y + relativeY * viewBox.height;
    
    return { x, y };
  };

  // Handle mouse move for dragging - định nghĩa trước khi sử dụng
  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !draggedElement) return;

    event.preventDefault();
    
    const svgCoords = getSVGCoordinates(event);
    const newX = Math.max(0, Math.round(svgCoords.x - dragOffset.x));
    const newY = Math.max(0, Math.round(svgCoords.y - dragOffset.y));

    console.log('🔄 Dragging to:', { newX, newY });

    const newSeatingMap = { ...seatingMap };

    if (draggedElement.type === 'stage') {
      newSeatingMap.stage = {
        ...newSeatingMap.stage,
        x: newX,
        y: newY
      };
      console.log('🎭 Updated stage position:', newSeatingMap.stage);
    } else if (draggedElement.type === 'section') {
      const sectionIndex = newSeatingMap.sections.findIndex(s => s.id === draggedElement.id);
      if (sectionIndex !== -1) {
        newSeatingMap.sections[sectionIndex] = {
          ...newSeatingMap.sections[sectionIndex],
          x: newX,
          y: newY,
          // Cập nhật vị trí label theo vị trí section
          labelX: newX + (newSeatingMap.sections[sectionIndex].width || 150) / 2,
          labelY: newY - 15
        };
        console.log('🏛️ Updated section position:', newSeatingMap.sections[sectionIndex]);
      }
    } else if (draggedElement.type === 'venueObject') {
      // Handling drag for venue objects
      const objectIndex = newSeatingMap.venueObjects.findIndex(o => o.id === draggedElement.id);
      if (objectIndex !== -1) {
        newSeatingMap.venueObjects[objectIndex] = {
          ...newSeatingMap.venueObjects[objectIndex],
          x: newX,
          y: newY
        };
        console.log('🚪 Updated venue object position:', newSeatingMap.venueObjects[objectIndex]);
      }
    }

    setSeatingMap(newSeatingMap);
    
    // Update selected element to reflect new position
    setSelectedElement({ 
      ...draggedElement, 
      x: newX, 
      y: newY,
      // Cập nhật labelX và labelY nếu là section
      ...(draggedElement.type === 'section' ? {
        labelX: newX + (draggedElement.width || 150) / 2,
        labelY: newY - 15
      } : {})
    });
  }, [isDragging, draggedElement, dragOffset, seatingMap]);

  // Handle mouse up for drag end
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      console.log('✋ Drag ended, saving to history');
      saveToHistory();
    }
    setIsDragging(false);
    setDraggedElement(null);
  }, [isDragging, saveToHistory]);

  // Handle mouse down for drag start
  const handleMouseDown = (event, element, elementType) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (editMode !== 'select') return;

    console.log('🖱️ Mouse down on:', elementType, element.name || 'stage');
    
    const svgCoords = getSVGCoordinates(event);
    console.log('📍 SVG coords:', svgCoords);
    
    setDraggedElement({ ...element, type: elementType });
    setSelectedElement({ ...element, type: elementType });
    setIsDragging(true);
    
    const elementX = element.x || 0;
    const elementY = element.y || 0;
    
    console.log('📐 Element position:', { x: elementX, y: elementY });
    
    setDragOffset({
      x: svgCoords.x - elementX,
      y: svgCoords.y - elementY
    });
    
    console.log('↔️ Drag offset:', { x: svgCoords.x - elementX, y: svgCoords.y - elementY });
  };

  // Thêm event listener cho document để xử lý drag & drop
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Thêm section mới vào seating map
  const addSection = (x, y) => {
    const sectionId = `section-${Date.now()}`;
    const defaultWidth = 180;
    const defaultHeight = 150;
    
    // Tạo tên section mới dựa trên số lượng hiện có
    const existingSections = seatingMap.sections || [];
    const sectionCount = existingSections.length;
    
    // Tạo tên section theo quy tắc: Khu A, Khu B, Khu C...
    let sectionName = '';
    if (sectionCount < 26) {
      // A-Z cho 26 section đầu tiên
      sectionName = String.fromCharCode(65 + sectionCount);
    } else {
      // AA, AB, AC... cho các section tiếp theo
      const firstChar = String.fromCharCode(65 + Math.floor((sectionCount - 26) / 26));
      const secondChar = String.fromCharCode(65 + ((sectionCount - 26) % 26));
      sectionName = firstChar + secondChar;
    }
    
    // Lấy loại vé mặc định (loại đầu tiên nếu có)
    const defaultTicketType = ticketTypes.length > 0 ? ticketTypes[0].name : 'Standard';
    
    const newSection = {
      id: sectionId,
      name: `Khu ${sectionName}`,
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      ticketType: defaultTicketType,
      capacity: 0,
      rows: [],
      labelX: x + defaultWidth / 2,
      labelY: y - 15
    };
    
    const updatedMap = {
      ...seatingMap,
      sections: [...(seatingMap.sections || []), newSection]
    };
    
    setSeatingMap(updatedMap);
    setSelectedElement(newSection);
    saveToHistory();
  };

  // Xử lý khi click vào canvas
  const handleCanvasClick = (event) => {
    if (editMode === 'add-section') {
      const coords = getSVGCoordinates(event);
      addSection(coords.x, coords.y);
      setEditMode('select'); // Chuyển về chế độ select sau khi thêm section
    } else if (editMode.startsWith('add-') && venueObjectTypes[editMode.substring(4)]) {
      // Handle adding venue objects like entrance, exit, etc.
      const coords = getSVGCoordinates(event);
      addVenueObject(editMode.substring(4), coords.x, coords.y);
      setEditMode('select'); // Switch back to select mode after adding
    } else {
      // Bỏ chọn khi click vào khoảng trống
      setSelectedElement(null);
      setSelectedRowIndex(null);
      setContextMenu({ visible: false, x: 0, y: 0, type: null, element: null });
    }
  };

  // Xóa phần tử đang được chọn
  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'section') {
      const updatedSections = seatingMap.sections.filter(section => section.id !== selectedElement.id);
      
      setSeatingMap({
        ...seatingMap,
        sections: updatedSections
      });
      
      setSelectedElement(null);
      saveToHistory();
    } else if (selectedElement.type === 'venueObject') {
      const updatedVenueObjects = seatingMap.venueObjects.filter(obj => obj.id !== selectedElement.id);
      
      setSeatingMap({
        ...seatingMap,
        venueObjects: updatedVenueObjects
      });
      
      setSelectedElement(null);
      saveToHistory();
    }
  };
  
  // Thêm hàng ghế mới vào section
  const addRowToSection = (sectionId) => {
    const section = seatingMap.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Tạo hàng mới
    const rowCount = section.rows ? section.rows.length : 0;
    const rowName = getRowLabel(rowCount);
    
    const newRow = {
      name: rowName,
      seats: []
    };
    
    // Cập nhật section
    const updatedSection = {
      ...section,
      rows: [...(section.rows || []), newRow]
    };
    
    // Cập nhật seating map
    const updatedSections = seatingMap.sections.map(s => 
      s.id === sectionId ? updatedSection : s
    );
    
    setSeatingMap({
      ...seatingMap,
      sections: updatedSections
    });
    
    // Cập nhật selected element
    setSelectedElement(updatedSection);
    setSelectedRowIndex(rowCount);
    saveToHistory();
  };
  
  // Thêm ghế vào hàng
  const addSeatsToRow = (sectionId, rowIndex, seatCount) => {
    const section = seatingMap.sections.find(s => s.id === sectionId);
    if (!section || !section.rows || rowIndex >= section.rows.length) return;
    
    const row = section.rows[rowIndex];
    const existingSeatCount = row.seats ? row.seats.length : 0;
    
    // Tính toán vị trí cho ghế mới
    const sectionWidth = section.width || 180;
    const seatSpacing = 15;
    const startX = section.x + 20;
    const rowY = section.y + 30 + rowIndex * 20;
    
    // Tạo ghế mới
    const newSeats = [];
    for (let i = 0; i < seatCount; i++) {
      const seatNumber = existingSeatCount + i + 1;
      newSeats.push({
        number: seatNumber,
        x: startX + (existingSeatCount + i) * seatSpacing,
        y: rowY,
        status: 'available'
      });
    }
    
    // Cập nhật hàng
    const updatedRow = {
      ...row,
      seats: [...(row.seats || []), ...newSeats]
    };
    
    // Cập nhật section
    const updatedRows = [...section.rows];
    updatedRows[rowIndex] = updatedRow;
    
    const updatedSection = {
      ...section,
      rows: updatedRows,
      capacity: (section.capacity || 0) + seatCount
    };
    
    // Cập nhật seating map
    const updatedSections = seatingMap.sections.map(s => 
      s.id === sectionId ? updatedSection : s
    );
    
    setSeatingMap({
      ...seatingMap,
      sections: updatedSections
    });
    
    saveToHistory();
  };
  
  // Tạo layout ghế tự động cho section
  const generateAutoSeatingLayout = (sectionId, options) => {
    const { rows, seatsPerRow, rowSpacing, seatSpacing, pattern } = options;
    const section = seatingMap.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Xóa rows hiện tại nếu có
    const updatedSection = { ...section, rows: [], capacity: 0 };
    
    // Tính toán vị trí bắt đầu
    const startX = section.x + 20;
    const startY = section.y + 30;
    
    // Tạo layout dựa trên pattern
    let newRows = [];
    
    switch (pattern) {
      case 'grid':
        // Layout lưới đơn giản
        newRows = createGridSeating(updatedSection, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing);
        break;
      case 'chevrons':
        // Layout dạng yên ngựa
        newRows = renderChevronsSeating(updatedSection, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing, 10);
        break;
      case 'curved':
        // Layout dạng cong
        newRows = createCurvedSeating(updatedSection, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing);
        break;
      default:
        // Mặc định là grid
        newRows = createGridSeating(updatedSection, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing);
    }
    
    // Cập nhật section
    updatedSection.rows = newRows;
    updatedSection.capacity = newRows.reduce((total, row) => total + row.seats.length, 0);
    
    // Cập nhật seating map
    const updatedSections = seatingMap.sections.map(s => 
      s.id === sectionId ? updatedSection : s
    );
    
    setSeatingMap({
      ...seatingMap,
      sections: updatedSections
    });
    
    saveToHistory();
  };
  
  // Tạo layout lưới
  const createGridSeating = (section, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing) => {
    const newRows = [];
    
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const rowY = startY + rowIndex * rowSpacing;
      const seats = [];
      
      for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex++) {
        seats.push({
          number: seatIndex + 1,
          x: startX + seatIndex * seatSpacing,
          y: rowY,
          status: 'available'
        });
      }
      
      newRows.push({
        name: getRowLabel(rowIndex),
        seats
      });
    }
    
    return newRows;
  };
  
  // Tạo layout cong
  const createCurvedSeating = (section, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing) => {
    const newRows = [];
    const centerX = startX + (seatsPerRow * seatSpacing) / 2;
    const radius = 150;
    
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const seats = [];
      const rowRadius = radius + rowIndex * rowSpacing;
      
      for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex++) {
        // Tính góc cho mỗi ghế
        const angle = -Math.PI / 3 + (Math.PI * 2/3) * (seatIndex / (seatsPerRow - 1));
        
        // Tính tọa độ dựa trên góc và bán kính
        const x = centerX + rowRadius * Math.cos(angle);
        const y = startY + rowRadius * Math.sin(angle);
        
        seats.push({
          number: seatIndex + 1,
          x,
          y,
          status: 'available'
        });
      }
      
      newRows.push({
        name: getRowLabel(rowIndex),
        seats
      });
    }
    
    return newRows;
  };

  // Thêm hàm addVenueObject để thêm các đối tượng vào venue
  const addVenueObject = (objectType, x, y) => {
    if (!venueObjectTypes[objectType]) return;
    
    const objectId = `${objectType}-${Date.now()}`;
    const typeInfo = venueObjectTypes[objectType];
    
    const newObject = {
      id: objectId,
      type: objectType,
      name: typeInfo.name,
      x,
      y,
      width: typeInfo.width,
      height: typeInfo.height,
      color: typeInfo.color,
      rotation: 0,
    };
    
    const updatedMap = {
      ...seatingMap,
      venueObjects: [...(seatingMap.venueObjects || []), newObject]
    };
    
    setSeatingMap(updatedMap);
    setSelectedElement({ ...newObject, type: 'venueObject' });
    saveToHistory();
  };

  // Thêm hàm renderVenueObject để hiển thị các đối tượng venue
  const renderVenueObject = (object, isSelected) => {
    const typeInfo = venueObjectTypes[object.type];
    
    // Không render nếu không tìm thấy thông tin loại object
    if (!typeInfo) return null;
    
    return (
      <g
        key={object.id}
        className={`venue-object ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement({ ...object, type: 'venueObject' });
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, object, 'venueObject');
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleContextMenu(e, 'venueObject', object);
        }}
        transform={`rotate(${object.rotation || 0}, ${object.x + (object.width/2)}, ${object.y + (object.height/2)})`}
      >
        {/* Object background */}
        <rect
          x={object.x}
          y={object.y}
          width={object.width}
          height={object.height}
          fill={object.color}
          fillOpacity="0.7"
          stroke={object.color}
          strokeWidth={isSelected ? 3 : 1.5}
          rx="3"
          cursor="move"
        />
        
        {/* Object icon/text */}
        <text
          x={object.x + object.width / 2}
          y={object.y + object.height / 2 + 5}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          className="venue-object-text"
          pointerEvents="none"
        >
          {object.type.charAt(0).toUpperCase()}
        </text>

        {/* Object label */}
        <text
          x={object.x + object.width / 2}
          y={object.y - 8}
          textAnchor="middle"
          fill={object.color}
          fontSize="12"
          fontWeight="bold"
          className="venue-object-label"
          pointerEvents="none"
        >
          {object.name}
        </text>
      </g>
    );
  };

  // Mở rộng hàm contextMenu để hỗ trợ venue objects
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    
    return (
      <div 
        className="context-menu"
        style={{ 
          position: 'absolute',
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`
        }}
      >
        {contextMenu.type === 'section' && (
          <div className="menu-items">
            <div onClick={() => handleMenuItemClick('add-row')}>➕ Thêm hàng</div>
            <div onClick={() => handleMenuItemClick('auto-layout')}>🪑 Tạo chỗ ngồi tự động</div>
            <div onClick={() => handleMenuItemClick('delete-section')}>🗑️ Xóa khu vực</div>
          </div>
        )}
        
        {contextMenu.type === 'venueObject' && (
          <div className="menu-items">
            <div onClick={() => handleMenuItemClick('rotate-object')}>🔄 Xoay</div>
            <div onClick={() => handleMenuItemClick('rename-object')}>✏️ Đổi tên</div>
            <div onClick={() => handleMenuItemClick('delete-object')}>🗑️ Xóa</div>
          </div>
        )}
      </div>
    );
  };
      
  // Mở rộng hàm handleMenuItemClick để hỗ trợ venue objects
  const handleMenuItemClick = (action) => {
    const element = contextMenu.element;
    
    setContextMenu({ visible: false, x: 0, y: 0, type: null, element: null });
    
    if (action === 'add-row' && contextMenu.type === 'section') {
      addRowToSection(element.id);
    } else if (action === 'auto-layout' && contextMenu.type === 'section') {
      // Open auto layout dialog
      // For now, just add a simple layout
      generateAutoSeatingLayout(element.id, {
        rows: 5,
        seatsPerRow: 10,
        rowSpacing: 20,
        seatSpacing: 15,
        pattern: 'grid'
      });
    } else if (action === 'delete-section' && contextMenu.type === 'section') {
      deleteSection(element.id);
    } else if (action === 'rotate-object' && contextMenu.type === 'venueObject') {
      // Xoay đối tượng thêm 90 độ
      rotateVenueObject(element.id);
    } else if (action === 'rename-object' && contextMenu.type === 'venueObject') {
      const newName = prompt('Nhập tên mới cho đối tượng:', element.name);
      if (newName) {
        renameVenueObject(element.id, newName);
      }
    } else if (action === 'delete-object' && contextMenu.type === 'venueObject') {
      deleteVenueObject(element.id);
    }
  };

  // Thêm các hàm xử lý cho venue objects
  const rotateVenueObject = (objectId) => {
    const updatedObjects = seatingMap.venueObjects.map(obj => {
      if (obj.id === objectId) {
        const currentRotation = obj.rotation || 0;
        return { ...obj, rotation: (currentRotation + 90) % 360 };
      }
      return obj;
    });
    
    setSeatingMap({
      ...seatingMap,
      venueObjects: updatedObjects
    });

    // Cập nhật selected element nếu đang được chọn
    if (selectedElement?.id === objectId && selectedElement.type === 'venueObject') {
      const updatedObj = updatedObjects.find(obj => obj.id === objectId);
      setSelectedElement({ ...updatedObj, type: 'venueObject' });
    }
    
    saveToHistory();
  };

  const renameVenueObject = (objectId, newName) => {
    const updatedObjects = seatingMap.venueObjects.map(obj => {
      if (obj.id === objectId) {
        return { ...obj, name: newName };
      }
      return obj;
    });
    
    setSeatingMap({
      ...seatingMap,
      venueObjects: updatedObjects
    });

    // Cập nhật selected element nếu đang được chọn
    if (selectedElement?.id === objectId && selectedElement.type === 'venueObject') {
      const updatedObj = updatedObjects.find(obj => obj.id === objectId);
      setSelectedElement({ ...updatedObj, type: 'venueObject' });
    }
    
    saveToHistory();
  };

  const deleteVenueObject = (objectId) => {
    const updatedObjects = seatingMap.venueObjects.filter(obj => obj.id !== objectId);
    
    setSeatingMap({
      ...seatingMap,
      venueObjects: updatedObjects
    });
    
    // Xóa selected element nếu đang được chọn
    if (selectedElement?.id === objectId && selectedElement.type === 'venueObject') {
      setSelectedElement(null);
    }
    
    saveToHistory();
  };

  const deleteSection = (sectionId) => {
    const updatedSections = seatingMap.sections.filter(s => s.id !== sectionId);
    
    setSeatingMap({
      ...seatingMap,
      sections: updatedSections
    });
    
    // Xóa selected element nếu đang được chọn
    if (selectedElement?.id === sectionId && selectedElement.type === 'section') {
      setSelectedElement(null);
    }
    
    saveToHistory();
  };

  // Lấy màu cho từng loại vé/khu vực
  const getTicketTypeColor = (type) => {
    // Nếu type là null/undefined thì dùng default
    const ticketType = (type || '').toLowerCase();
    
    // Mapping màu sắc cho từng loại vé
    if (ticketType.includes('vip')) return '#8B5CF6'; // Tím cho VIP
    if (ticketType.includes('premium')) return '#F59E0B'; // Cam vàng cho Premium
    if (ticketType.includes('gold') || ticketType.includes('golden')) return '#EAB308'; // Vàng cho Gold/Golden
    if (ticketType.includes('silver')) return '#94A3B8'; // Bạc cho Silver
    if (ticketType.includes('standard')) return '#22C55E'; // Xanh lá cho Standard
    if (ticketType.includes('economy')) return '#38BDF8'; // Xanh da trời cho Economy
    
    // Fallback dựa vào tên ticketType
    return getColorFromString(ticketType);
  };

  // Hàm lấy màu cho section dựa vào tên hoặc loại vé
  const getSectionColor = (sectionName) => {
    const name = sectionName?.toLowerCase() || '';
    
    // Màu sắc cho các khu vực theo tên
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
    
    // Tạo màu dựa trên hash của tên
    return getColorFromString(name);
  };

  // Hàm tạo màu từ chuỗi bất kỳ
  const getColorFromString = (str) => {
    const colors = [
      '#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6',
      '#F59E0B', '#06B6D4', '#84CC16', '#F472B6', '#A78BFA'
    ];
    
    if (!str) return colors[0];
    
    // Tạo hash từ chuỗi
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Update section properties with force re-render
  const updateSectionProperties = (sectionId, properties) => {
    const updatedSections = seatingMap.sections.map(section => {
      if (section.id === sectionId) {
        const updatedSection = { ...section, ...properties };
        
        // Nếu thay đổi kích thước, cập nhật vị trí nhãn
        if (properties.width) {
          updatedSection.labelX = section.x + properties.width / 2;
        }
        
        return updatedSection;
      }
      return section;
    });
    
    setSeatingMap({
      ...seatingMap,
      sections: updatedSections
    });
    
    // Cập nhật selected element nếu đang được chọn
    if (selectedElement && selectedElement.id === sectionId) {
      setSelectedElement({ ...selectedElement, ...properties });
    }
    
    saveToHistory();
  };

  // Cập nhật hàm renderSection để thêm hiển thị nhãn tại vị trí được chỉ định
  const renderSection = (section, isSelected) => {
    // Tính toán màu sắc dựa trên loại khu vực
    const sectionColor = getSectionColor(section.name);
    
    return (
      <g
        key={section.id}
        className={`section ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement({ ...section, type: 'section' });
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, section, 'section');
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleContextMenu(e, 'section', section);
        }}
      >
        {/* Section background */}
        <rect
          x={section.x}
          y={section.y}
          width={section.width}
          height={section.height}
          fill={sectionColor}
          fillOpacity="0.3"
          stroke={sectionColor}
          strokeWidth={isSelected ? 3 : 1.5}
          rx="5"
          cursor="move"
        />
        
        {/* Section label - sử dụng vị trí nhãn nếu có, nếu không thì đặt ở trên khu vực */}
        <text
          x={section.labelX || section.x + section.width / 2}
          y={section.labelY || section.y - 15}
          textAnchor="middle"
          fill={sectionColor}
          fontSize="14"
          fontWeight="bold"
          className="section-label"
          pointerEvents="none"
        >
          {section.name}
        </text>

        {/* Render rows of this section */}
        {section.rows && section.rows.map((row, rowIndex) => renderRow(section, row, rowIndex, isSelected && selectedRowIndex === rowIndex))}
      </g>
    );
  };

  // Cải thiện hàm yên ngựa để hiển thị rõ hơn
  const renderChevronsSeating = (section, startX, startY, rows, seatsPerRow, rowSpacing, seatSpacing, angle) => {
    const totalWidth = seatsPerRow * seatSpacing;
    const radiansAngle = (angle * Math.PI) / 180;
    const midPoint = seatsPerRow / 2;
    const rowHeight = rowSpacing;
    
    // Tạo ra layout ghế dạng vòng cung hoặc yên ngựa
    const updatedRows = [...Array(rows)].map((_, rowIndex) => {
      // Mỗi hàng sẽ có số lượng ghế khác nhau để tạo hiệu ứng yên ngựa
      // Hàng đầu tiên và hàng cuối có ít ghế nhất
      const isMiddleRow = rowIndex === Math.floor(rows / 2);
      const distanceFromMiddle = Math.abs(rowIndex - Math.floor(rows / 2));
      const rowPosition = rowIndex * rowHeight;
      
      // Số ghế trong hàng này (hàng giữa có nhiều ghế nhất)
      const adjustedSeatsInRow = Math.max(3, seatsPerRow - Math.floor(distanceFromMiddle * 1.5));
      
      // Các ghế trong hàng
      const seats = [...Array(adjustedSeatsInRow)].map((_, seatIndex) => {
        // Tính toán vị trí theo dạng vòng cung
        const relativePos = seatIndex - (adjustedSeatsInRow - 1) / 2;
        const radialDistance = rowIndex * rowSpacing * 0.8;
        const circumference = 2 * Math.PI * radialDistance;
        const arcLength = totalWidth * 0.8;
        const arcAngle = arcLength / circumference * 2 * Math.PI;
        const seatAngle = relativePos * arcAngle / (adjustedSeatsInRow - 1);
        
        // Tính toán x, y cho ghế trong hàng theo vòng cung
        const x = startX + relativePos * seatSpacing + Math.sin(seatAngle) * (rowIndex * 3);
        const y = startY + rowPosition + Math.abs(relativePos) * Math.sin(radiansAngle) * 2;
        
        return {
          x,
          y,
          number: seatIndex + 1,
          status: 'available'
        };
      });
      
      return {
        name: getRowLabel(rowIndex),
        seats
      };
    });
    
    return updatedRows;
  };

  // Thêm hàm handleContextMenu
  const handleContextMenu = (e, type, element) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      element
    });
  };

  // Thêm hàm getRowLabel
  const getRowLabel = (index) => {
    // Chuyển đổi số thành chữ cái (0 -> A, 1 -> B, v.v.)
    if (index < 26) {
      return String.fromCharCode(65 + index);
    } else {
      // Nếu quá 26 thì dùng AA, AB, v.v.
      const firstChar = String.fromCharCode(65 + Math.floor(index / 26) - 1);
      const secondChar = String.fromCharCode(65 + (index % 26));
      return firstChar + secondChar;
    }
  };

  // Thêm hàm renderRow
  const renderRow = (section, row, rowIndex, isSelected) => {
    return (
      <g 
        key={`row-${section.id}-${rowIndex}`} 
        className={`row ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement({ ...section, type: 'section' });
          setSelectedRowIndex(rowIndex);
        }}
      >
        {/* Row label */}
        <text
          x={section.x - 10}
          y={row.seats && row.seats[0] ? row.seats[0].y + 4 : section.y + rowIndex * 20 + 15}
          textAnchor="end"
          fill="#555"
          fontSize="10"
          fontWeight="500"
        >
          {row.name}
        </text>
        
        {/* Render seats */}
        {row.seats && row.seats.map((seat, seatIndex) => (
          <rect
            key={`seat-${section.id}-${rowIndex}-${seatIndex}`}
            x={seat.x - 5}
            y={seat.y - 5}
            width="10"
            height="10"
            rx="2"
            fill={seat.status === 'available' ? '#22c55e' : 
                  seat.status === 'sold' ? '#f87171' : 
                  seat.status === 'selected' ? '#60a5fa' : '#ccc'}
            stroke="#666"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  };

  return (
    <div className="interactive-seating-designer">
      {/* Toolbar */}
      <div className="designer-toolbar">
        <div className="toolbar-section">
          <h4>🎭 Thiết kế sơ đồ chỗ ngồi</h4>
          <div className="toolbar-buttons">
            <button 
              className={`tool-btn ${editMode === 'select' ? 'active' : ''}`}
              onClick={() => setEditMode('select')}
              title="Chọn và di chuyển"
            >
              ✋ Chọn
            </button>
            <button 
              className={`tool-btn ${editMode === 'add-section' ? 'active' : ''}`}
              onClick={() => setEditMode('add-section')}
              title="Thêm khu vực"
            >
              <FaPlus /> Khu
            </button>

            {/* Venue object tools */}
            <button 
              className={`tool-btn ${editMode === 'add-entrance' ? 'active' : ''}`}
              onClick={() => setEditMode('add-entrance')}
              title="Thêm lối vào"
            >
              <FaDoorOpen /> Lối vào
            </button>
            <button 
              className={`tool-btn ${editMode === 'add-exit' ? 'active' : ''}`}
              onClick={() => setEditMode('add-exit')}
              title="Thêm lối ra"
            >
              <FaDoorClosed /> Lối ra
            </button>
            <button 
              className={`tool-btn ${editMode === 'add-restroom' ? 'active' : ''}`}
              onClick={() => setEditMode('add-restroom')}
              title="Thêm nhà vệ sinh"
            >
              <FaToilet /> WC
            </button>
            <button 
              className={`tool-btn ${editMode === 'add-food' ? 'active' : ''}`}
              onClick={() => setEditMode('add-food')}
              title="Thêm quầy thức ăn"
            >
              <FaHamburger /> Thức ăn
            </button>
            <button 
              className={`tool-btn ${editMode === 'add-drinks' ? 'active' : ''}`}
              onClick={() => setEditMode('add-drinks')}
              title="Thêm quầy nước"
            >
              <FaGlassMartiniAlt /> Đồ uống
            </button>
          </div>
        </div>

        <div className="toolbar-section">
          <div className="toolbar-buttons">
            <button 
              className="tool-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Hoàn tác"
            >
              <FaUndo />
            </button>
            <button 
              className="tool-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Làm lại"
            >
              <FaRedo />
            </button>
            <button 
              className="tool-btn danger"
              onClick={deleteSelectedElement}
              disabled={!selectedElement}
              title="Xóa phần tử đã chọn"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>

      {/* Main designer area */}
      <div className="designer-main">
        {/* Canvas */}
        <div className="designer-canvas">
          <svg
            ref={svgRef}
            viewBox={calculateViewBox()}
            className={`seating-canvas ${editMode === 'select' ? 'select-mode' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Stage */}
            {seatingMap.stage && (
              <g 
                className={`stage-element ${selectedElement?.type === 'stage' ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  console.log('🎭 Stage mousedown event triggered');
                  handleMouseDown(e, seatingMap.stage, 'stage');
                }}
                style={{ cursor: editMode === 'select' ? 'grab' : 'default' }}
              >
                <rect
                  x={seatingMap.stage.x}
                  y={seatingMap.stage.y}
                  width={seatingMap.stage.width}
                  height={seatingMap.stage.height}
                  fill={layoutType === 'footballStadium' ? '#3a6e2a' : 
                        layoutType === 'basketballArena' ? '#b75b1a' : 
                        "#1a1a1a"}
                  stroke="#333"
                  strokeWidth="2"
                  rx="5"
                  className="draggable-element"
                  style={{ pointerEvents: 'all' }}
                />
                <text
                  x={seatingMap.stage.x + seatingMap.stage.width / 2}
                  y={seatingMap.stage.y + seatingMap.stage.height / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {layoutType === 'footballStadium' ? 'SÂN BÓNG ĐÁ' : 
                   layoutType === 'basketballArena' ? 'SÂN BÓNG RỔ' : 
                   'SÂN KHẤU'}
                </text>
                
                {/* Football field markings */}
                {layoutType === 'footballStadium' && (
                  <g pointerEvents="none">
                    {/* Pitch background */}
                    <rect
                      x={seatingMap.stage.x + 10}
                      y={seatingMap.stage.y + 10}
                      width={seatingMap.stage.width - 20}
                      height={seatingMap.stage.height - 20}
                      fill="#4a8c3a"
                      stroke="white"
                      strokeWidth="2"
                    />
                    
                    {/* Center circle */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height / 2}
                      r="15"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    
                    {/* Center line */}
                    <line
                      x1={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y1={seatingMap.stage.y + 10}
                      x2={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y2={seatingMap.stage.y + seatingMap.stage.height - 10}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    
                    {/* Goals */}
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width / 2 - 20}
                      y={seatingMap.stage.y + 8}
                      width="40"
                      height="4"
                      fill="white"
                    />
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width / 2 - 20}
                      y={seatingMap.stage.y + seatingMap.stage.height - 12}
                      width="40"
                      height="4"
                      fill="white"
                    />
                    
                    {/* Penalty areas */}
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width/2 - 40}
                      y={seatingMap.stage.y + 10}
                      width="80"
                      height="25"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width/2 - 40}
                      y={seatingMap.stage.y + seatingMap.stage.height - 35}
                      width="80"
                      height="25"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </g>
                )}
                
                {/* Basketball court markings */}
                {layoutType === 'basketballArena' && (
                  <g pointerEvents="none">
                    {/* Court background */}
                    <rect
                      x={seatingMap.stage.x + 10}
                      y={seatingMap.stage.y + 10}
                      width={seatingMap.stage.width - 20}
                      height={seatingMap.stage.height - 20}
                      fill="#c67941"
                      stroke="white"
                      strokeWidth="2"
                    />
                    
                    {/* Center circle */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height / 2}
                      r="12"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    
                    {/* Center line */}
                    <line
                      x1={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y1={seatingMap.stage.y + 10}
                      x2={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y2={seatingMap.stage.y + seatingMap.stage.height - 10}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    
                    {/* Three-point lines */}
                    <path
                      d={`M${seatingMap.stage.x + 30} ${seatingMap.stage.y + 30} 
                          A 40 40 0 0 1 ${seatingMap.stage.x + seatingMap.stage.width - 30} ${seatingMap.stage.y + 30}`}
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <path
                      d={`M${seatingMap.stage.x + 30} ${seatingMap.stage.y + seatingMap.stage.height - 30} 
                          A 40 40 0 0 0 ${seatingMap.stage.x + seatingMap.stage.width - 30} ${seatingMap.stage.y + seatingMap.stage.height - 30}`}
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    
                    {/* Free throw lines */}
                    <line 
                      x1={seatingMap.stage.x + 50}
                      y1={seatingMap.stage.y + 35}
                      x2={seatingMap.stage.x + seatingMap.stage.width - 50}
                      y2={seatingMap.stage.y + 35}
                      stroke="white"
                      strokeWidth="1"
                    />
                    <line 
                      x1={seatingMap.stage.x + 50}
                      y1={seatingMap.stage.y + seatingMap.stage.height - 35}
                      x2={seatingMap.stage.x + seatingMap.stage.width - 50}
                      y2={seatingMap.stage.y + seatingMap.stage.height - 35}
                      stroke="white"
                      strokeWidth="1"
                    />
                    
                    {/* Baskets */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + 15}
                      r="3"
                      fill="orange"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height - 15}
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
            {seatingMap.sections.map((section, index) => renderSection(section, selectedElement?.name === section.name))}

            {/* Venue Objects */}
            {seatingMap.venueObjects && seatingMap.venueObjects.map((object) => 
              renderVenueObject(object, selectedElement?.id === object.id)
            )}

            {/* Selection indicator */}
            {selectedElement && (
              <rect
                x={selectedElement.x - 5}
                y={selectedElement.y - 5}
                width={(selectedElement.width || 150) + 10}
                height={(selectedElement.height || 100) + 10}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="5,5"
                rx="5"
                pointerEvents="none"
                className="selection-indicator"
              />
            )}
          </svg>

          {/* Instructions */}
          <div className="designer-instructions">
            {editMode === 'select' && <p>✋ Kéo thả để di chuyển các phần tử</p>}
            {editMode === 'add-section' && <p>➕ Click vào canvas để thêm khu vực mới</p>}
            {editMode.startsWith('add-') && editMode !== 'add-section' && (
              <p>➕ Click vào canvas để thêm {venueObjectTypes[editMode.substring(4)]?.name.toLowerCase() || 'đối tượng'}</p>
            )}
          </div>
        </div>

        {/* Properties panel */}
        <div className="designer-properties">
          <h5>🎛️ Thuộc tính</h5>
          
          {selectedElement ? (
            <div className="properties-form">
              {selectedElement.type === 'stage' ? (
                <div>
                  <h6>{layoutType === 'footballStadium' ? 'Sân bóng đá' : 
                       layoutType === 'basketballArena' ? 'Sân bóng rổ' : 
                       'Sân khấu'}</h6>
                  <div className="form-group">
                    <label>Chiều rộng:</label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value);
                        const newSeatingMap = { ...seatingMap };
                        newSeatingMap.stage.width = newWidth;
                        setSeatingMap(newSeatingMap);
                        setSelectedElement({ ...selectedElement, width: newWidth });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chiều cao:</label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value);
                        const newSeatingMap = { ...seatingMap };
                        newSeatingMap.stage.height = newHeight;
                        setSeatingMap(newSeatingMap);
                        setSelectedElement({ ...selectedElement, height: newHeight });
                      }}
                    />
                  </div>
                </div>
              ) : selectedElement.type === 'section' ? (
                <div>
                  <h6>Khu vực: {selectedElement.name}</h6>
                  <div className="form-group">
                    <label>Tên khu vực:</label>
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        updateSectionProperties(selectedElement.id, { name: newName });
                        setSelectedElement({ ...selectedElement, name: newName });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Loại vé:</label>
                    <select
                      value={selectedElement.ticketType}
                      onChange={(e) => {
                        const newTicketType = e.target.value;
                        updateSectionProperties(selectedElement.id, { ticketType: newTicketType });
                        setSelectedElement({ ...selectedElement, ticketType: newTicketType });
                      }}
                    >
                      {ticketTypes.map(type => (
                        <option key={type.name} value={type.name}>
                          {type.name} - {type.price.toLocaleString('vi-VN')}đ
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Số ghế:</label>
                    <input
                      type="number"
                      value={selectedElement.capacity}
                      onChange={(e) => {
                        const newCapacity = parseInt(e.target.value);
                        updateSectionProperties(selectedElement.id, { capacity: newCapacity });
                        setSelectedElement({ ...selectedElement, capacity: newCapacity });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chiều rộng:</label>
                    <input
                      type="number"
                      value={selectedElement.width || 150}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value);
                        updateSectionProperties(selectedElement.id, { width: newWidth });
                        setSelectedElement({ ...selectedElement, width: newWidth });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chiều cao:</label>
                    <input
                      type="number"
                      value={selectedElement.height || 100}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value);
                        updateSectionProperties(selectedElement.id, { height: newHeight });
                        setSelectedElement({ ...selectedElement, height: newHeight });
                      }}
                    />
                  </div>
                </div>
              ) : selectedElement.type === 'venueObject' ? (
                <div>
                  <h6>Đối tượng: {selectedElement.name}</h6>
                  <div className="form-group">
                    <label>Tên:</label>
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        renameVenueObject(selectedElement.id, newName);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Độ rộng:</label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value);
                        const updatedObjects = seatingMap.venueObjects.map(obj => {
                          if (obj.id === selectedElement.id) {
                            return { ...obj, width: newWidth };
                          }
                          return obj;
                        });
                        
                        setSeatingMap({
                          ...seatingMap,
                          venueObjects: updatedObjects
                        });
                        setSelectedElement({ ...selectedElement, width: newWidth });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Độ cao:</label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value);
                        const updatedObjects = seatingMap.venueObjects.map(obj => {
                          if (obj.id === selectedElement.id) {
                            return { ...obj, height: newHeight };
                          }
                          return obj;
                        });
                        
                        setSeatingMap({
                          ...seatingMap,
                          venueObjects: updatedObjects
                        });
                        setSelectedElement({ ...selectedElement, height: newHeight });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Góc xoay:</label>
                    <input
                      type="number"
                      value={selectedElement.rotation || 0}
                      step="15"
                      onChange={(e) => {
                        const newRotation = parseInt(e.target.value);
                        const updatedObjects = seatingMap.venueObjects.map(obj => {
                          if (obj.id === selectedElement.id) {
                            return { ...obj, rotation: newRotation };
                          }
                          return obj;
                        });
                        
                        setSeatingMap({
                          ...seatingMap,
                          venueObjects: updatedObjects
                        });
                        setSelectedElement({ ...selectedElement, rotation: newRotation });
                      }}
                    />
                  </div>
                  <button 
                    className="tool-btn danger"
                    onClick={() => deleteVenueObject(selectedElement.id)}
                  >
                    <FaTrash /> Xóa đối tượng
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p>Chọn một phần tử để xem thuộc tính</p>
          )}

          {/* Summary */}
          <div className="designer-summary">
            <h6>📊 Tổng quan</h6>
            <div className="summary-item">
              <span>Tổng khu vực:</span>
              <span>{seatingMap.sections.length}</span>
            </div>
            <div className="summary-item">
              <span>Tổng ghế:</span>
              <span>{seatingMap.sections.reduce((total, section) => total + (section.capacity || 0), 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {renderContextMenu()}
    </div>
  );
};

export default InteractiveSeatingDesigner;