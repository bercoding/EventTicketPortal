import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';

const NavigationButtons = ({ currentStep, onPrevStep, onNextStep, onSubmit, loading }) => {
  return (
    <div className="flex justify-end space-x-4 pt-8 border-t border-gray-700">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrevStep}
          className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center shadow-lg"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="mr-2" /> Quay lại
        </button>
      )}
      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNextStep}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center shadow-lg"
        >
          Tiếp tục <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
        </button>
      ) : (
        <button
          type="submit"
          onClick={onSubmit}
          disabled={loading}
          className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center shadow-lg"
        >
          {loading ? 'Đang tạo...' : <><FontAwesomeIcon icon={faPlus} className="mr-2" /> Tạo sự kiện</>}
        </button>
      )}
    </div>
  );
};

export default NavigationButtons; 