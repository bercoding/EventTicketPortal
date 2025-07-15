import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaUndo, FaRedo, FaTrash, FaDoorOpen, FaDoorClosed, FaToilet, FaHamburger, FaGlassMartiniAlt, FaWheelchair, FaInfoCircle, FaMagic, FaMinus, FaSearchPlus, FaShieldAlt, FaFirstAid, FaShoppingBag, FaVideo, FaColumns, FaLevelUpAlt, FaSubway, FaBug } from 'react-icons/fa';
import './InteractiveSeatingDesigner.css';

// This is a wrapper component that will stop propagation of all events
const EventBlocker = ({ children }) => {
  const blockEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  return (
    <div 
      onClick={blockEvents}
      onMouseDown={blockEvents}
      onMouseUp={blockEvents}
      onSubmit={blockEvents}
      onKeyDown={blockEvents}
      onKeyUp={blockEvents}
      onMouseMove={blockEvents}
      // Capture phase event listeners to intercept events before they reach children
      onClickCapture={blockEvents}
      onMouseDownCapture={blockEvents}
      onMouseUpCapture={blockEvents}
      onSubmitCapture={blockEvents}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {children}
    </div>
  );
};

const InteractiveSeatingDesigner = ({ 
  seatingMap,
  setSeatingMap,
  ticketTypes = [],
  layoutType = 'theater',
  height = 600
}) => {
  console.log('DEBUG: InteractiveSeatingDesigner rendered with props:',
    'seatingMap:', seatingMap ? (seatingMap.sections ? seatingMap.sections.length : 'no sections') : 'null',
    'setSeatingMap:', typeof setSeatingMap,
    'ticketTypes:', ticketTypes.length,
    'layoutType:', layoutType
  );

  // Utility function to handle button clicks safely
  const handleButtonClick = (e, action) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Stop immediate propagation to completely prevent bubbling
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // Execute the callback immediately to make buttons responsive
    if (typeof action === 'function') {
      try {
        console.log('DEBUG: Executing button action');
      action();
        console.log('DEBUG: Button action executed');
      } catch (error) {
        console.error('DEBUG: Error in button action:', error);
      }
    }
    
    return false;
  };

  // State for editing mode
  const [editMode, setEditMode] = useState('select');
  
  // Refs
  const svgRef = useRef(null);
  const prevTicketTypesRef = useRef('');
  
  // Utility function to block events from propagating
  const blockEvent = (e, callback) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Stop immediate propagation to completely prevent bubbling
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // Execute the callback if provided
    if (callback && typeof callback === 'function') {
      callback();
    }
  };
  
  // State for selected element
  const [selectedElement, setSelectedElement] = useState(null);
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // State for viewBox
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 800 });
  
  // State for auto-seating options
  const [autoSeatingOptions, setAutoSeatingOptions] = useState({
    rows: 5,
    seatsPerRow: 10,
    type: 'grid',
    rowSpacing: 20,
    seatSpacing: 20
  });
  
  // State for forcing re-render
  const [renderKey, setRenderKey] = useState(0);
  
  // State for history (undo/redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    type: null,
    element: null
  });
  
  // State for control panel active tab
  const [activeControlTab, setActiveControlTab] = useState('properties');

  // State for processed seating map
  const [processedSeatingMap, setProcessedSeatingMap] = useState(seatingMap || {
    layoutType: layoutType || 'theater',
    sections: [],
    stage: getDefaultStage(layoutType),
    venueObjects: []
  });

  // Update processedSeatingMap when seatingMap changes
  useEffect(() => {
    console.log('DEBUG: seatingMap prop changed:', 
      seatingMap ? 
        `Has ${seatingMap.sections ? seatingMap.sections.length : 0} sections and ${seatingMap.venueObjects ? seatingMap.venueObjects.length : 0} objects` 
        : 'is null'
    );
    
    if (seatingMap) {
      console.log('DEBUG: Setting processedSeatingMap from prop');
      setProcessedSeatingMap(seatingMap);
    }
  }, [seatingMap]);

  // Canvas dimensions - made larger for better space
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  
  // Initialize seatingMap with layoutType if not provided
  useEffect(() => {
    if (!seatingMap || Object.keys(seatingMap).length === 0) {
      // Set initial seating map if not provided
      const initialMap = {
        layoutType: layoutType || 'theater',
        sections: [],
        stage: getDefaultStage(layoutType),
        venueObjects: []
      };
      setSeatingMap(initialMap);
      console.log('Initialized seatingMap:', initialMap);
      
      // Initialize history with initial map
      setHistory([initialMap]);
      setHistoryIndex(0);
    } else if (seatingMap.layoutType !== layoutType && layoutType) {
      // Update layoutType if it changes
      // Create a new object instead of using functional update
      const updatedMap = {
        ...seatingMap,
        layoutType
      };
      setSeatingMap(updatedMap);
      console.log('Updated seatingMap layoutType to:', layoutType);
    }
    
    // Initialize history if empty
    if (history.length === 0 && seatingMap) {
      setHistory([seatingMap]);
      setHistoryIndex(0);
    }
  }, [layoutType, setSeatingMap]);

  // Function to get default stage based on layout type
  const getDefaultStage = (type) => {
    switch (type) {
      case 'footballStadium':
        return { x: 400, y: 250, width: 400, height: 200 };
      case 'basketballArena':
        return { x: 400, y: 250, width: 350, height: 180 };
      case 'concert':
        return { x: 400, y: 50, width: 300, height: 80 };
      case 'stadium':
        return { x: 400, y: 150, width: 400, height: 150 };
      case 'theater':
      default:
        return { x: 400, y: 50, width: 300, height: 60 };
    }
  };

  // Call zoomToFit whenever sections are added or removed
  useEffect(() => {
    if (seatingMap?.sections) {
      zoomToFit();
    }
  }, [seatingMap?.sections?.length]);

  // Call zoomToFit on initial load
  useEffect(() => {
    setTimeout(() => {
      zoomToFit();
    }, 500); // Slight delay to ensure component is fully mounted
  }, []);

  // State for row and seat selection
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(null);

  // State for drag and drop
  const [draggedVenueObject, setDraggedVenueObject] = useState(null);
  const [draggedVenueObjectIndex, setDraggedVenueObjectIndex] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Venue object types definition
  const venueObjectTypes = {
    'entrance': { name: 'Lối vào', icon: <FaDoorOpen />, color: '#4ade80', width: 30, height: 30 },
    'exit': { name: 'Lối ra', icon: <FaDoorClosed />, color: '#f87171', width: 30, height: 30 },
    'restroom': { name: 'Nhà vệ sinh', icon: <FaToilet />, color: '#60a5fa', width: 30, height: 30 },
    'food': { name: 'Quầy thức ăn', icon: <FaHamburger />, color: '#fbbf24', width: 40, height: 30 },
    'drinks': { name: 'Quầy đồ uống', icon: <FaGlassMartiniAlt />, color: '#a78bfa', width: 40, height: 30 },
    'accessible': { name: 'Hỗ trợ', icon: <FaWheelchair />, color: '#34d399', width: 30, height: 30 },
    'info': { name: 'Thông tin', icon: <FaInfoCircle />, color: '#38bdf8', width: 30, height: 30 },
    'security': { name: 'An ninh', icon: <FaShieldAlt />, color: '#fb923c', width: 30, height: 30 },
    'firstaid': { name: 'Sơ cứu', icon: <FaFirstAid />, color: '#f43f5e', width: 35, height: 35 },
    'merchandise': { name: 'Quầy bán hàng', icon: <FaShoppingBag />, color: '#c084fc', width: 40, height: 30 },
    'camera': { name: 'Vị trí camera', icon: <FaVideo />, color: '#64748b', width: 25, height: 25 },
    'column': { name: 'Cột', icon: <FaColumns />, color: '#94a3b8', width: 20, height: 20 },
    'stairs': { name: 'Cầu thang', icon: <FaLevelUpAlt />, color: '#cbd5e1', width: 35, height: 35 },
    'elevator': { name: 'Thang máy', icon: <FaSubway />, color: '#9ca3af', width: 30, height: 30 }
  };

  // Hàm onChange để cập nhật dữ liệu lên component cha
  const onChange = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (typeof setSeatingMap === 'function' && e?.target?.name === 'seatingMap') {
      console.log('Calling setSeatingMap with updated data:', e.target.value);
      setSeatingMap(e.target.value);
    }
  };

  // Verify seating data
  const verifySeatingData = (map) => {
    console.log('DEBUG: verifySeatingData called with map:', map ? 'valid object' : 'null or undefined');
    
    if (!map) {
      console.error('❌ DEBUG: No seating map provided - creating default map');
      // Instead of returning false, return a default seating map structure
      return {
        layoutType: layoutType || 'theater',
        sections: [],
        stage: getDefaultStage(layoutType || 'theater'),
        venueObjects: []
      };
    }
    
    // Make sure we have the required properties
    const verifiedMap = {
      ...map,
      layoutType: map.layoutType || layoutType || 'theater',
      sections: Array.isArray(map.sections) ? map.sections : [],
      stage: map.stage || getDefaultStage(map.layoutType || layoutType),
      venueObjects: Array.isArray(map.venueObjects) ? map.venueObjects : []
    };
    
    // Ensure sections have proper structure
    if (verifiedMap.sections && verifiedMap.sections.length > 0) {
      verifiedMap.sections = verifiedMap.sections.map(section => ({
        ...section,
        id: section.id || `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        rows: section.rows || [],
        ticketTypeIndex: section.ticketTypeIndex !== undefined ? section.ticketTypeIndex : 0
      }));
    } else {
      verifiedMap.sections = [];
    }
    
    // Ensure venueObjects have proper structure
    if (!Array.isArray(verifiedMap.venueObjects)) {
      verifiedMap.venueObjects = [];
    }
    
    console.log('DEBUG: Verified map structure - sections:', 
      verifiedMap.sections ? verifiedMap.sections.length : 0, 
      'venueObjects:', verifiedMap.venueObjects ? verifiedMap.venueObjects.length : 0);
    
    return verifiedMap;
  };

  // Update seating map function with verification
  const updateSeatingMapSafely = (updater) => {
    console.log('DEBUG: updateSeatingMapSafely called with:', typeof updater);
    
    if (typeof updater === 'function') {
      // When we have a function updater, we need to execute it with our current state first
      try {
        console.log('DEBUG: Handling function updater');
        // Get the current processed seating map
        const currentMap = processedSeatingMap || {};
        console.log('DEBUG: Current map before function update:', 
                   'sections:', currentMap.sections ? currentMap.sections.length : 0,
                   'venueObjects:', currentMap.venueObjects ? currentMap.venueObjects.length : 0);
        
        // Apply the updater function to get the new state
        const updated = updater(currentMap);
        console.log('DEBUG: After applying function updater:', updated ? 'Got result' : 'No result');
        
        if (!updated) {
          console.error('DEBUG: Function updater returned null/undefined');
          return;
        }
        
        // Verify the updated data
          const verified = verifySeatingData(updated);
        console.log('DEBUG: Verified result from function updater');
        
        // Update the local state first
        setProcessedSeatingMap(verified);
        
        // Now use the direct object to update the parent
        console.log('DEBUG: Calling parent setSeatingMap with verified data');
        try {
          setSeatingMap(verified);
          console.log('DEBUG: Successfully called parent setSeatingMap');
        } catch (error) {
          console.error('DEBUG: Error calling parent setSeatingMap:', error);
        }
          
          // Lưu trữ vào history nếu khác với giá trị trước đó
        if (verified && JSON.stringify(currentMap) !== JSON.stringify(verified)) {
            setTimeout(() => {
            console.log('DEBUG: Saving to history');
              saveToHistory(verified);
            }, 0);
          }
        } catch (error) {
        console.error('DEBUG: Error in function updater:', error);
        }
    } else {
      // Direct object update
      console.log('DEBUG: Handling direct object update');
      if (!updater) {
        console.error('DEBUG: Received null/undefined updater object');
        return;
      }
      
      const verified = verifySeatingData(updater);
      console.log('DEBUG: Verified object update data');
      
      // Update the local state first
      setProcessedSeatingMap(verified);
      
      // Update parent
      console.log('DEBUG: Calling parent setSeatingMap with verified object');
      try {
      setSeatingMap(verified);
        console.log('DEBUG: Successfully called parent setSeatingMap with object');
      } catch (error) {
        console.error('DEBUG: Error calling parent setSeatingMap with object:', error);
      }
      
      // Lưu trữ vào history nếu là cập nhật hợp lệ
      if (verified) {
        setTimeout(() => {
          console.log('DEBUG: Saving object update to history');
          saveToHistory(verified);
        }, 0);
      }
    }
  };

  // Save state to history
  const saveToHistory = (newState) => {
    // Only save if it's different from the current state
    if (historyIndex >= 0 && history.length > 0 && 
        JSON.stringify(history[historyIndex]) === JSON.stringify(newState)) {
      return;
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
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

  // Function to zoom to fit all content
  const zoomToFit = () => {
    if (!seatingMap || !svgRef.current) return;

    // Calculate the bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Include stage in bounds
    if (seatingMap.stage) {
      minX = Math.min(minX, seatingMap.stage.x);
      minY = Math.min(minY, seatingMap.stage.y);
      maxX = Math.max(maxX, seatingMap.stage.x + seatingMap.stage.width);
      maxY = Math.max(maxY, seatingMap.stage.y + seatingMap.stage.height);
    }
    
    // Include sections in bounds
    if (seatingMap.sections && seatingMap.sections.length > 0) {
      seatingMap.sections.forEach(section => {
        if (section.x !== undefined && section.y !== undefined) {
          minX = Math.min(minX, section.x);
          minY = Math.min(minY, section.y);
          maxX = Math.max(maxX, section.x + (section.width || 100));
          maxY = Math.max(maxY, section.y + (section.height || 100));
        }
      });
    }
    
    // Include venue objects in bounds
    if (seatingMap.venueObjects && seatingMap.venueObjects.length > 0) {
      seatingMap.venueObjects.forEach(obj => {
          minX = Math.min(minX, obj.x);
          minY = Math.min(minY, obj.y);
        maxX = Math.max(maxX, obj.x + (obj.width || 30));
        maxY = Math.max(maxY, obj.y + (obj.height || 30));
      });
    }
    
    // Default bounds if nothing found
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 600;
    }
    
    // Add padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Set new viewBox
    const width = maxX - minX;
    const height = maxY - minY;
    
    setViewBox({
      x: minX,
      y: minY,
      width,
      height
    });
  };

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = (event) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    
    // Calculate relative position within the SVG element
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    
    // Convert to SVG coordinate system
    const x = viewBox.x + relativeX * viewBox.width;
    const y = viewBox.y + relativeY * viewBox.height;
    
    return { x, y };
  };

  // Handle mouse down for dragging elements
  const handleMouseDown = (e, element, type, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (editMode !== 'select') {
      return; // Only allow dragging in select mode
    }
    
    console.log(`Mouse down on ${type}:`, element);
    
    const svgElement = svgRef.current;
    const svgRect = svgElement.getBoundingClientRect();
    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startElementX = element.x;
    const startElementY = element.y;
    
    setSelectedElement({ ...element, type, index });
    
    // Setup drag handlers
    const handleMouseMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const dx = (e.clientX - startX) / scaleX;
      const dy = (e.clientY - startY) / scaleY;
      
      // Update element position
      const newX = Math.max(0, startElementX + dx);
      const newY = Math.max(0, startElementY + dy);
      
      // Create a copy of the current state to modify
      let updatedMap = { ...processedSeatingMap };
      
      // Update the appropriate element
      if (type === 'stage') {
        updatedMap.stage = {
          ...updatedMap.stage,
          x: newX,
          y: newY
        };
      } else if (type === 'section') {
        const updatedSections = [...updatedMap.sections];
        updatedSections[index] = {
          ...updatedSections[index],
          x: newX,
          y: newY
        };
        updatedMap.sections = updatedSections;
      } else if (type === 'venueObject') {
        const updatedVenueObjects = [...updatedMap.venueObjects];
        updatedVenueObjects[index] = {
          ...updatedVenueObjects[index],
          x: newX,
          y: newY
        };
        updatedMap.venueObjects = updatedVenueObjects;
      }
      
      // Update state
      setProcessedSeatingMap(updatedMap);
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Notify parent of change after drag ends
      if (typeof setSeatingMap === 'function') {
        console.log('Drag complete - updating parent seatingMap');
        setSeatingMap(processedSeatingMap);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !draggedElement) return;
    
      e.preventDefault();
      e.stopPropagation();
    
    const coords = getSVGCoordinates(e);
    const newX = coords.x - dragOffset.x;
    const newY = coords.y - dragOffset.y;
    
    updateSeatingMapSafely(prev => {
      const updated = { ...prev };
      
      if (draggedElement.type === 'stage') {
        updated.stage = {
          ...updated.stage,
          x: newX,
          y: newY
        };
      } else if (draggedElement.type === 'section') {
        const sectionIndex = updated.sections.findIndex(
          s => s.id === draggedElement.id
        );
        
        if (sectionIndex !== -1) {
          updated.sections = updated.sections.map((section, idx) => {
            if (idx === sectionIndex) {
              return {
      ...section,
                x: newX,
                y: newY
              };
            }
            return section;
          });
        }
      } else if (draggedElement.type === 'venueObject') {
        const objectIndex = draggedElement.index !== undefined
          ? draggedElement.index
          : updated.venueObjects.findIndex(o => o.id === draggedElement.id);
        
        if (objectIndex !== -1 && updated.venueObjects[objectIndex]) {
          updated.venueObjects = updated.venueObjects.map((obj, idx) => {
            if (idx === objectIndex) {
              return {
                ...obj,
                x: newX,
                y: newY
              };
            }
            return obj;
          });
        }
    }
    
      return updated;
    });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedElement(null);
      
      // No need to call saveToHistory here as it's handled in updateSeatingMapSafely
    }
  };

  // Add global event listeners for mouse move and up
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedElement, dragOffset]);

  // Add new section
  const addSection = (e) => {
    // Only add section if in section mode
    if (editMode !== 'section') return;
    
    // Get SVG coordinates
    const coords = getSVGCoordinates(e);
    if (!coords) return;
    
    // Assign default ticket type if available
    let defaultTicketTypeId = '';
    if (ticketTypes.length > 0) {
      defaultTicketTypeId = ticketTypes[0]._id;
    }
    
    // Create unique ID for the section
    const sectionId = `section-${Date.now()}`;
    
    // New section with default properties
    const newSection = {
      id: sectionId,
      name: `Khu ${processedSeatingMap.sections ? processedSeatingMap.sections.length + 1 : 1}`,
      x: coords.x - 150, // Center at the click point
      y: coords.y - 75,
      width: 300,
      height: 150,
      rows: 5,
      seatsPerRow: 10,
      ticketTypeId: defaultTicketTypeId // Assign default ticket type
    };
    
    // Create new sections array
    const newSections = [...(processedSeatingMap.sections || []), newSection];
    
    // Update the seating map
    updateSeatingMapSafely(prevMap => ({
      ...prevMap,
      sections: newSections
    }));
    
    // Select the new section
    setSelectedElement({ type: 'section', id: sectionId, index: newSections.length - 1 });
    
    // Enter select mode after adding a section
    setEditMode('select');
    
    console.log('Added section:', newSection);
    
    // Notify user
    toast?.success?.('Đã thêm khu vực mới');
  };

  // Add venue object (entrances, exits, etc)
  const addVenueObject = (e, type) => {
    console.log('DEBUG: addVenueObject called with type:', type);
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    // Create new object with appropriate properties
    let newObject = {
      id: `venue-object-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 300,
      y: 300,
      width: 60,
      height: 60,
      type
    };
    
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
    
    console.log('DEBUG: Created new venue object:', newObject);
    
    // Create a deep copy of the current seatingMap
    const newMap = {
      layoutType: processedSeatingMap?.layoutType || 'theater',
      sections: Array.isArray(processedSeatingMap?.sections) 
        ? [...processedSeatingMap.sections] 
        : [],
      stage: processedSeatingMap?.stage || { x: 400, y: 50, width: 300, height: 60 },
      venueObjects: Array.isArray(processedSeatingMap?.venueObjects) 
        ? [...processedSeatingMap.venueObjects, newObject] 
        : [newObject]
    };
    
    // Update local state immediately
    setProcessedSeatingMap(newMap);
    
    // Select the new object
    setSelectedElement({...newObject, type: 'venueObject', index: newMap.venueObjects.length - 1});
    
    // Update parent component
      if (typeof setSeatingMap === 'function') {
      try {
        console.log('DEBUG: Updating parent component with new venue object');
        setSeatingMap(newMap);
      } catch (error) {
        console.error('DEBUG: Error updating parent:', error);
      }
      } else {
      console.error('DEBUG: setSeatingMap is not a function');
      }
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selectedElement) {
      console.log('DEBUG: Không có phần tử nào được chọn để xóa');
      return;
    }
    
    console.log('DEBUG: Xóa phần tử đã chọn:', selectedElement);
    
    // Create a clean copy with proper type checking
    const updatedMap = {
      layoutType: processedSeatingMap?.layoutType || 'theater',
      stage: processedSeatingMap?.stage || { x: 400, y: 50, width: 300, height: 60 },
      sections: Array.isArray(processedSeatingMap?.sections) ? [...processedSeatingMap.sections] : [],
      venueObjects: Array.isArray(processedSeatingMap?.venueObjects) ? [...processedSeatingMap.venueObjects] : []
    };
    
    if (selectedElement.type === 'section') {
      updatedMap.sections = updatedMap.sections.filter(s => s.id !== selectedElement.id);
      console.log('DEBUG: Đã xóa section, còn lại:', updatedMap.sections.length, 'sections');
    } else if (selectedElement.type === 'venueObject') {
      updatedMap.venueObjects = updatedMap.venueObjects.filter((obj) => obj.id !== selectedElement.id);
      console.log('DEBUG: Đã xóa venue object, còn lại:', updatedMap.venueObjects.length, 'venue objects');
    }
    
    console.log('DEBUG: Bản đồ sau khi xóa:', JSON.stringify({
      layoutType: updatedMap.layoutType,
      sections: updatedMap.sections.length,
      venueObjects: updatedMap.venueObjects.length
    }));
    
    // Cập nhật local state
    setProcessedSeatingMap(updatedMap);
    
    // Thông báo cho component cha ngay lập tức
      if (typeof setSeatingMap === 'function') {
      console.log('DEBUG: Gửi bản đồ đã cập nhật lên component cha');
      try {
        setSeatingMap(updatedMap);
        console.log('DEBUG: Successfully sent updated map to parent');
      } catch (error) {
        console.error('DEBUG: Error sending updated map to parent:', error);
      }
      } else {
      console.error('DEBUG: setSeatingMap is not a function', typeof setSeatingMap);
      }
    
    setSelectedElement(null);
  };

  // Handle canvas click for adding elements
  const handleCanvasClick = (e) => {
    console.log('DEBUG: Canvas clicked');
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Nếu ở chế độ "select", bỏ chọn phần tử
    if (editMode === 'select' || !editMode) {
      console.log('DEBUG: Deselecting element');
      setSelectedElement(null);
    }
  };
  
  // Render section
  const renderSection = (section, index) => {
    const isSelected = selectedElement?.type === 'section' && 
                     (selectedElement.id === section.id || selectedElement.index === index);
                     
    // Find ticket type for this section
    const ticketType = section.ticketTypeId ? 
      ticketTypes.find(t => t._id === section.ticketTypeId) : null;
    
    // Determine color based on ticket type or use default
    const sectionColor = ticketType?.color || '#3B82F6';
    
    return (
      <g 
        key={section.id || `section-${index}`}
        className={`section ${isSelected ? 'selected' : ''}`}
        transform={`translate(${section.x}, ${section.y})`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement({ type: 'section', id: section.id, index });
        }}
        data-type="section"
        data-id={section.id}
      >
        <rect
          width={section.width}
          height={section.height}
          fill={sectionColor}
          fillOpacity="0.2"
          stroke={isSelected ? '#ffffff' : sectionColor}
          strokeWidth={isSelected ? 2 : 1}
          rx={4}
        />
        
        <text
          x="10"
          y="20"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {section.name}
        </text>
        
        {ticketType && (
          <text
            x="10"
            y="40"
            fill="white"
            fontSize="12"
            style={{ pointerEvents: 'none' }}
          >
            {ticketType.name} - {ticketType.price.toLocaleString('vi-VN')}đ
          </text>
        )}
        
        {isSelected && (
          <>
            <circle cx="0" cy="0" r="5" fill="white" />
            <circle cx={section.width} cy="0" r="5" fill="white" />
            <circle cx="0" cy={section.height} r="5" fill="white" />
            <circle cx={section.width} cy={section.height} r="5" fill="white" />
          </>
        )}
      </g>
    );
  };

  // Render venue object
  const renderVenueObject = (object, index) => {
    const isSelected = selectedElement?.type === 'venueObject' && 
                      (selectedElement.index === index || selectedElement.id === object.id);
    
    return (
      <g 
        key={object.id || `venue-object-${index}`}
        transform={`translate(${object.x}, ${object.y})`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement({ ...object, type: 'venueObject', index });
        }}
        onMouseDown={(e) => handleMouseDown(e, object, 'venueObject', index)}
        style={{ cursor: editMode === 'select' ? 'move' : 'pointer' }}
      >
        <rect
          width={object.width}
          height={object.height}
          fill={object.color}
          stroke={isSelected ? 'white' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
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
    );
  };

  // Section attributes panel
const SectionAttributesPanel = ({ selectedSection, ticketTypes, onUpdate }) => {
  if (!selectedSection) {
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3">Thuộc tính khu vực</h3>
        <p className="text-gray-300">Chọn một khu vực để chỉnh sửa thuộc tính</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['width', 'height', 'x', 'y', 'rows', 'seatsPerRow'];
    const processedValue = numericFields.includes(name) ? Number(value) : value;
    
    onUpdate({ ...selectedSection, [name]: processedValue });
  };

  // Custom inline styles to guarantee proper display
  const inputStyle = {
    backgroundColor: '#374151',
    color: 'white',
    border: '1px solid #4B5563',
    padding: '6px 10px',
    borderRadius: '4px',
    width: '100%',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'auto', // Ensure dropdown arrow appears
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-3">Khu vực {selectedSection.name}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Tên:</label>
          <input
            type="text"
            name="name"
            value={selectedSection.name || ''}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Chiều rộng:</label>
          <input
            type="number"
            name="width"
            value={selectedSection.width || 0}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Chiều cao:</label>
          <input
            type="number"
            name="height"
            value={selectedSection.height || 0}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">X:</label>
          <input
            type="number"
            name="x"
            value={selectedSection.x || 0}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Y:</label>
          <input
            type="number"
            name="y"
            value={selectedSection.y || 0}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Số hàng:</label>
          <input
            type="number"
            name="rows"
            min="1"
            max="20"
            value={selectedSection.rows || 5}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Ghế mỗi hàng:</label>
          <input
            type="number"
            name="seatsPerRow"
            min="1" 
            max="30"
            value={selectedSection.seatsPerRow || 10}
            onChange={handleChange}
            className="seating-designer-input"
            style={inputStyle}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Loại vé:</label>
          <select
            name="ticketTypeId"
            value={selectedSection.ticketTypeId || ''}
            onChange={handleChange}
            className="seating-designer-select"
            style={selectStyle}
          >
            <option value="">-- Chọn loại vé --</option>
            {ticketTypes.map(ticket => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.name} - {ticket.price.toLocaleString('vi-VN')}đ
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

  // Update the selected section with new attributes
  const updateSelectedSection = (updatedSection) => {
    if (!selectedElement || selectedElement.type !== 'section') return;
    
    updateSeatingMapSafely(prevMap => ({
      ...prevMap,
      sections: prevMap.sections.map((section, idx) => 
        section.id === selectedElement.id ? { ...section, ...updatedSection } : section
      )
    }));
    
    console.log('Updated section:', updatedSection);
  };

  // Render right sidebar based on selected element
  const renderSidebar = () => {
    if (selectedElement && selectedElement.type === 'section') {
      // Find the actual section object
      const section = processedSeatingMap.sections?.find(s => s.id === selectedElement.id);
      if (!section) return null;
      
      return (
        <div className="sidebar bg-gray-800 p-4 rounded-lg">
          <SectionAttributesPanel 
            selectedSection={section} 
            ticketTypes={ticketTypes} 
            onUpdate={updateSelectedSection} 
          />
        </div>
      );
    }
    
    return (
      <div className="sidebar bg-gray-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3">Chọn một đối tượng</h3>
        <p>Nhấp vào một khu vực hoặc đối tượng để chỉnh sửa thuộc tính.</p>
      </div>
    );
  };

  return (
    <EventBlocker>
      <div className="interactive-seating-designer bg-gray-100 rounded-lg p-4" style={{ height }}>
        <div className="tools flex justify-between mb-4 px-2">
          <div className="tool-group flex space-x-2">
            <button
              className={`tool-button ${editMode === 'select' ? 'active' : ''}`}
              onClick={(e) => blockEvent(e, () => setEditMode('select'))}
            >
              <FaMagic /> Select
            </button>
            <button
              className={`tool-button ${editMode === 'section' ? 'active' : ''}`}
              onClick={(e) => blockEvent(e, () => setEditMode('section'))}
            >
              <FaColumns /> Section
            </button>
            <button
              className={`tool-button ${editMode === 'venue-object' ? 'active' : ''}`}
              onClick={(e) => blockEvent(e, () => setEditMode('venue-object'))}
            >
              <FaDoorOpen /> Object
            </button>
          </div>
          
          <div className="action-group flex space-x-2">
            <button
              className="tool-button"
              onClick={(e) => blockEvent(e, undo)}
              disabled={historyIndex <= 0}
            >
              <FaUndo /> Undo
            </button>
            <button
              className="tool-button"
              onClick={(e) => blockEvent(e, redo)}
              disabled={historyIndex >= history.length - 1}
            >
              <FaRedo /> Redo
            </button>
            <button
              className="tool-button delete"
              onClick={(e) => blockEvent(e, deleteSelectedElement)}
              disabled={!selectedElement}
            >
              <FaTrash /> Delete
            </button>
            <button
              className="tool-button"
              onClick={(e) => blockEvent(e, zoomToFit)}
            >
              <FaSearchPlus /> Fit
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap -mx-2">
          <div className="w-full lg:w-3/4 px-2 mb-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{ height: height - 120 }}>
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                className="svg-canvas"
                onClick={(e) => {
                  if (editMode === 'section') {
                    addSection(e);
                  } else {
                    handleCanvasClick(e);
                  }
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* Stage */}
                {processedSeatingMap?.stage && (
                  <g className="stage">
                    <rect
                      x={processedSeatingMap.stage.x}
                      y={processedSeatingMap.stage.y}
                      width={processedSeatingMap.stage.width}
                      height={processedSeatingMap.stage.height}
                      fill="#374151"
                      stroke="#ffffff"
                      strokeWidth={2}
                      rx={8}
                    />
                    <text
                      x={processedSeatingMap.stage.x + processedSeatingMap.stage.width / 2}
                      y={processedSeatingMap.stage.y + processedSeatingMap.stage.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={16}
                      fontWeight="bold"
                    >
                      SÂN KHẤU
                    </text>
                  </g>
                )}
                
                {/* Sections */}
                {processedSeatingMap?.sections?.map((section, index) => renderSection(section, index))}
                
                {/* Venue Objects */}
                {processedSeatingMap?.venueObjects?.map((object, index) => renderVenueObject(object, index))}
              </svg>
              
              {/* Debug Info */}
              <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs p-1 m-1 rounded">
                <div>Edit Mode: {editMode}</div>
                <div>Selected: {selectedElement ? `${selectedElement.type} (${selectedElement.id})` : 'none'}</div>
                <div>Sections: {processedSeatingMap?.sections?.length || 0}</div>
                <div>Objects: {processedSeatingMap?.venueObjects?.length || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/4 px-2">
            {renderSidebar()}
          </div>
        </div>
      </div>
    </EventBlocker>
  );
};

export default InteractiveSeatingDesigner;