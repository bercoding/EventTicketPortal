import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
    { name: 'Nhạc sống', path: '/events/music' },
    { name: 'Sân khấu & Nghệ thuật', path: '/events/arts' },
    { name: 'Thể Thao', path: '/events/sports' },
    { name: 'Khóa học', path: '/events/workshop' }, // Adding a common category
    { name: 'Cộng đồng', path: '/events/community' }, // Adding another common category
    { name: 'Khác', path: '/events/other' },
];

const CategoryNavBar = () => {
    return (
        <nav className="bg-black text-white py-2 shadow-md">
            <div className="container mx-auto flex justify-center items-center space-x-6 text-sm">
                {categories.map((category) => (
                    <Link 
                        key={category.name} 
                        to={category.path} 
                        className="hover:text-gray-300 transition-colors duration-200"
                    >
                        {category.name.toUpperCase()}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default CategoryNavBar; 