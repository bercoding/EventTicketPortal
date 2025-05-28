import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ImageViewer = ({ images, currentImage, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(images?.indexOf(currentImage) || 0);

  useEffect(() => {
    if (images) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!images) return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, onClose]);

  if (!images || images.length === 0) return null;

  const handlePrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      {images && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-50 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all duration-200 transform hover:scale-110"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main content */}
          <div className="h-full w-full flex items-center justify-center p-4">
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-50 p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all duration-200 transform hover:scale-110"
                  onClick={handlePrevious}
                >
                  <FaChevronLeft className="h-8 w-8" />
                </button>
                <button
                  className="absolute right-4 z-50 p-4 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-all duration-200 transform hover:scale-110"
                  onClick={handleNext}
                >
                  <FaChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative h-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  src={images[currentIndex]}
                  alt="Enlarged view"
                  className="max-h-full w-auto max-w-[90vw] object-contain select-none"
                  draggable="false"
                />
              </AnimatePresence>
            </motion.div>

            {/* Image counter and indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4 z-50">
                <div className="bg-black bg-opacity-50 px-4 py-2 rounded-full text-white text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
                <div className="flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-white w-4' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImageViewer; 