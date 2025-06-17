import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

const ImageUpload = ({ image, handleImageUpload, type, title, description, aspectRatio }) => {
  return (
    <div className="relative bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl p-6 text-center text-gray-400 h-80 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:text-green-300 transition-all duration-200">
      {image ? (
        <img src={image} alt={title} className="max-h-full max-w-full object-contain rounded-lg shadow-md" />
      ) : (
        <>
          <FontAwesomeIcon icon={faUpload} size="3x" className="mb-4 text-green-500" />
          <p className="text-lg font-medium">{title}</p>
          <p className="text-sm mt-1">{description}</p>
        </>
      )}
      <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={(e) => handleImageUpload(e, type)} 
      />
    </div>
  );
};

export default ImageUpload; 