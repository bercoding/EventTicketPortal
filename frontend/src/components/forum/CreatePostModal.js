import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaGlobe, FaUsers } from 'react-icons/fa';

const CreatePostModal = ({
  open,
  onClose,
  onSubmit,
  user,
  formData,
  setFormData,
  imagePreview,
  setImagePreview,
  isCreating,
  error
}) => {
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('Không thể tải lên quá 10 hình ảnh');
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const removeImage = (index) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    const newFiles = Array.from(formData.images).filter((_, i) => i !== index);
    
    setImagePreview(newPreviews);
    setFormData(prev => ({ ...prev, images: newFiles }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          >
        {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tạo bài viết mới
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
            onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-400 text-xl" />
              </motion.button>
        </div>

            {/* User Info */}
            <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-0.5">
                <img 
                  src={user?.avatar || "https://via.placeholder.com/48"} 
                  alt="avatar" 
                  className="w-full h-full rounded-full object-cover bg-white" 
                />
              </div>
          <div>
                <div className="font-semibold text-gray-900">
                  {user?.fullName || user?.username || 'Người dùng'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaGlobe className="text-green-500" />
                  <span>Đăng công khai</span>
            </div>
          </div>
        </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">!</span>
                </div>
                {error}
              </motion.div>
            )}

        {/* Form */}
            <form onSubmit={onSubmit} className="px-6 pb-6">
              <div className="space-y-4 mt-4">
                {/* Title Input */}
          <input
            type="text"
                  placeholder="Tiêu đề bài viết (tùy chọn)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium transition-all duration-300"
          />

                {/* Content Textarea */}
          <textarea
                  placeholder={`${user?.fullName || user?.username || 'Bạn'} ơi, bạn đang nghĩ gì?`}
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[120px] resize-none transition-all duration-300"
                  rows={4}
          />

                {/* Tags Input */}
                <input
                  type="text"
                  placeholder="Thẻ (phân tách bằng dấu phẩy) - VD: du lịch, ẩm thực, công nghệ"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors">
                    <FaImage />
                    <span className="font-medium">Thêm hình ảnh</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Image Previews */}
            {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagePreview.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                      type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                            ×
                          </motion.button>
                        </motion.div>
                ))}
              </div>
            )}
          </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {formData.content.length}/2000 ký tự
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
              type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    disabled={isCreating}
                  >
                    Hủy
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isCreating || !formData.content.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Đang đăng...</span>
                      </div>
                    ) : (
                      'Đăng bài'
                    )}
                  </motion.button>
      </div>
    </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal; 