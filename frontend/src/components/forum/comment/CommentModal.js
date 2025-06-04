import React from 'react';

const CommentModal = ({ open, onClose, onConfirm, isSubmitting }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
        <h2 className="text-lg font-bold text-center mb-2">Xóa bình luận ?</h2>
        <p className="text-gray-700 text-center mb-6">Bạn có chắc chắn muốn xóa bình luận này?</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="text-blue-600 font-semibold px-4 py-2 rounded hover:underline">Không</button>
          <button onClick={onConfirm} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 transition" disabled={isSubmitting}>Có</button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal; 