import React, { useEffect } from 'react';
import NavigationBar from '../navigationBar'; // Đảm bảo đường dẫn đúng

const MainLayout = ({ children }) => {
    // Kiểm tra và xử lý navbar trùng lặp
    useEffect(() => {
        const allNavbars = document.querySelectorAll('.navigation-bar');
        if (allNavbars.length > 1) {
            console.log('Phát hiện nhiều navbar, giữ cái đầu tiên');
            for (let i = 1; i < allNavbars.length; i++) {
                allNavbars[i].style.display = 'none';
            }
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <NavigationBar className="navigation-bar" />
            <main className="flex-grow container mx-auto pt-0"> 
                {/* pt-0 nếu navbar đã có padding, hoặc điều chỉnh padding ở đây */}
                {/* Container và mx-auto có thể tùy chỉnh nếu trang con đã có */}
                {children}
            </main>
            {/* Bạn có thể thêm Footer ở đây nếu muốn */}
        </div>
    );
};

export default MainLayout; 