import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaUndo, FaRedo, FaTrash } from 'react-icons/fa';
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

  // State management
  const [seatingMap, setSeatingMap] = useState(initialSeatingMap || {
    stage: { x: 500, y: 100, width: 200, height: 60 },
    sections: []
  });

  const [editMode, setEditMode] = useState('select'); // 'select' or 'add-section'
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [renderKey, setRenderKey] = useState(0); // Force re-render counter
  
  // History for undo/redo
  const [history, setHistory] = useState([seatingMap]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const svgRef = useRef(null);

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
    if (seatingMap.sections.length === 0 && !seatingMap.stage) {
      return `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Include stage bounds
    if (seatingMap.stage) {
      minX = Math.min(minX, seatingMap.stage.x);
      minY = Math.min(minY, seatingMap.stage.y);
      maxX = Math.max(maxX, seatingMap.stage.x + seatingMap.stage.width);
      maxY = Math.max(maxY, seatingMap.stage.y + seatingMap.stage.height);
    }

    // Include all sections bounds
    seatingMap.sections.forEach(section => {
      if (section.x !== undefined && section.y !== undefined) {
        minX = Math.min(minX, section.x);
        minY = Math.min(minY, section.y);
        maxX = Math.max(maxX, section.x + (section.width || 150));
        maxY = Math.max(maxY, section.y + (section.height || 100));
      }
    });

    // If no valid bounds found, use default
    if (minX === Infinity) {
      return `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`;
    }

    // Add generous padding around content
    const padding = 200;
    minX = minX - padding;
    minY = minY - padding;
    maxX = maxX + padding;
    maxY = maxY + padding;

    // Calculate width and height
    const width = maxX - minX;
    const height = maxY - minY;

    // Ensure minimum size for usability and allow free dragging
    const minWidth = Math.max(CANVAS_WIDTH, width);
    const minHeight = Math.max(CANVAS_HEIGHT, height);
    
    const finalWidth = minWidth;
    const finalHeight = minHeight;

    const viewBox = `${minX} ${minY} ${finalWidth} ${finalHeight}`;
    console.log('📊 Calculated viewBox:', viewBox, {
      bounds: { minX, minY, maxX, maxY },
      dimensions: { width, height, finalWidth, finalHeight }
    });
    return viewBox;
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

  // Handle mouse move for dragging
  const handleMouseMove = (event) => {
    if (!isDragging || !draggedElement) return;

    event.preventDefault();
    
    const svgCoords = getSVGCoordinates(event);
    const newX = svgCoords.x - dragOffset.x;
    const newY = svgCoords.y - dragOffset.y;

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
      const sectionIndex = newSeatingMap.sections.findIndex(s => s.name === draggedElement.name);
      if (sectionIndex !== -1) {
        newSeatingMap.sections[sectionIndex] = {
          ...newSeatingMap.sections[sectionIndex],
          x: newX,
          y: newY
        };
        console.log('🏛️ Updated section position:', newSeatingMap.sections[sectionIndex]);
      }
    }

    setSeatingMap(newSeatingMap);
    
    // Update selected element to reflect new position
    setSelectedElement({ ...draggedElement, x: newX, y: newY });
  };

  // Handle mouse up for drag end
  const handleMouseUp = () => {
    if (isDragging) {
      console.log('✋ Drag ended, saving to history');
      saveToHistory();
    }
    setIsDragging(false);
    setDraggedElement(null);
  };

  // Add new section
  const addSection = (x, y) => {
    const newSection = {
      name: `Khu ${String.fromCharCode(65 + seatingMap.sections.length)}`,
      x: x,
      y: y,
      width: 150,
      height: 100,
      capacity: 50,
      rows: [],
      ticketType: ticketTypes[0]?.name || 'Standard'
    };

    console.log('➕ Adding new section:', newSection);

    const newSeatingMap = {
      ...seatingMap,
      sections: [...seatingMap.sections, newSection]
    };

    setSeatingMap(newSeatingMap);
    saveToHistory();
    setEditMode('select');
  };

  // Handle canvas click for adding elements
  const handleCanvasClick = (event) => {
    if (editMode === 'add-section') {
      const svgCoords = getSVGCoordinates(event);
      console.log('🎯 Canvas click for new section at:', svgCoords);
      addSection(svgCoords.x, svgCoords.y);
    } else {
      // Deselect if clicking on empty space
      setSelectedElement(null);
    }
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    const newSeatingMap = { ...seatingMap };
    
    if (selectedElement.type === 'section') {
      newSeatingMap.sections = newSeatingMap.sections.filter(s => s.name !== selectedElement.name);
      console.log('🗑️ Deleted section:', selectedElement.name);
    }

    setSeatingMap(newSeatingMap);
    setSelectedElement(null);
    saveToHistory();
  };

  // Get color for ticket type - memoized to update when ticketTypes changes
  const getTicketTypeColor = useCallback((ticketTypeName) => {
    // First try to find color from ticketTypes prop
    const ticketType = ticketTypes.find(tt => tt.name === ticketTypeName);
    
    console.log(`🎨 Getting color for "${ticketTypeName}":`, {
      found: !!ticketType,
      color: ticketType?.color,
      allTicketTypes: ticketTypes.map(tt => ({ name: tt.name, color: tt.color }))
    });
    
    if (ticketType && ticketType.color) {
      return ticketType.color;
    }
    
    // Fallback to predefined colors
    const colors = {
      'VIP': '#8B5CF6',
      'Premium': '#F59E0B', 
      'Standard': '#3B82F6',
      'Economy': '#10B981',
      'Golden': '#FFD700',
      'Golden Circle': '#FFD700',
      'Silver': '#C0C0C0',
      'Bronze': '#CD7F32'
    };
    
    const fallbackColor = colors[ticketTypeName] || '#6B7280';
    console.log(`🎨 Using fallback color for "${ticketTypeName}": ${fallbackColor}`);
    return fallbackColor;
  }, [ticketTypes]); // Re-create when ticketTypes changes

  // Update section properties with force re-render
  const updateSectionProperties = (sectionName, properties) => {
    const newSeatingMap = { ...seatingMap };
    const sectionIndex = newSeatingMap.sections.findIndex(s => s.name === sectionName);
    
    if (sectionIndex !== -1) {
      newSeatingMap.sections[sectionIndex] = {
        ...newSeatingMap.sections[sectionIndex],
        ...properties
      };
      
      setSeatingMap(newSeatingMap);
      // Force re-render if ticketType changed (affects colors)
      if (properties.ticketType) {
        setRenderKey(prev => prev + 1);
      }
      console.log('📝 Updated section properties:', properties);
      
      // Force update selected element to reflect changes
      if (selectedElement && selectedElement.name === sectionName) {
        setSelectedElement({
          ...selectedElement,
          ...properties
        });
      }
    }
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
              <FaPlus /> Thêm khu
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
                  fill="#1a1a1a"
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
                    {/* Center circle */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height / 2}
                      r="15"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    {/* Center line */}
                    <line
                      x1={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y1={seatingMap.stage.y + 5}
                      x2={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y2={seatingMap.stage.y + seatingMap.stage.height - 5}
                      stroke="white"
                      strokeWidth="1"
                    />
                    {/* Goals */}
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width / 2 - 10}
                      y={seatingMap.stage.y}
                      width="20"
                      height="3"
                      fill="white"
                    />
                    <rect
                      x={seatingMap.stage.x + seatingMap.stage.width / 2 - 10}
                      y={seatingMap.stage.y + seatingMap.stage.height - 3}
                      width="20"
                      height="3"
                      fill="white"
                    />
                  </g>
                )}
                
                {/* Basketball court markings */}
                {layoutType === 'basketballArena' && (
                  <g pointerEvents="none">
                    {/* Center circle */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height / 2}
                      r="12"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    {/* Center line */}
                    <line
                      x1={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y1={seatingMap.stage.y}
                      x2={seatingMap.stage.x + seatingMap.stage.width / 2}
                      y2={seatingMap.stage.y + seatingMap.stage.height}
                      stroke="white"
                      strokeWidth="1"
                    />
                    {/* Baskets */}
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + 5}
                      r="2"
                      fill="orange"
                    />
                    <circle
                      cx={seatingMap.stage.x + seatingMap.stage.width / 2}
                      cy={seatingMap.stage.y + seatingMap.stage.height - 5}
                      r="2"
                      fill="orange"
                    />
                  </g>
                )}
              </g>
            )}

            {/* Sections */}
            {seatingMap.sections.map((section, index) => (
              <g 
                key={`section-${renderKey}-${index}-${section.name}`}
                className={`section-element ${selectedElement?.name === section.name ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  console.log('🏛️ Section mousedown event triggered:', section.name);
                  handleMouseDown(e, section, 'section');
                }}
                style={{ cursor: editMode === 'select' ? 'grab' : 'default' }}
              >
                <rect
                  x={section.x}
                  y={section.y}
                  width={section.width || 150}
                  height={section.height || 100}
                  fill={getTicketTypeColor(section.ticketType)}
                  fillOpacity="0.3"
                  stroke={getTicketTypeColor(section.ticketType)}
                  strokeWidth="2"
                  rx="8"
                  className="draggable-element"
                  style={{ pointerEvents: 'all' }}
                />
                <text
                  x={section.x + (section.width || 150) / 2}
                  y={section.y + 20}
                  textAnchor="middle"
                  fill={getTicketTypeColor(section.ticketType)}
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {section.name}
                </text>
                <text
                  x={section.x + (section.width || 150) / 2}
                  y={section.y + 40}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                  pointerEvents="none"
                >
                  {section.capacity} ghế
                </text>
                <text
                  x={section.x + (section.width || 150) / 2}
                  y={section.y + 55}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="10"
                  pointerEvents="none"
                >
                  {section.ticketType}
                </text>
              </g>
            ))}

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
              ) : (
                <div>
                  <h6>Khu vực: {selectedElement.name}</h6>
                  <div className="form-group">
                    <label>Tên khu vực:</label>
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        updateSectionProperties(selectedElement.name, { name: newName });
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
                        updateSectionProperties(selectedElement.name, { ticketType: newTicketType });
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
                        updateSectionProperties(selectedElement.name, { capacity: newCapacity });
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
                        updateSectionProperties(selectedElement.name, { width: newWidth });
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
                        updateSectionProperties(selectedElement.name, { height: newHeight });
                        setSelectedElement({ ...selectedElement, height: newHeight });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <p>Chọn một phần tử để chỉnh sửa thuộc tính</p>
            </div>
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
    </div>
  );
};

export default InteractiveSeatingDesigner;