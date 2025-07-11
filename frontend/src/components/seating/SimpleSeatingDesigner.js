import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, FaTrash, FaDoorOpen, FaDoorClosed, FaToilet, 
  FaHamburger, FaUndo, FaRedo, FaSearchPlus, FaBug 
} from 'react-icons/fa';
import './SimpleSeatingDesigner.css';

const SimpleSeatingDesigner = ({ 
  seatingMap,
  setSeatingMap,
  ticketTypes = [],
  layoutType = 'theater',
  height = 600
}) => {
  console.log('SimpleSeatingDesigner rendered', 
    { hasSeatingMap: !!seatingMap, ticketTypes: ticketTypes.length, layoutType });
  
  // State
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [debugInfo, setDebugInfo] = useState({
    sections: 0,
    objects: 0,
    layout: layoutType,
    mode: 'select'
  });

  // Refs
  const svgRef = useRef(null);

  // Initialize seatingMap with default structure
  const defaultSeatingMap = {
    layoutType: layoutType || 'theater',
    sections: [],
    stage: { x: 400, y: 50, width: 300, height: 60 },
    venueObjects: []
  };

  // Process the incoming seatingMap prop, providing fallbacks
  const [internalSeatingMap, setInternalSeatingMap] = useState(seatingMap || defaultSeatingMap);

  // Update internal state when props change
  useEffect(() => {
    if (seatingMap) {
      setInternalSeatingMap({
        layoutType: seatingMap.layoutType || layoutType || 'theater',
        sections: Array.isArray(seatingMap.sections) ? [...seatingMap.sections] : [],
        stage: seatingMap.stage || { x: 400, y: 50, width: 300, height: 60 },
        venueObjects: Array.isArray(seatingMap.venueObjects) ? [...seatingMap.venueObjects] : []
      });
      
      console.log('Updated internal seating map from props:', 
        { sections: seatingMap.sections?.length, venueObjects: seatingMap.venueObjects?.length });
    }
  }, [seatingMap, layoutType]);

  // Update debug info
  useEffect(() => {
    setDebugInfo({
      sections: internalSeatingMap.sections.length,
      objects: internalSeatingMap.venueObjects.length,
      layout: internalSeatingMap.layoutType,
      mode: 'select'
    });
  }, [internalSeatingMap]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && internalSeatingMap) {
      setHistory([internalSeatingMap]);
      setHistoryIndex(0);
    }
  }, [internalSeatingMap, history]);

  // Safe update function to notify parent component
  const updateParentSeatingMap = (newMap) => {
    // Update local state first
    setInternalSeatingMap(newMap);

    // Update parent component's state
    if (typeof setSeatingMap === 'function') {
      try {
        console.log('Updating parent seatingMap', {
          sections: newMap.sections.length,
          venueObjects: newMap.venueObjects.length
        });
        setSeatingMap(newMap);
      } catch (error) {
        console.error('Error updating parent:', error);
      }
    }

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMap);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Add a new section
  const addSection = () => {
    console.log('Adding new section');
    
    // Create new section
    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Khu ${internalSeatingMap.sections.length + 1}`,
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      rows: 10,
      seatsPerRow: 15,
      ticketTypeIndex: 0
    };
    
    // Make sure we have valid arrays
    const currentSections = Array.isArray(internalSeatingMap.sections) 
      ? [...internalSeatingMap.sections] 
      : [];
    
    // Create new map
    const newMap = {
      ...internalSeatingMap,
      sections: [...currentSections, newSection]
    };
    
    console.log('New seating map after adding section:', 
      { sections: newMap.sections.length, venueObjects: newMap.venueObjects.length });
    
    // Update state and select new section
    updateParentSeatingMap(newMap);
    setSelectedElement({...newSection, type: 'section', index: newMap.sections.length - 1});
  };

  // Add a venue object (entrance, exit, etc.)
  const addVenueObject = (type) => {
    console.log('Adding new venue object:', type);
    
    // Create new object with properties based on type
    let newObject = {
      id: `venue-object-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 300,
      y: 300,
      width: 60,
      height: 60,
      type
    };
    
    // Set label and color based on type
    switch(type) {
      case 'entrance':
        newObject = { ...newObject, label: 'Lối vào', color: '#22C55E' };
        break;
      case 'exit':
        newObject = { ...newObject, label: 'Lối ra', color: '#EF4444' };
        break;
      case 'restroom':
        newObject = { ...newObject, label: 'WC', color: '#0EA5E9' };
        break;
      case 'food':
        newObject = { ...newObject, label: 'Quầy đồ ăn', color: '#F59E0B' };
        break;
      default:
        newObject = { ...newObject, label: 'Khác', color: '#8B5CF6' };
    }
    
    // Make sure we have valid arrays
    const currentVenueObjects = Array.isArray(internalSeatingMap.venueObjects) 
      ? [...internalSeatingMap.venueObjects] 
      : [];
    
    // Create new map, preserving existing objects
    const newMap = {
      ...internalSeatingMap,
      venueObjects: [...currentVenueObjects, newObject]
    };
    
    console.log('New seating map after adding venue object:', 
      { sections: newMap.sections.length, venueObjects: newMap.venueObjects.length });
    
    // Update state and select new object
    updateParentSeatingMap(newMap);
    setSelectedElement({...newObject, type: 'venueObject', index: newMap.venueObjects.length - 1});
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    
    console.log('Deleting element:', selectedElement);
    
    // Create a copy of the current map
    const newMap = { 
      layoutType: internalSeatingMap.layoutType,
      stage: internalSeatingMap.stage,
      sections: Array.isArray(internalSeatingMap.sections) ? [...internalSeatingMap.sections] : [],
      venueObjects: Array.isArray(internalSeatingMap.venueObjects) ? [...internalSeatingMap.venueObjects] : []
    };
    
    if (selectedElement.type === 'section') {
      newMap.sections = newMap.sections.filter(s => s.id !== selectedElement.id);
    } else if (selectedElement.type === 'venueObject') {
      newMap.venueObjects = newMap.venueObjects.filter(o => o.id !== selectedElement.id);
    }
    
    updateParentSeatingMap(newMap);
    setSelectedElement(null);
  };

  // Undo/redo functions
  const undo = () => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const previousState = history[newIndex];
    
    setInternalSeatingMap(previousState);
    
    if (typeof setSeatingMap === 'function') {
      setSeatingMap(previousState);
    }
  };
  
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const nextState = history[newIndex];
    
    setInternalSeatingMap(nextState);
    
    if (typeof setSeatingMap === 'function') {
      setSeatingMap(nextState);
    }
  };

  // Handle mouse events for dragging elements
  const handleMouseDown = (e, element, type, index) => {
    console.log('Mouse down on element:', { type, index });
    e.preventDefault();
    e.stopPropagation();
    
    // Select the element
    setSelectedElement({ ...element, type, index });
    
    // Start dragging
    setIsDragging(true);
    
    // Calculate drag offset from element's origin
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const point = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
    
    setDragOffset({
      x: point.x - element.x,
      y: point.y - element.y
    });
  };

  // Handle mouse movement during dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Convert mouse coordinates to SVG coordinates
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const point = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
    
    // Update element position
    const newX = point.x - dragOffset.x;
    const newY = point.y - dragOffset.y;
    
    // Create updated map based on element type
    const newMap = { 
      layoutType: internalSeatingMap.layoutType,
      stage: { ...internalSeatingMap.stage },
      sections: Array.isArray(internalSeatingMap.sections) ? [...internalSeatingMap.sections] : [],
      venueObjects: Array.isArray(internalSeatingMap.venueObjects) ? [...internalSeatingMap.venueObjects] : []
    };
    
    if (selectedElement.type === 'stage') {
      newMap.stage = { ...newMap.stage, x: newX, y: newY };
    } else if (selectedElement.type === 'section') {
      const sectionIndex = newMap.sections.findIndex(s => s.id === selectedElement.id);
      if (sectionIndex >= 0) {
        newMap.sections[sectionIndex] = { ...newMap.sections[sectionIndex], x: newX, y: newY };
      }
    } else if (selectedElement.type === 'venueObject') {
      const objectIndex = newMap.venueObjects.findIndex(o => o.id === selectedElement.id);
      if (objectIndex >= 0) {
        newMap.venueObjects[objectIndex] = { ...newMap.venueObjects[objectIndex], x: newX, y: newY };
      }
    }
    
    // Update internal state (but don't push to history during dragging)
    setInternalSeatingMap(newMap);
  };

  // Handle mouse up to end dragging
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Mouse up, ending drag');
    
    // End dragging
    setIsDragging(false);
    
    // Save current state to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(internalSeatingMap);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Update parent component
    if (typeof setSeatingMap === 'function') {
      setSeatingMap(internalSeatingMap);
    }
  };

  // Add event listeners for global mouse events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedElement, dragOffset]);

  return (
    <div className="simple-seating-designer">
      {/* Toolbar */}
      <div className="designer-toolbar">
        <button 
          type="button"
          onClick={addSection}
          title="Thêm khu vực ghế ngồi"
          className="toolbar-button green"
        >
          <FaPlus /> Khu vực
        </button>
        
        <button 
          type="button"
          onClick={() => addVenueObject('entrance')}
          title="Thêm lối vào"
          className="toolbar-button green"
        >
          <FaDoorOpen /> Lối vào
        </button>
        
        <button 
          type="button"
          onClick={() => addVenueObject('exit')}
          title="Thêm lối ra"
          className="toolbar-button"
        >
          <FaDoorClosed /> Lối ra
        </button>
        
        <button 
          type="button"
          onClick={() => addVenueObject('restroom')}
          title="Thêm nhà vệ sinh"
          className="toolbar-button"
        >
          <FaToilet /> WC
        </button>
        
        <button 
          type="button"
          onClick={() => addVenueObject('food')}
          title="Thêm quầy thức ăn"
          className="toolbar-button"
        >
          <FaHamburger /> Đồ ăn
        </button>

        <button 
          type="button"
          onClick={deleteSelectedElement}
          disabled={!selectedElement}
          title="Xóa phần tử đã chọn"
          className={`toolbar-button ${selectedElement ? 'red' : 'disabled'}`}
        >
          <FaTrash /> Xóa
        </button>

        <button 
          type="button"
          onClick={() => {
            alert(`DEBUG INFO:\nSections: ${debugInfo.sections}\nObjects: ${debugInfo.objects}\nLayout: ${debugInfo.layout}`);
          }}
          title="Debug Info"
          className="toolbar-button blue"
        >
          <FaBug /> Debug
        </button>

        <button 
          type="button"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Hoàn tác"
          className={`toolbar-button ${historyIndex > 0 ? '' : 'disabled'}`}
        >
          <FaUndo /> Undo
        </button>
        
        <button 
          type="button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Làm lại"
          className={`toolbar-button ${historyIndex < history.length - 1 ? '' : 'disabled'}`}
        >
          <FaRedo /> Redo
        </button>
      </div>

      {/* Canvas */}
      <div className="designer-canvas">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 1000 800"
          className="seating-svg"
        >
          {/* Stage */}
          {internalSeatingMap.stage && (
            <g
              transform={`translate(${internalSeatingMap.stage.x}, ${internalSeatingMap.stage.y})`}
              onMouseDown={(e) => handleMouseDown(e, internalSeatingMap.stage, 'stage')}
              className="stage-element"
            >
              <rect
                width={internalSeatingMap.stage.width}
                height={internalSeatingMap.stage.height}
                fill="#4f46e5"
                stroke="#1e40af"
                strokeWidth="2"
                rx={10}
                className={`stage ${selectedElement?.type === 'stage' ? 'selected' : ''}`}
              />
              <text
                x={internalSeatingMap.stage.width / 2}
                y={internalSeatingMap.stage.height / 2 + 5}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                SÂN KHẤU
              </text>
            </g>
          )}
                
          {/* Sections */}
          {internalSeatingMap.sections && internalSeatingMap.sections.map((section, index) => (
            <g 
              key={section.id || `section-${index}`}
              transform={`translate(${section.x}, ${section.y})`}
              className={`section ${selectedElement?.type === 'section' && selectedElement?.id === section.id ? 'selected' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, section, 'section', index)}
            >
              <rect
                width={section.width || 300}
                height={section.height || 200}
                fill={ticketTypes[section.ticketTypeIndex]?.color || '#3B82F6'}
                fillOpacity="0.2"
                stroke={ticketTypes[section.ticketTypeIndex]?.color || '#3B82F6'}
                strokeWidth={selectedElement?.type === 'section' && selectedElement?.id === section.id ? '2' : '1'}
              />
              <text
                x={10}
                y={20}
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {section.name || `Section ${index + 1}`}
              </text>
              
              {/* Show ticket type if available */}
              {ticketTypes[section.ticketTypeIndex] && (
                <text
                  x={10}
                  y={40}
                  fill="white"
                  fontSize="12"
                >
                  {ticketTypes[section.ticketTypeIndex].name} - {ticketTypes[section.ticketTypeIndex].price.toLocaleString()}đ
                </text>
              )}
            </g>
          ))}
          
          {/* Venue objects */}
          {internalSeatingMap.venueObjects && internalSeatingMap.venueObjects.map((object, index) => (
            <g 
              key={object.id || `venue-object-${index}`}
              transform={`translate(${object.x}, ${object.y})`}
              onMouseDown={(e) => handleMouseDown(e, object, 'venueObject', index)}
              className="venue-object"
            >
              <rect
                width={object.width}
                height={object.height}
                fill={object.color}
                stroke={selectedElement?.type === 'venueObject' && 
                      (selectedElement.index === index || selectedElement.id === object.id) 
                      ? 'white' : 'transparent'}
                strokeWidth={selectedElement?.type === 'venueObject' && 
                           (selectedElement.index === index || selectedElement.id === object.id) 
                           ? 2 : 0}
                rx={4}
              />
              <text
                x={object.width / 2}
                y={object.height / 2 + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {object.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Debug info panel */}
        <div className="debug-panel">
          <h3>DEBUG INFO</h3>
          <p>Sections: {debugInfo.sections}</p>
          <p>Objects: {debugInfo.objects}</p>
          <p>Layout: {debugInfo.layout}</p>
          <p>Mode: select</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleSeatingDesigner; 