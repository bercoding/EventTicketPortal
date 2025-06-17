import React from 'react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Thông tin sự kiện' },
    { number: 2, label: 'Thời gian & Loại vé' },
    { number: 3, label: 'Cài đặt' },
    { number: 4, label: 'Thông tin thanh toán' }
  ];

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-10 flex flex-col md:flex-row justify-between items-center border border-gray-700">
      <div className="flex flex-wrap justify-center md:justify-start space-x-6 text-lg font-semibold">
        {steps.map(step => (
          <span 
            key={step.number}
            className={`flex items-center transition-colors duration-200 ${
              currentStep === step.number ? 'text-green-400' : 'text-gray-400'
            }`}
          >
            <span 
              className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                currentStep === step.number 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {step.number}
            </span>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar; 