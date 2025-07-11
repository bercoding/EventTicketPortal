import React, { useState } from 'react';
import { 
  FaDoorOpen, FaDoorClosed, FaToilet, FaHamburger,
  FaTable, FaChair, FaVideo, FaVolumeUp, FaMicrophone,
  FaLightbulb, FaSeedling, FaSquare, FaPlus
} from 'react-icons/fa';
import venueObjectTypes from './venueObjectTypes';
import './ObjectToolbar.css';

const iconMap = {
  FaDoorOpen: FaDoorOpen,
  FaDoorClosed: FaDoorClosed,
  FaToilet: FaToilet,
  FaHamburger: FaHamburger,
  FaTable: FaTable,
  FaChair: FaChair,
  FaVideo: FaVideo,
  FaVolumeUp: FaVolumeUp,
  FaMicrophone: FaMicrophone,
  FaLightbulb: FaLightbulb,
  FaSeedling: FaSeedling,
  FaSquare: FaSquare
};

const ObjectToolbar = ({ onAddObject }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllObjects, setShowAllObjects] = useState(false);

  // Hiển thị các đối tượng phổ biến nhất
  const popularObjects = venueObjectTypes.slice(0, 4);
  
  // Hiển thị tất cả các đối tượng khi mở rộng
  const allObjects = showAllObjects ? venueObjectTypes : popularObjects;

  const handleAddObject = (objectType) => {
    if (onAddObject) {
      onAddObject(objectType);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setShowAllObjects(true);
    }
  };

  return (
    <div className={`object-toolbar ${expanded ? 'expanded' : ''}`}>
      <div className="object-toolbar-header" onClick={toggleExpand}>
        <span>Thêm vật thể</span>
        <FaPlus className={`expand-icon ${expanded ? 'expanded' : ''}`} />
      </div>
      
      {(expanded || !expanded) && (
        <div className="object-buttons">
          {allObjects.map((objectType) => {
            const Icon = iconMap[objectType.icon];
            return (
              <button
                key={objectType.id}
                className="object-button"
                onClick={() => handleAddObject(objectType)}
                title={objectType.name}
                style={{ color: objectType.color }}
              >
                {Icon && <Icon />}
                <span className="object-label">{objectType.name}</span>
              </button>
            );
          })}
          
          {!showAllObjects && (
            <button
              className="object-button more-button"
              onClick={() => setShowAllObjects(true)}
            >
              <FaPlus />
              <span className="object-label">Thêm...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectToolbar; 