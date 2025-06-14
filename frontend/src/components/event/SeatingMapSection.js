import React from 'react';

const SeatingMapSection = ({ section, index, handleSeatingMapSectionChange, handleRemoveSeatingMapSection }) => {
  return (
    <div className="flex items-end space-x-4 bg-gray-700 p-4 rounded-lg">
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`sectionName-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Tên khu vực</label>
        <input
          type="text"
          id={`sectionName-${index}`}
          name="name"
          value={section.name}
          onChange={(e) => handleSeatingMapSectionChange(index, e)}
          placeholder="Ví dụ: VIP, Thường, Hàng A"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`price-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Giá (VND)</label>
        <input
          type="number"
          id={`price-${index}`}
          name="price"
          value={section.price}
          onChange={(e) => handleSeatingMapSectionChange(index, e)}
          placeholder="Giá (VND)"
          min="0"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`totalSeats-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Tổng số ghế</label>
        <input
          type="number"
          id={`totalSeats-${index}`}
          name="totalSeats"
          value={section.totalSeats}
          onChange={(e) => handleSeatingMapSectionChange(index, e)}
          placeholder="Tổng số ghế"
          min="1"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label className="block text-sm font-medium text-gray-300 mb-1">Ghế trống</label>
        <span className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 text-center">{section.availableSeats}</span>
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label className="block text-sm font-medium text-gray-300 mb-1 invisible">Xóa</label>
        <button
          type="button"
          onClick={() => handleRemoveSeatingMapSection(index)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 w-full"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default SeatingMapSection; 