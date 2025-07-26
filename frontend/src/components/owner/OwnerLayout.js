
import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OwnerSidebar from './OwnerSidebar';

const OwnerLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user || (user.role !== 'owner' && user.role !== 'event_owner')) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <OwnerSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quản lý sự kiện
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerLayout; 


