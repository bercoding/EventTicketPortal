import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const FormSection = ({ title, icon, children }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
        <FontAwesomeIcon icon={icon} className="mr-3" /> {title}
      </h2>
      {children}
    </div>
  );
};

export default FormSection; 