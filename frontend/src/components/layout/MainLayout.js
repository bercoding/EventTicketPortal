import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from '../navigationBar'; // Đảm bảo đường dẫn đúng

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <NavigationBar />
            <main className="flex-grow container mx-auto pt-0"> 
                {/* pt-0 nếu navbar đã có padding, hoặc điều chỉnh padding ở đây */}
                {/* Container và mx-auto có thể tùy chỉnh nếu trang con đã có */}
                <Outlet />
            </main>
            {/* Bạn có thể thêm Footer ở đây nếu muốn */}
        </div>
    );
};

export default MainLayout; 