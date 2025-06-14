import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartBar, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const menuItems = [
    { icon: faCalendarAlt, label: 'Sự kiện của tôi', path: '/events/my-events' },
    { icon: faChartBar, label: 'Quản lý báo cáo', path: '/organizer/reports' },
    { icon: faFileAlt, label: 'Biểu mẫu ban tổ chức', path: '/organizer/forms' }
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen p-6">
      <h2 className="text-2xl font-bold text-white mb-8">Organizer Center</h2>
      <nav>
        <ul className="space-y-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors duration-200"
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 