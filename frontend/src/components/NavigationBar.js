import React from 'react';
import { FaSearch, FaTicketAlt, FaChevronDown } from 'react-icons/fa';

const NavigationBar = () => {
  return (
    <div>
      {/* Top green section */}
      <div className="bg-green-500 flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo */}
        <div className="text-white text-xl md:text-2xl font-bold">
          Event <span className="text-white">Ticket</span>
        </div>

        {/* Search icon - mobile */}
        <div className="md:hidden">
          <button className="text-white text-xl">
            <FaSearch />
          </button>
        </div>

        {/* Search bar - desktop */}
        <div className="hidden md:flex items-center w-1/2 bg-white rounded-lg px-4 py-2 shadow-sm">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Bạn tìm gì hôm nay?"
            className="flex-grow text-sm text-gray-700 outline-none"
          />
          <button className="ml-4 text-gray-700 font-medium">Tìm kiếm</button>
        </div>

        {/* Right section */}
        <div className="hidden md:flex items-center gap-6 text-white text-sm">
          <button className="border border-white px-4 py-1 rounded-full hover:bg-white hover:text-green-500 transition">
            Tạo sự kiện
          </button>

          <div className="flex items-center gap-2">
            <FaTicketAlt />
            <span>Vé đã mua</span>
          </div>

          <div className="flex gap-1">
            <span>Đăng nhập</span>
            <span>|</span>
            <span>Đăng ký</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-xs text-white font-bold">★</div>
            <FaChevronDown className="text-white text-xs" />
          </div>
        </div>

        {/* Login + Flag - mobile */}
        <div className="md:hidden flex items-center gap-4">
          <span className="text-white text-sm">Đăng nhập</span>
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-sm text-white font-bold">★</div>
        </div>
      </div>

      {/* Bottom black menu */}
      <div className="bg-black text-white px-4 py-2 md:px-6 flex gap-4 md:gap-6 text-sm overflow-x-auto whitespace-nowrap">
        <a href="#" className="hover:text-green-400">Nhạc sống</a>
        <a href="#" className="hover:text-green-400">Sân khấu & Nghệ thuật</a>
        <a href="#" className="hover:text-green-400">Thể Thao</a>
        <a href="#" className="hover:text-green-400">Khác</a>
      </div>
    </div>
  );
};

export default NavigationBar;
