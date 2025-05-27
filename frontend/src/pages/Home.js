import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import NavigationBar from '../components/navigationBar';
import CategoryNavBar from '../components/CategoryNavBar';

const Home = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <>
            <NavigationBar />
            <CategoryNavBar />
            <div className="container mx-auto mt-4 p-4">
                <h1 className="text-2xl font-semibold mb-4">Trang chủ - Nền tảng đặt vé sự kiện</h1>
                {user && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-2">Chào mừng, {user.username}!</h2>
                        <p className="text-gray-700 mb-1">Email: {user.email}</p>
                        <p className="text-gray-700 mb-3">Vai trò: {user.role}</p>
                        <button 
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={logout}
                        >
                            Đăng xuất
                        </button>
                    </div>
                )}
                
                <div className="events-container bg-white shadow-md rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3">Sự kiện nổi bật</h3>
                    <p className="text-gray-600">Chưa có sự kiện nào nổi bật. Vui lòng quay lại sau.</p>
                </div>
            </div>
        </>
    );
};

export default Home; 