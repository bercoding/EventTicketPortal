import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlus, FaTrash, FaUndo, FaRedo, FaBug
} from 'react-icons/fa';
import './BasicSeatingDesigner.css';
import PropertyEditor from './PropertyEditor';
import ObjectToolbar from './ObjectToolbar';
import venueObjectTypes from './venueObjectTypes';

const BasicSeatingDesigner = ({ seatingMap, setSeatingMap, ticketTypes = [], layoutType = 'theater' }) => {
  console.log("BasicSeatingDesigner rendered");
  
  // Refs
  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const selectedElementRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const localMapRef = useRef(null);
  
  // Local state for managing the designer
  const [localMap, setLocalMap] = useState(() => {
    // Create initial map structure if none provided
    const defaultMap = {
      layoutType: layoutType || 'theater',
      sections: [],
      stage: { id: "stage-main", x: 400, y: 50, width: 300, height: 60 },
      venueObjects: []
    };
    
    // Use provided seatingMap or default - ensure deep clone
    const initialMap = seatingMap ? JSON.parse(JSON.stringify(seatingMap)) : defaultMap;
    console.log("Initial localMap created:", initialMap);
    return initialMap;
  });
  
  // Keep reference to latest localMap
  useEffect(() => {
    localMapRef.current = localMap;
  }, [localMap]);
  
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [debugInfo, setDebugInfo] = useState({
    isDragging: false,
    mousePos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    lastAction: 'none'
  });
  
  // Layout mode
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Sync selected element to ref
  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);
  
  // Sync drag offset to ref
  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);
  
  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(localMap))]);
      setHistoryIndex(0);
    }
  }, []);
  
  // Update local map when seatingMap changes from props
  useEffect(() => {
    if (seatingMap) {
      console.log('Updating localMap from seatingMap prop:', { 
        sections: seatingMap.sections?.length || 0, 
        venueObjects: seatingMap.venueObjects?.length || 0 
      });
      
      // Always create a deep clone to avoid reference issues
      const newMap = {
        layoutType: seatingMap.layoutType || layoutType,
        sections: Array.isArray(seatingMap.sections) ? JSON.parse(JSON.stringify(seatingMap.sections)) : [],
        stage: seatingMap.stage ? JSON.parse(JSON.stringify(seatingMap.stage)) : { id: "stage-main", x: 400, y: 50, width: 300, height: 60 },
        venueObjects: Array.isArray(seatingMap.venueObjects) ? JSON.parse(JSON.stringify(seatingMap.venueObjects)) : []
      };
      
      setLocalMap(newMap);
    }
  }, [seatingMap, layoutType]);
  
  // Helper to safely update parent component
  const updateParent = (updatedMap) => {
    if (typeof setSeatingMap === 'function') {
      console.log('Updating parent with map:', {
        sections: updatedMap.sections.length,
        venueObjects: updatedMap.venueObjects.length
      });
      
      // Always create a deep clone to avoid reference issues
      setSeatingMap(JSON.parse(JSON.stringify(updatedMap)));
    }
  };
  
  // Record history and update parent
  const saveChanges = (newMap) => {
    console.log("Saving changes to map:", {
      sections: newMap.sections.length,
      venueObjects: newMap.venueObjects.length
    });
    
    // Update local state
    setLocalMap(newMap);
    
    // Update parent component
    updateParent(newMap);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newMap)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Add a new section
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Khu ${localMapRef.current.sections.length + 1}`,
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      rows: 10,
      seatsPerRow: 15,
      ticketTypeId: ticketTypes.length > 0 ? ticketTypes[0]._id : undefined
    };
    
    // Create new map with added section using deep clone
    const newMap = JSON.parse(JSON.stringify(localMapRef.current));
    newMap.sections.push(newSection);
    
    // Save changes
    saveChanges(newMap);
    
    // Select new section
    setSelectedElement({
      type: 'section',
      id: newSection.id,
      index: newMap.sections.length - 1
    });

    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'added section'
    }));
  };
  
  // Add a venue object
  const addVenueObject = (objectType) => {
    const newObject = {
      id: `venue-object-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 300,
      y: 300,
      width: objectType.width || 60,
      height: objectType.height || 60,
      type: objectType.id,
      label: objectType.name,
      color: objectType.color,
      isRound: objectType.isRound
    };
    
    // Create new map with added venue object using deep clone
    const newMap = JSON.parse(JSON.stringify(localMapRef.current));
    newMap.venueObjects.push(newObject);
    
    // Save changes
    saveChanges(newMap);
    
    // Select new venue object
    setSelectedElement({
      type: 'venueObject',
      id: newObject.id,
      index: newMap.venueObjects.length - 1
    });
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: `added ${objectType.name} object`
    }));
  };
  
  // Delete selected element
  const deleteSelected = () => {
    if (!selectedElement) return;
    
    let newMap = JSON.parse(JSON.stringify(localMapRef.current));
    
    if (selectedElement.type === 'section') {
      newMap.sections = newMap.sections.filter(s => s.id !== selectedElement.id);
    } else if (selectedElement.type === 'venueObject') {
      newMap.venueObjects = newMap.venueObjects.filter(o => o.id !== selectedElement.id);
    }
    
    // Save changes
    saveChanges(newMap);
    
    // Deselect
    setSelectedElement(null);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: `deleted ${selectedElement.type}`
    }));
  };
  
  // Undo/redo functions
  const undo = () => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const prevMap = history[newIndex];
    
    setLocalMap(JSON.parse(JSON.stringify(prevMap)));
    updateParent(prevMap);
    setHistoryIndex(newIndex);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'undo'
    }));
  };
  
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const nextMap = history[newIndex];
    
    setLocalMap(JSON.parse(JSON.stringify(nextMap)));
    updateParent(nextMap);
    setHistoryIndex(newIndex);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'redo'
    }));
  };
  
  // Debug info
  const showDebugInfo = () => {
    alert(`DEBUG INFO:
Sections: ${localMapRef.current.sections?.length || 0}
Objects: ${localMapRef.current.venueObjects?.length || 0}
Layout: ${localMapRef.current.layoutType || 'unknown'}
Selected: ${selectedElement ? `${selectedElement.type} (${selectedElement.id})` : 'none'}
Dragging: ${isDragging ? 'yes' : 'no'}
Mouse Position: X:${debugInfo.mousePos.x.toFixed(2)}, Y:${debugInfo.mousePos.y.toFixed(2)}
Drag Offset: X:${debugInfo.offset.x.toFixed(2)}, Y:${debugInfo.offset.y.toFixed(2)}
Last Action: ${debugInfo.lastAction}`);
  };
  
  // Handle element selection
  const selectElement = (e, element, type) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Selecting element:', type, element.id);
    setSelectedElement({
      type,
      id: element.id,
      index: type === 'section' 
        ? localMapRef.current.sections.findIndex(s => s.id === element.id)
        : type === 'venueObject'
        ? localMapRef.current.venueObjects.findIndex(o => o.id === element.id)
        : type === 'stage' ? 0 : -1
    });
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: `selected ${type}`
    }));
  };
  
  // Get SVG coordinates from mouse event
  const getSvgCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    return svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
  };
  
  // Handle drag start
  const handleDragStart = (e, element, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Start dragging:', type, element.id);
    
    // Select the element if not already selected
    if (!selectedElement || selectedElement.id !== element.id) {
      selectElement(e, element, type);
    }
    
    // Start dragging
    setIsDragging(true);
    isDraggingRef.current = true;
    
    // Calculate offset
    const point = getSvgCoordinates(e);
    
    const offset = {
      x: point.x - element.x,
      y: point.y - element.y
    };
    
    setDragOffset(offset);
    dragOffsetRef.current = offset;
    
    // Add dragging class to the element
    const selector = `g[data-id="${element.id}"]`;
    const dragEl = document.querySelector(selector);
    if (dragEl) {
      dragEl.classList.add('dragging');
    }
    
    // Set up direct document event listeners for better performance
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    setDebugInfo(prev => ({
      ...prev,
      isDragging: true,
      mousePos: { x: point.x, y: point.y },
      offset: offset,
      lastAction: `started dragging ${type}`
    }));
  };
  
  // Direct document event handlers for better performance
  const handleGlobalMouseMove = (e) => {
    if (!isDraggingRef.current || !selectedElementRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get coordinates in SVG space
    const point = getSvgCoordinates(e);
    
    // Calculate new position
    const newX = Math.max(0, point.x - dragOffsetRef.current.x);
    const newY = Math.max(0, point.y - dragOffsetRef.current.y);
    
    // Create a deep copy of the current map
    const newMap = JSON.parse(JSON.stringify(localMapRef.current));
    
    // Update position based on element type
    if (selectedElementRef.current.type === 'stage') {
      newMap.stage.x = newX;
      newMap.stage.y = newY;
    } else if (selectedElementRef.current.type === 'section') {
      const index = newMap.sections.findIndex(s => s.id === selectedElementRef.current.id);
      if (index !== -1) {
        newMap.sections[index].x = newX;
        newMap.sections[index].y = newY;
      }
    } else if (selectedElementRef.current.type === 'venueObject') {
      const index = newMap.venueObjects.findIndex(o => o.id === selectedElementRef.current.id);
      if (index !== -1) {
        newMap.venueObjects[index].x = newX;
        newMap.venueObjects[index].y = newY;
      }
    }
    
    // Update local state only (don't record history during dragging)
    setLocalMap(newMap);
    
    setDebugInfo(prev => ({
      ...prev,
      mousePos: { x: point.x, y: point.y },
      lastAction: `dragging ${selectedElementRef.current.type} to ${newX.toFixed(0)},${newY.toFixed(0)}`
    }));
  };
  
  // Handle global mouse up
  const handleGlobalMouseUp = (e) => {
    if (!isDraggingRef.current) return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('End dragging, saving position');
    
    // Remove dragging class from all elements
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    
    // End dragging
    setIsDragging(false);
    isDraggingRef.current = false;
    
    // IMPORTANT: Get the current value of localMap from the ref
    // and save it to both history and parent component
    const currentMap = localMapRef.current;
    console.log("Saving final position", currentMap);
    
    // Record this change in history and update parent
    saveChanges(currentMap);
    
    setDebugInfo(prev => ({
      ...prev,
      isDragging: false,
      lastAction: `finished dragging ${selectedElementRef.current?.type || 'element'}`
    }));
  };
  
  // These handlers are kept for component event bindings but delegate to global handlers
  const handleMouseMove = handleGlobalMouseMove;
  const handleMouseUp = handleGlobalMouseUp;
  
  // Handle canvas click (deselect)
  const handleCanvasClick = (e) => {
    if (selectedElement) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedElement(null);
      
      setDebugInfo(prev => ({
        ...prev,
        lastAction: 'deselected element'
      }));
    }
  };

  // Handle property updates
  const handlePropertyUpdate = (updatedMap) => {
    saveChanges(updatedMap);
  };

  // Handle object selection from toolbar
  const handleAddObjectFromToolbar = (objectType) => {
    addVenueObject(objectType);
  };
  
  // Render the designer
  return (
    <div className="basic-seating-designer">
      {/* Toolbar */}
      <div className="toolbar">
        <button 
          type="button"
          onClick={addSection}
          className="toolbar-btn success"
          title="Thêm khu vực ghế ngồi"
        >
          <FaPlus /> Khu vực
        </button>
        
        <button
          type="button"
          onClick={deleteSelected}
          className={`toolbar-btn danger ${!selectedElement ? 'disabled' : ''}`}
          disabled={!selectedElement}
          title="Xóa phần tử đã chọn"
        >
          <FaTrash /> Xóa
        </button>
        
        <button
          type="button"
          onClick={undo}
          className={`toolbar-btn ${historyIndex <= 0 ? 'disabled' : ''}`}
          disabled={historyIndex <= 0}
          title="Hoàn tác"
        >
          <FaUndo /> Undo
        </button>
        
        <button
          type="button"
          onClick={redo}
          className={`toolbar-btn ${historyIndex >= history.length - 1 ? 'disabled' : ''}`}
          disabled={historyIndex >= history.length - 1}
          title="Làm lại"
        >
          <FaRedo /> Redo
        </button>
        
        <button
          type="button"
          onClick={showDebugInfo}
          className="toolbar-btn info"
          title="Hiển thị thông tin gỡ lỗi"
        >
          <FaBug /> Debug
        </button>
        
        <div className="toolbar-spacer"></div>
        
        <button
          type="button"
          onClick={() => setShowSidebar(!showSidebar)}
          className={`toolbar-btn ${showSidebar ? 'active' : ''}`}
          title={showSidebar ? "Ẩn thanh bên" : "Hiện thanh bên"}
        >
          {showSidebar ? "Ẩn thuộc tính" : "Hiện thuộc tính"}
        </button>
      </div>
      
      {/* Main content */}
      <div className="designer-content">
        {/* Canvas */}
        <div className="canvas-container">
          <svg
            ref={svgRef}
            viewBox="0 0 1000 800"
            className="design-canvas"
            onClick={handleCanvasClick}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Stage */}
            {localMap.stage && (
              <g 
                className={`stage-element ${selectedElement?.type === 'stage' ? 'selected' : ''}`}
                onMouseDown={(e) => handleDragStart(e, localMap.stage, 'stage')}
                transform={`translate(${localMap.stage.x},${localMap.stage.y})`}
                data-type="stage"
                data-id={localMap.stage.id}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <rect
                  width={localMap.stage.width}
                  height={localMap.stage.height}
                  fill="#4f46e5"
                  rx="10"
                  className="stage"
                  stroke={selectedElement?.type === 'stage' ? '#ffffff' : 'none'}
                  strokeWidth={selectedElement?.type === 'stage' ? 2 : 0}
                />
                <text
                  x={localMap.stage.width / 2}
                  y={localMap.stage.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="16"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  SÂN KHẤU
                </text>
                {selectedElement?.type === 'stage' && (
                  <>
                    <circle cx="0" cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx={localMap.stage.width} cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx="0" cy={localMap.stage.height} r="4" fill="#fff" className="handle" />
                    <circle cx={localMap.stage.width} cy={localMap.stage.height} r="4" fill="#fff" className="handle" />
                  </>
                )}
              </g>
            )}
            
            {/* Sections */}
            {Array.isArray(localMap.sections) && localMap.sections.map((section) => (
              <g
                key={section.id}
                className={`section ${selectedElement?.id === section.id ? 'selected' : ''}`}
                transform={`translate(${section.x},${section.y})`}
                onMouseDown={(e) => handleDragStart(e, section, 'section')}
                data-type="section"
                data-id={section.id}
                style={{ cursor: isDragging && selectedElement?.id === section.id ? 'grabbing' : 'grab' }}
              >
                <rect
                  width={section.width}
                  height={section.height}
                  fill={section.ticketTypeId ? 
                    (ticketTypes.find(t => t._id === section.ticketTypeId)?.color || '#3B82F6') : 
                    '#3B82F6'
                  }
                  fillOpacity="0.2"
                  stroke={selectedElement?.id === section.id ? 
                    '#ffffff' : 
                    (section.ticketTypeId ? 
                      (ticketTypes.find(t => t._id === section.ticketTypeId)?.color || '#3B82F6') : 
                      '#3B82F6')
                  }
                  strokeWidth={selectedElement?.id === section.id ? 2 : 1}
                  rx="4"
                />
                <text
                  x="10"
                  y="20"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="0.5"
                >
                  {section.name}
                </text>
                {section.ticketTypeId && ticketTypes.find(t => t._id === section.ticketTypeId) && (
                  <text
                    x="10"
                    y="40"
                    fill="white"
                    fontSize="12"
                    style={{ pointerEvents: 'none' }}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="0.5"
                  >
                    {ticketTypes.find(t => t._id === section.ticketTypeId)?.name} - {ticketTypes.find(t => t._id === section.ticketTypeId)?.price.toLocaleString('vi-VN')}đ
                  </text>
                )}
                {selectedElement?.id === section.id && (
                  <>
                    <circle cx="0" cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx={section.width} cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx="0" cy={section.height} r="4" fill="#fff" className="handle" />
                    <circle cx={section.width} cy={section.height} r="4" fill="#fff" className="handle" />
                  </>
                )}
              </g>
            ))}
            
            {/* Venue Objects */}
            {Array.isArray(localMap.venueObjects) && localMap.venueObjects.map((object) => (
              <g
                key={object.id}
                className={`venue-object ${selectedElement?.id === object.id ? 'selected' : ''}`}
                transform={`translate(${object.x},${object.y})`}
                onMouseDown={(e) => handleDragStart(e, object, 'venueObject')}
                data-type="venueObject"
                data-id={object.id}
                style={{ cursor: isDragging && selectedElement?.id === object.id ? 'grabbing' : 'grab' }}
              >
                {object.isRound ? (
                  <circle
                    cx={object.width / 2}
                    cy={object.height / 2}
                    r={Math.min(object.width, object.height) / 2}
                    fill={object.color}
                    stroke={selectedElement?.id === object.id ? '#ffffff' : 'none'}
                    strokeWidth={selectedElement?.id === object.id ? 2 : 0}
                  />
                ) : (
                  <rect
                    width={object.width}
                    height={object.height}
                    fill={object.color}
                    rx="4"
                    stroke={selectedElement?.id === object.id ? '#ffffff' : 'none'}
                    strokeWidth={selectedElement?.id === object.id ? 2 : 0}
                  />
                )}
                <text
                  x={object.width / 2}
                  y={object.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth="0.5"
                >
                  {object.label}
                </text>
                {selectedElement?.id === object.id && (
                  <>
                    <circle cx="0" cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx={object.width} cy="0" r="4" fill="#fff" className="handle" />
                    <circle cx="0" cy={object.height} r="4" fill="#fff" className="handle" />
                    <circle cx={object.width} cy={object.height} r="4" fill="#fff" className="handle" />
                  </>
                )}
              </g>
            ))}
            
            {/* Debug overlay */}
            {isDragging && selectedElement && (
              <circle 
                cx={debugInfo.mousePos.x} 
                cy={debugInfo.mousePos.y} 
                r="5" 
                fill="red" 
                opacity="0.5"
              />
            )}
          </svg>
          
          {/* Debug Panel */}
          <div className="debug-panel">
            <div className="debug-title">DEBUG INFO</div>
            <div>Sections: {localMap.sections?.length || 0}</div>
            <div>Objects: {localMap.venueObjects?.length || 0}</div>
            <div>Layout: {localMap.layoutType}</div>
            <div>Mode: {isDragging ? 'dragging' : 'select'}</div>
            {selectedElement && <div>Selected: {selectedElement.type} ({selectedElement.id.substring(0, 6)}...)</div>}
            <div>Last: {debugInfo.lastAction}</div>
          </div>
        </div>
        
        {/* Sidebar */}
        {showSidebar && (
          <div className="designer-sidebar">
            <PropertyEditor 
              selectedElement={selectedElement} 
              localMap={localMap} 
              onUpdate={handlePropertyUpdate}
              ticketTypes={ticketTypes}
            />
            
            <ObjectToolbar onAddObject={handleAddObjectFromToolbar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicSeatingDesigner; 