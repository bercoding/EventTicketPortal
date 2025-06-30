import React from 'react';

const OwnerDashboard = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Placeholder stat cards */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600">Tổng doanh thu</h2>
                    <p className="text-3xl font-bold text-green-500 mt-2">0 VNĐ</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600">Sự kiện đang hoạt động</h2>
                    <p className="text-3xl font-bold text-blue-500 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600">Vé đã bán</h2>
                    <p className="text-3xl font-bold text-purple-500 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-600">Phản hồi mới</h2>
                    <p className="text-3xl font-bold text-yellow-500 mt-2">0</p>
                </div>
            </div>
            <div className="mt-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800">Biểu đồ doanh thu (Placeholder)</h2>
                    <div className="h-64 mt-4 bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard; 