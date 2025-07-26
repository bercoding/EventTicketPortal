import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaGlobe, FaUsers } from 'react-icons/fa';

// CreatePostModal: Modal tao bai viet moi
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
  // xu ly chon anh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('Khong the tai len qua 10 hinh anh');
      return;
    }
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setFormData(prev => ({ ...prev, images: files }));
  };

  // xoa anh khoi preview
  const removeImage = (index) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    const newFiles = Array.from(formData.images).filter((_, i) => i !== index);
    setImagePreview(newPreviews);
    setFormData(prev => ({ ...prev, images: newFiles }));
  };

  // render UI
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
          >
        {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tao bai viet moi
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

            {/* Thong tin user */}
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
                  {user?.fullName || user?.username || 'Nguoi dung'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaGlobe className="text-green-500" />
                  <span>Dang cong khai</span>
            </div>
          </div>
        </div>

            {/* Thong bao loi */}
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

        {/* Form nhap lieu */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={onSubmit} className="space-y-4 mt-4" id="create-post-form">
                {/* Tieu de */}
          <input
            type="text"
            placeholder="Tieu de bai viet (tuy chon)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium transition-all duration-300"
          />

                {/* Noi dung */}
          <textarea
            placeholder={`${user?.fullName || user?.username || 'Ban'} oi, ban dang nghi gi?`}
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[120px] resize-none transition-all duration-300"
            rows={4}
          />

                {/* Tag */}
                <input
                  type="text"
                  placeholder="The (phan tach bang dau phay) - VD: du lich, am thuc, cong nghe"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />

                {/* Upload anh */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors">
                    <FaImage />
                    <span className="font-medium">Them hinh anh</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Preview anh */}
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
            </form>
        </div>

        {/* Footer: nut dang va huy */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100 px-6 pb-6">
          <div className="text-sm text-gray-500">
            {formData.content.length}/2000 ky tu
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
              Huy
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              form="create-post-form"
              disabled={isCreating || !formData.content.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Dang dang...</span>
                </div>
              ) : (
                'Dang bai'
              )}
            </motion.button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal; 