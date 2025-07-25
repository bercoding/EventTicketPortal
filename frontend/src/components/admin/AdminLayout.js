import React, { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt, FaUsers, FaCalendarCheck, FaExclamationTriangle, FaFileAlt, FaDollarSign, FaUserTie, FaChartBar, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaFileInvoiceDollar, FaBuilding, FaShieldAlt } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [notificationCounts, setNotificationCounts] = useState({});

    useEffect(() => {
        const fetchCounts = async () => {
            if (!user) return; // Don't fetch if not logged in
            try {
                const response = await adminAPI.getDashboardStats();
                setNotificationCounts(response.data || {});
            } catch (error) {
                console.error("Failed to fetch notification counts:", error);
                // Optionally handle error in UI
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [user]); // Re-run if user changes

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartBar className="mr-3" /> },
        { name: 'Quản lý Người dùng', path: '/admin/users', icon: <FaUsers className="mr-3" /> },
        { name: 'Quản lý Sự kiện', path: '/admin/events', icon: <FaCalendarAlt className="mr-3" /> },
        { name: 'Quản lý Địa điểm', path: '/admin/venues', icon: <FaMapMarkerAlt className="mr-3" /> },
        { name: 'Quản lý Vé', path: '/admin/tickets', icon: <FaTicketAlt className="mr-3" /> },
        { name: 'Quản lý Giao dịch', path: '/admin/transactions', icon: <FaFileInvoiceDollar className="mr-3" /> },
        { name: 'Quản lý Hoàn tiền', path: '/admin/refunds', icon: <FaDollarSign className="mr-3" /> },
        { name: 'Quản lý Owner', path: '/admin/owners', icon: <FaBuilding className="mr-3" /> },
        { name: 'Quản lý Khiếu nại', path: '/admin/complaints', icon: <FaExclamationTriangle className="mr-3" /> },
        { name: 'Quản lý Nội dung', path: '/admin/content', icon: <FaShieldAlt className="mr-3" /> },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Trang quản trị
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

export default AdminLayout;