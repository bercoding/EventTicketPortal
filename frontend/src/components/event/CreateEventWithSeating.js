// Import React and related dependencies
import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaPlus, FaMinus, FaSync, FaTrash, FaPen } from 'react-icons/fa';
import { toast } from 'react-toastify';
import FormSection from './FormSection';
import '../seating/BasicSeatingDesigner.css';
import './CreateEvent.css';

// Component for section attributes panel
const SectionAttributesPanel = ({ section, ticketTypes, onUpdate }) => {
  if (!section) return null;
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    const numericFields = ['width', 'height', 'x', 'y', 'rows', 'seatsPerRow'];
    const processedValue = numericFields.includes(name) 
      ? (value === '' ? '' : Number(value)) 
      : value;
      
    onUpdate({ ...section, [name]: processedValue });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Tên:</label>
        <input
          type="text"
          name="name"
          value={section.name}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Chiều rộng:</label>
        <input
          type="number"
          name="width"
          value={section.width}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Chiều cao:</label>
        <input
          type="number"
          name="height"
          value={section.height}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">X:</label>
        <input
          type="number"
          name="x"
          value={section.x}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Y:</label>
        <input
          type="number"
          name="y"
          value={section.y}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Số hàng:</label>
        <input
          type="number"
          name="rows"
          min="1"
          max="20"
          value={section.rows}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Ghế mỗi hàng:</label>
        <input
          type="number"
          name="seatsPerRow"
          min="1"
          max="30"
          value={section.seatsPerRow}
          onChange={handleChange}
          className="seating-designer-input"
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Loại vé:</label>
        <select
          name="ticketTypeId"
          value={section.ticketTypeId || ''}
          onChange={handleChange}
          className="seating-designer-select"
        >
          <option value="">-- Chọn loại vé --</option>
          {ticketTypes.map(ticket => (
            <option key={ticket._id} value={ticket._id}>
              {ticket.name} - {ticket.price.toLocaleString('vi-VN')}đ
            </option>
          ))}
        </select>
      </div>
      
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
        onClick={() => onUpdate(section)}
      >
        Áp dụng thay đổi
      </button>
    </div>
  );
};

