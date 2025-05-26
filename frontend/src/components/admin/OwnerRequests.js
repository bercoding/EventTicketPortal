import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const OwnerRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getOwnerRequests();
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching owner requests:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Yêu cầu Owner</h1>
                <p className="text-purple-100">Duyệt yêu cầu trở thành event owner</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng yêu cầu</p>
                            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                            <p className="text-2xl font-bold text-green-600">
                                {requests.filter(r => r.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🏢</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chức năng đang phát triển</h3>
                <p className="text-gray-600">Hệ thống duyệt yêu cầu owner sẽ được triển khai trong phiên bản tiếp theo</p>
                <p className="text-sm text-gray-500 mt-2">Tổng yêu cầu: {requests.length}</p>
            </div>
        </div>
    );
};

export default OwnerRequests; 