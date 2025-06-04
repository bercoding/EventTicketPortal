import React, { useRef } from 'react';
import { FaTimes, FaRegImage, FaUserTag } from 'react-icons/fa';

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
  const fileInputRef = useRef();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl relative animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">Tạo bài viết</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        {/* User info */}
        <div className="flex items-center gap-3 px-6 py-4">
          <img src={user?.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="w-11 h-11 rounded-full object-cover border" />
          <div>
            <div className="font-semibold text-gray-900">{user?.fullName || user?.username || 'User'}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
              <span className="font-medium">{formData.visibility === 'private' ? 'Riêng tư' : 'Công khai'}</span>
            </div>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
          <input
            type="text"
            placeholder="Tiêu đề"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
          <textarea
            placeholder={`Bạn đang nghĩ gì, ${user?.fullName || user?.username || ''}?`}
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[80px] resize-none"
          />
          {/* Image preview */}
          <div className="space-y-2">
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="object-contain max-h-60 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPreviews = imagePreview.filter((_, i) => i !== index);
                        const newFiles = Array.from(formData.images).filter((_, i) => i !== index);
                        setImagePreview(newPreviews);
                        setFormData(prev => ({ ...prev, images: newFiles }));
                      }}
                      className="absolute top-2 right-2 bg-white border border-gray-300 text-gray-600 rounded-full p-1 hover:bg-red-500 hover:text-white transition"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Add to your post */}
          <div className="flex items-center gap-3 border rounded-lg px-4 py-2 bg-gray-50">
            <span className="text-gray-500 font-medium">Thêm vào bài viết</span>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              title="Add images"
            >
              <FaRegImage size={20} />
            </button>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files);
                if (files.length > 10) return;
                const previews = files.map(file => URL.createObjectURL(file));
                setImagePreview(previews);
                setFormData(prev => ({ ...prev, images: files }));
              }}
            />
            <input
              type="text"
              placeholder="Thẻ (phân tách bằng dấu phẩy)"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="ml-2 flex-1 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <FaUserTag className="text-gray-400 ml-1" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={isCreating || !formData.content.trim()}
            className="w-full py-2 mt-2 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Đang đăng...' : 'Đăng bài viết'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal; 