import React from 'react';

const ImageUpload = ({ label, imageUrl, onChange }) => {
  return (
    <div className="image-upload-container">
      <p className="image-upload-label">{label}</p>
      <div className="image-upload-area">
        {imageUrl ? (
          <div className="image-preview">
            <img src={imageUrl} alt={label} />
          </div>
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">📷</span>
            <span className="upload-text">Chọn ảnh</span>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="file-input" 
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default ImageUpload; 