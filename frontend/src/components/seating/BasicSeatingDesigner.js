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
        sections: [],
        stage: seatingMap.stage ? JSON.parse(JSON.stringify(seatingMap.stage)) : { id: "stage-main", x: 400, y: 50, width: 300, height: 60 },
        venueObjects: Array.isArray(seatingMap.venueObjects) ? JSON.parse(JSON.stringify(seatingMap.venueObjects)) : []
      };
      
      // Carefully process sections to ensure coordinates are preserved
      if (Array.isArray(seatingMap.sections)) {
        newMap.sections = seatingMap.sections.map(section => {
          // Ensure x and y are valid numbers
          const x = typeof section.x === 'number' ? section.x : 200;
          const y = typeof section.y === 'number' ? section.y : 200;
          
          // Log section position for debugging
          console.log(`Processing section ${section.id || 'unknown'}: position (${x}, ${y})`);
          
          return {
            ...JSON.parse(JSON.stringify(section)),
            x: x,
            y: y
          };
        });
      }
      
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
  const addSection = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Calculate a good position for the new section - below the stage
    const stageY = localMapRef.current.stage?.y || 50;
    const stageHeight = localMapRef.current.stage?.height || 60;
    const stageCenterX = localMapRef.current.stage?.x 
      ? localMapRef.current.stage.x + (localMapRef.current.stage.width / 2) 
      : 400;
    
    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Khu ${localMapRef.current.sections.length + 1}`,
      x: Math.max(50, stageCenterX - 150), // Center horizontally relative to stage
      y: stageY + stageHeight + 50, // Position below stage with some spacing
      width: 300,
      height: 200,
      rows: 10,
      seatsPerRow: 15,
      ticketTypeId: ticketTypes.length > 0 ? ticketTypes[0]._id : undefined
    };
    
    console.log('Adding new section at position:', { x: newSection.x, y: newSection.y });
    
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
  const addVenueObject = (objectType, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Calculate a good position for the new venue object - to the side of existing objects
    const existingObjects = localMapRef.current.venueObjects || [];
    const objectCount = existingObjects.length;
    
    // Position to the right side of the canvas if there are no objects yet
    // Otherwise, position to the right of the last object
    let posX = 700;
    let posY = 300;
    
    if (objectCount > 0) {
      const lastObject = existingObjects[objectCount - 1];
      if (lastObject && typeof lastObject.x === 'number' && typeof lastObject.y === 'number') {
        posX = lastObject.x + 80; // Position to the right with some spacing
        posY = lastObject.y;
        
        // If we're going too far right, move down and back to the left
        if (posX > 800) {
          posX = 700;
          posY = lastObject.y + 80;
        }
      }
    }
    
    // Create the new venue object
    const newObject = {
      id: `venue-object-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: objectType.id,
      label: objectType.name,
      x: posX,
      y: posY,
      width: objectType.width,
      height: objectType.height,
      color: objectType.color,
      isRound: objectType.isRound || false
    };
    
    console.log('Adding new venue object:', newObject);
    
    // Create new map with added object using deep clone
    const newMap = JSON.parse(JSON.stringify(localMapRef.current));
    newMap.venueObjects.push(newObject);
    
    // Save changes
    saveChanges(newMap);
    
    // Select new object
    setSelectedElement({
      type: 'venueObject',
      id: newObject.id,
      index: newMap.venueObjects.length - 1
    });

    setDebugInfo(prev => ({
      ...prev,
      lastAction: `added ${objectType}`
    }));
  };
  
  // Delete selected element
  const deleteSelected = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedElement) return;
    
    console.log('Deleting selected element:', selectedElement);
    
    // Create new map without the selected element
    const newMap = JSON.parse(JSON.stringify(localMapRef.current));
    
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
  
  // Undo last action
  const undo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const previousMap = history[newIndex];
    
    setHistoryIndex(newIndex);
    setLocalMap(previousMap);
    updateParent(previousMap);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'undo'
    }));
  };
  
  // Redo last action
  const redo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const nextMap = history[newIndex];
    
    setHistoryIndex(newIndex);
    setLocalMap(nextMap);
    updateParent(nextMap);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'redo'
    }));
  };
  
  // Show debug info
  const showDebugInfo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Current debug info:', debugInfo);
    console.log('Current local map:', localMap);
    console.log('Selected element:', selectedElement);
    
    setDebugInfo(prev => ({
      ...prev,
      lastAction: 'debug info shown'
    }));
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
    
    // Make sure element has valid coordinates
    const elementX = typeof element.x === 'number' ? element.x : 0;
    const elementY = typeof element.y === 'number' ? element.y : 0;
    
    const offset = {
      x: point.x - elementX,
      y: point.y - elementY
    };
    
    console.log('Drag offset calculated:', offset, 'Point:', point, 'Element position:', { x: elementX, y: elementY });
    
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
    
    // Make sure drag offset is valid
    const offset = dragOffsetRef.current || { x: 0, y: 0 };
    
    // Calculate new position
    const newX = Math.max(0, point.x - offset.x);
    const newY = Math.max(0, point.y - offset.y);
    
    // Update the element position
    const updatedMap = JSON.parse(JSON.stringify(localMapRef.current));
    
    if (selectedElementRef.current.type === 'stage') {
      updatedMap.stage.x = newX;
      updatedMap.stage.y = newY;
    } else if (selectedElementRef.current.type === 'section') {
      const sectionIndex = updatedMap.sections.findIndex(s => s.id === selectedElementRef.current.id);
      if (sectionIndex !== -1) {
        updatedMap.sections[sectionIndex].x = newX;
        updatedMap.sections[sectionIndex].y = newY;
      }
    } else if (selectedElementRef.current.type === 'venueObject') {
      const objectIndex = updatedMap.venueObjects.findIndex(o => o.id === selectedElementRef.current.id);
      if (objectIndex !== -1) {
        updatedMap.venueObjects[objectIndex].x = newX;
        updatedMap.venueObjects[objectIndex].y = newY;
      }
    }
    
    // Update local state immediately for smooth dragging
    setLocalMap(updatedMap);
    
    setDebugInfo(prev => ({
      ...prev,
      mousePos: { x: point.x, y: point.y },
      lastAction: `dragging ${selectedElementRef.current.type}`
    }));
  };
  
  // Handle global mouse up
  const handleGlobalMouseUp = (e) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Finished dragging:', selectedElementRef.current?.type);
    
    // Stop dragging
    setIsDragging(false);
    isDraggingRef.current = false;
    
    // Remove dragging class
    if (selectedElementRef.current) {
      const selector = `g[data-id="${selectedElementRef.current.id}"]`;
      const dragEl = document.querySelector(selector);
      if (dragEl) {
        dragEl.classList.remove('dragging');
      }
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    
    // Save changes to parent
    if (localMapRef.current) {
      saveChanges(localMapRef.current);
    }
    
    setDebugInfo(prev => ({
      ...prev,
      isDragging: false,
      lastAction: `finished dragging ${selectedElementRef.current?.type || 'unknown'}`
    }));
  };
  
  // These handlers are kept for component event bindings but delegate to global handlers
  const handleMouseMove = handleGlobalMouseMove;
  const handleMouseUp = handleGlobalMouseUp;
  
  // Handle canvas click
  const handleCanvasClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle clicks if not dragging
    if (isDraggingRef.current) return;
    
    // Deselect if clicking on empty space
    if (selectedElement) {
      setSelectedElement(null);
      setDebugInfo(prev => ({
        ...prev,
        lastAction: 'deselected'
      }));
    }
  };

  // Handle property updates
  const handlePropertyUpdate = (updatedMap) => {
    console.log('Property update triggered - preventing form submit');
    saveChanges(updatedMap);
  };

  // Handle object selection from toolbar
  const handleAddObjectFromToolbar = (objectType, e) => {
    console.log('Add object from toolbar triggered - preventing form submit');
    addVenueObject(objectType, e);
  };
  
  // Render the designer
  return (
    <div 
      className="basic-seating-designer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        // Ngăn chặn việc submit form khi nhấn Enter
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Toolbar */}
      <div className="toolbar">
        <button 
          type="button"
          onClick={(e) => addSection(e)}
          className="toolbar-btn success"
          title="Thêm khu vực ghế ngồi"
        >
          <FaPlus /> Khu vực
        </button>
        
        <button
          type="button"
          onClick={(e) => deleteSelected(e)}
          className={`toolbar-btn danger ${!selectedElement ? 'disabled' : ''}`}
          disabled={!selectedElement}
          title="Xóa phần tử đã chọn"
        >
          <FaTrash /> Xóa
        </button>
        
        <button
          type="button"
          onClick={(e) => undo(e)}
          className={`toolbar-btn ${historyIndex <= 0 ? 'disabled' : ''}`}
          disabled={historyIndex <= 0}
          title="Hoàn tác"
        >
          <FaUndo /> Undo
        </button>
        
        <button
          type="button"
          onClick={(e) => redo(e)}
          className={`toolbar-btn ${historyIndex >= history.length - 1 ? 'disabled' : ''}`}
          disabled={historyIndex >= history.length - 1}
          title="Làm lại"
        >
          <FaRedo /> Redo
        </button>
        
        <button
          type="button"
          onClick={(e) => showDebugInfo(e)}
          className="toolbar-btn info"
          title="Hiển thị thông tin gỡ lỗi"
        >
          <FaBug /> Debug
        </button>
        
        <div className="toolbar-spacer"></div>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowSidebar(!showSidebar);
          }}
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
            {Array.isArray(localMap.sections) && localMap.sections.map((section) => {
              // Ensure section has valid coordinates
              const sectionX = typeof section.x === 'number' ? section.x : 200;
              const sectionY = typeof section.y === 'number' ? section.y : 200;
              
              console.log(`Rendering section ${section.id}: position (${sectionX}, ${sectionY})`);
              
              return (
                <g
                  key={section.id}
                  className={`section ${selectedElement?.id === section.id ? 'selected' : ''}`}
                  transform={`translate(${sectionX},${sectionY})`}
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
              );
            })}
            
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
            {selectedElement && (
              <div>
                Selected: {selectedElement.type}
                {selectedElement.id && typeof selectedElement.id === 'string'
                  ? ` (${selectedElement.id.substring(0, 6)}...)`
                  : ''}
              </div>
            )}
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