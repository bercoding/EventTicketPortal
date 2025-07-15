import React from 'react';

const FormSection = ({ title, children }) => {
  return (
    <div className="form-section">
      <h3 className="form-section-title">{title}</h3>
      <div className="form-section-content">
        {children}
      </div>
    </div>
  );
};

export default FormSection; 