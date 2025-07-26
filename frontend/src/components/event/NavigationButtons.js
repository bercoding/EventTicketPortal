import React from 'react';

const NavigationButtons = ({ currentStep, totalSteps = 4, onPrevStep, onNextStep, onSubmit, finalButtonText, loading }) => {
  // Handler để đảm bảo rằng sự kiện không lan truyền
  const handleButtonClick = (e, handler) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Ngăn chặn sự kiện lan truyền triệt để
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
      
      // Đảm bảo chỉ gọi handler nếu nó là một function
      if (typeof handler === 'function') {
        // Sử dụng setTimeout để tránh việc gọi handler đồng bộ
        setTimeout(() => {
          handler(e);
        }, 10);
      }
    }
  };

  return (
    <div 
      className="navigation-buttons"
      onClick={(e) => e.stopPropagation()}
    >
      {currentStep > 1 && (
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, onPrevStep)}
          className="prev-button"
        >
          ← Quay lại
        </button>
      )}
      
      <button
        type="button"
        onClick={(e) => handleButtonClick(e, currentStep === totalSteps ? onSubmit : onNextStep)}
        disabled={loading}
        className={`next-button ${currentStep === totalSteps ? 'submit-button' : ''}`}
      >
        {loading ? (
          <span>Đang xử lý...</span>
        ) : (
          <span>{currentStep === totalSteps ? finalButtonText || 'Hoàn tất' : 'Tiếp tục →'}</span>
        )}
      </button>
    </div>
  );
};

export default NavigationButtons; 