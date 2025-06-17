import React from 'react';

const TicketType = ({ ticket, index, handleTicketTypeChange, handleRemoveTicketType }) => {
  return (
    <div className="flex items-end space-x-4 bg-gray-700 p-4 rounded-lg">
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`ticketName-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Tên loại vé</label>
        <input
          type="text"
          id={`ticketName-${index}`}
          name="name"
          value={ticket.name}
          onChange={(e) => handleTicketTypeChange(index, e)}
          placeholder="Ví dụ: Vé VIP, Vé thường, Vé trẻ em"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`ticketPrice-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Giá (VND)</label>
        <input
          type="number"
          id={`ticketPrice-${index}`}
          name="price"
          value={ticket.price}
          onChange={(e) => handleTicketTypeChange(index, e)}
          placeholder="Giá (VND)"
          min="0"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label htmlFor={`totalQuantity-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Tổng số lượng</label>
        <input
          type="number"
          id={`totalQuantity-${index}`}
          name="totalQuantity"
          value={ticket.totalQuantity}
          onChange={(e) => handleTicketTypeChange(index, e)}
          placeholder="Tổng số lượng vé"
          min="1"
          className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label className="block text-sm font-medium text-gray-300 mb-1">Số lượng còn lại</label>
        <span className="w-full rounded-lg border border-gray-600 bg-gray-600 text-white p-2 text-center">{ticket.availableQuantity}</span>
      </div>
      <div className="flex flex-col flex-1 min-h-[68px] justify-end">
        <label className="block text-sm font-medium text-gray-300 mb-1 invisible">Xóa</label>
        <button
          type="button"
          onClick={() => handleRemoveTicketType(index)}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 w-full"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default TicketType; 