const CreateEventWithSeating = ({ formData, onChange, ticketTypes = [] }) => {
  // State for seating map
  const [seatingMap, setSeatingMap] = useState({
    sections: [],
    stage: { x: 400, y: 80, width: 400, height: 100 },
    venueObjects: []
  });
  
  // State for the currently selected element
  const [selectedElement, setSelectedElement] = useState(null);
  
  // State for editing a section's attributes
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionAttributes, setSectionAttributes] = useState({
    name: '',
    width: 300,
    height: 150,
    x: 0,
    y: 0,
    rows: 5,
    seatsPerRow: 10,
    ticketTypeId: ''
  });

  // Reference for the SVG container
  const svgRef = useRef(null);
  
  // SVG viewport dimensions
  const SVG_WIDTH = 1200;
  const SVG_HEIGHT = 800;

  // Initialize seating map from form data if available
  useEffect(() => {
    if (formData.seatingMap) {
      try {
        let map = typeof formData.seatingMap === 'string' 
          ? JSON.parse(formData.seatingMap) 
          : formData.seatingMap;
        
        setSeatingMap(map);
      } catch (error) {
        console.error('Error parsing seating map:', error);
      }
    }
  }, [formData.seatingMap]);

  // Update the form data when seating map changes
  useEffect(() => {
    onChange({
      target: {
        name: 'seatingMap',
        value: seatingMap
      }
    });
  }, [seatingMap, onChange]);

  // Handle click on the SVG to add new sections
  const handleSvgClick = (e) => {
    if (selectedElement !== 'section') return;
    
    // Get the click coordinates relative to the SVG
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    // Create a new section
    const newSectionId = `section-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      name: `Khu ${seatingMap.sections.length + 1}`,
      x: Math.round(svgPoint.x - 150), // Center the section at the click point
      y: Math.round(svgPoint.y - 75),
      width: 300,
      height: 150,
      rows: 5,
      seatsPerRow: 10,
      ticketTypeId: ticketTypes.length > 0 ? ticketTypes[0]._id : ''
    };
    
    // Add the new section to the seating map
    setSeatingMap(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    // Select this section for editing
    setEditingSectionId(newSectionId);
    setSectionAttributes({
      name: newSection.name,
      width: newSection.width,
      height: newSection.height,
      x: newSection.x,
      y: newSection.y,
      rows: newSection.rows,
      seatsPerRow: newSection.seatsPerRow,
      ticketTypeId: newSection.ticketTypeId
    });
    
    // Toast notification
    toast.success('Đã thêm khu vực mới!');
  };

  // Handle changes to section attributes
  const handleAttributeChange = (e) => {
    const { name, value } = e.target;
    
    // Validate numeric inputs
    if (['width', 'height', 'x', 'y', 'rows', 'seatsPerRow'].includes(name)) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;
      
      setSectionAttributes(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setSectionAttributes(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Apply section attribute changes
  const applyAttributeChanges = () => {
    if (!editingSectionId) return;
    
    setSeatingMap(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === editingSectionId
          ? { ...section, ...sectionAttributes }
          : section
      )
    }));
    
    toast.success('Đã cập nhật thuộc tính khu vực!');
  };

  // Handle section click
  const handleSectionClick = (section, e) => {
    e.stopPropagation();
    
    // Select this section for editing
    setEditingSectionId(section.id);
    setSectionAttributes({
      name: section.name,
      width: section.width,
      height: section.height,
      x: section.x,
      y: section.y,
      rows: section.rows || 5,
      seatsPerRow: section.seatsPerRow || 10,
      ticketTypeId: section.ticketTypeId || ''
    });
  };

  // Delete a section
  const handleDeleteSection = (sectionId, e) => {
    e.stopPropagation();
    
    setSeatingMap(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    if (editingSectionId === sectionId) {
      setEditingSectionId(null);
      setSectionAttributes({
        name: '',
        width: 300,
        height: 150,
        x: 0,
        y: 0,
        rows: 5,
        seatsPerRow: 10,
        ticketTypeId: ''
      });
    }
    
    toast.info('Đã xóa khu vực!');
  };

  // Render the stage
  const renderStage = () => {
    const { stage } = seatingMap;
    
    return (
      <g className="stage">
        <rect
          x={stage.x}
          y={stage.y}
          width={stage.width}
          height={stage.height}
          fill="#374151"
          stroke="#FFFFFF"
          strokeWidth={3}
          rx={8}
        />
        <text
          x={stage.x + stage.width / 2}
          y={stage.y + stage.height / 2}
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

  // Render the sections
  const renderSections = () => {
    return seatingMap.sections.map(section => {
      // Find ticket type for this section
      const ticketType = ticketTypes.find(tt => tt._id === section.ticketTypeId);
      const sectionColor = ticketType?.color || '#3B82F6';
      
      return (
        <g 
          key={section.id} 
          className={`section ${editingSectionId === section.id ? 'selected' : ''}`}
          onClick={(e) => handleSectionClick(section, e)}
        >
          {/* Section background */}
          <rect
            x={section.x}
            y={section.y}
            width={section.width}
            height={section.height}
            fill={`${sectionColor}20`}
            stroke={sectionColor}
            strokeWidth={editingSectionId === section.id ? 3 : 2}
            strokeDasharray={editingSectionId === section.id ? "5,3" : "none"}
            rx={8}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Section name */}
          <text
            x={section.x + section.width / 2}
            y={section.y + section.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={18}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {section.name}
            {ticketType ? ` (${ticketType.name})` : ''}
          </text>
          
          {/* Delete button */}
          <g
            className="delete-button"
            onClick={(e) => handleDeleteSection(section.id, e)}
            style={{ cursor: 'pointer' }}
            transform={`translate(${section.x + section.width - 25}, ${section.y + 25})`}
          >
            <circle
              r={15}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
            <FaTrash
              color="#FFFFFF"
              size={12}
              style={{ 
                transform: 'translate(-6px, -6px)'
              }}
            />
          </g>
          
          {/* Edit icon */}
          <g
            className="edit-button"
            style={{ cursor: 'pointer' }}
            transform={`translate(${section.x + 25}, ${section.y + 25})`}
          >
            <circle
              r={15}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
            <FaPen
              color="#FFFFFF"
              size={12}
              style={{ 
                transform: 'translate(-6px, -6px)'
              }}
            />
          </g>
        </g>
      );
    });
  };

  // Render the venue objects
  const renderVenueObjects = () => {
    const { venueObjects } = seatingMap;
    
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
          // Get color based on type
          const color = object.color || defaultColors[object.type] || defaultColors.default;
          
          return (
            <g 
              key={`venue-object-${index}`} 
              className={`venue-object ${object.type}`}
            >
              {/* Background */}
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
              
              {/* Label */}
              <text
                x={object.x + (object.width || 60) / 2}
                y={object.y + (object.height || 40) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontSize={14}
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

  // Controls for the TransformWrapper
  const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
    <div className="absolute left-2 top-2 z-10 bg-gray-800/60 text-white p-2 flex space-x-1 rounded">
      <button
        onClick={(e) => { e.preventDefault(); zoomIn(); }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaPlus size={14} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); zoomOut(); }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaMinus size={14} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); resetTransform(); }}
        className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
      >
        <FaSync size={14} />
      </button>
    </div>
  );

  return (
    <div className="bg-gray-100 rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Thiết kế sơ đồ chỗ ngồi</h2>
      
      {/* Tool selection */}
      <div className="mb-4 flex space-x-2">
        <button
          className={`tool-button ${selectedElement === 'section' ? 'active' : ''}`}
          onClick={() => setSelectedElement('section')}
        >
          <FaPlus className="inline mr-1" /> Khu vực
        </button>
        <button
          className={`tool-button ${selectedElement === null ? 'active' : ''}`}
          onClick={() => setSelectedElement(null)}
        >
          Hủy
        </button>
        {/* Additional tools can be added here */}
      </div>
      
      <div className="flex flex-wrap">
        {/* Left: SVG Editor */}
        <div className="w-full lg:w-2/3 mb-4 lg:mb-0 lg:pr-4">
          <div className="h-[600px] bg-gray-900 rounded-lg overflow-hidden relative">
            <TransformWrapper
              initialScale={0.8}
              minScale={0.5}
              maxScale={2}
              defaultPositionX={0}
              defaultPositionY={0}
              centerOnInit={true}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <Controls zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} />
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                    <svg 
                      ref={svgRef}
                      width={SVG_WIDTH} 
                      height={SVG_HEIGHT} 
                      style={{ background: '#1a202c' }}
                      onClick={handleSvgClick}
                    >
                      {renderStage()}
                      {renderSections()}
                      {renderVenueObjects()}
                    </svg>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>
              <strong>Hướng dẫn:</strong> Click chọn công cụ "Khu vực" và click vào vị trí trên sơ đồ để thêm khu vực ghế mới.
              Click vào khu vực để chỉnh sửa các thuộc tính.
            </p>
          </div>
        </div>
        
        {/* Right: Section Attributes */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-800 text-white p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-3">
              {editingSectionId ? 'Chỉnh sửa khu vực' : 'Thuộc tính khu vực'}
            </h3>
            
            {editingSectionId ? (
              <SectionAttributesPanel 
                section={sectionAttributes}
                ticketTypes={ticketTypes}
                onUpdate={applyAttributeChanges}
              />
            ) : (
              <p className="text-gray-300">
                Chọn một khu vực để chỉnh sửa thuộc tính
              </p>
            )}
          </div>
          
          {/* Debugging info */}
          <div className="mt-4 bg-gray-700 text-white p-4 rounded-lg">
            <h3 className="text-sm font-bold mb-1 uppercase tracking-wide">DEBUG INFO</h3>
            <p className="text-xs">Sections: {seatingMap.sections.length}</p>
            <p className="text-xs">Objects: {seatingMap.venueObjects?.length || 0}</p>
            <p className="text-xs">Layout: theater</p>
            <p className="text-xs">Mode: {selectedElement || 'select'}</p>
            <p className="text-xs">Selected: {editingSectionId ? `section (${editingSectionId})` : 'none'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventWithSeating; 