import React from 'react';

const VenueLayout = ({ selectedLayout, onLayoutChange }) => {
  const layouts = [
    {
      id: 'hall',
      title: 'Hội trường',
      description: 'Phù hợp cho hội nghị, hội thảo, và các sự kiện quy mô vừa'
    },
    {
      id: 'cinema',
      title: 'Rạp phim',
      description: 'Phù hợp cho chiếu phim, trình diễn và các sự kiện có màn hình'
    },
    {
      id: 'stadium',
      title: 'Sân vận động',
      description: 'Phù hợp cho các sự kiện thể thao và biểu diễn quy mô lớn'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {layouts.map(layout => (
        <div 
          key={layout.id}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedLayout === layout.id 
              ? 'border-green-500 bg-green-500/10' 
              : 'border-gray-600 hover:border-green-500/50'
          }`}
          onClick={() => onLayoutChange(layout.id)}
        >
          <h3 className="text-lg font-semibold text-gray-200 mb-1">{layout.title}</h3>
          <p className="text-sm text-gray-400">{layout.description}</p>
        </div>
      ))}
    </div>
  );
};

export default VenueLayout; 