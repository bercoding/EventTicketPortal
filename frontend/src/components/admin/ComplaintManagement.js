import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getComplaints();
            setComplaints(response.data.complaints || []);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            complaint.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || complaint.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', text: 'Chờ xử lý' },
            resolved: { color: 'bg-green-100 text-green-800', icon: '✅', text: 'Đã giải quyết' },
            rejected: { color: 'bg-red-100 text-red-800', icon: '❌', text: 'Từ chối' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon} {config.text}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const priorityConfig = {
            high: { color: 'bg-red-100 text-red-800', icon: '🔴', text: 'Cao' },
            medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', text: 'Trung bình' },
            low: { color: 'bg-green-100 text-green-800', icon: '🟢', text: 'Thấp' }
        };
        
        const config = priorityConfig[priority] || priorityConfig.medium;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon} {config.text}
            </span>
        );
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
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Quản lý Khiếu nại</h1>
                <p className="text-yellow-100">Xử lý và giải quyết khiếu nại từ người dùng</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng khiếu nại</p>
                            <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {complaints.filter(c => c.status === 'pending').length}
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
                            <p className="text-sm font-medium text-gray-600">Đã giải quyết</p>
                            <p className="text-2xl font-bold text-green-600">
                                {complaints.filter(c => c.status === 'resolved').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🔴</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Ưu tiên cao</p>
                            <p className="text-2xl font-bold text-red-600">
                                {complaints.filter(c => c.priority === 'high').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề hoặc người gửi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center space-x-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="rejected">Từ chối</option>
                        </select>

                        <div className="text-sm text-gray-600">
                            Tổng: <span className="font-semibold">{filteredComplaints.length}</span> khiếu nại
                        </div>
                    </div>
                </div>
            </div>

            {/* Complaints List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                    {filteredComplaints.map((complaint) => (
                        <div key={complaint._id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {complaint.subject}
                                        </h3>
                                        {getStatusBadge(complaint.status)}
                                        {getPriorityBadge(complaint.priority || 'medium')}
                                    </div>
                                    
                                    <p className="text-gray-600 mb-3 line-clamp-2">
                                        {complaint.description}
                                    </p>
                                    
                                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {complaint.user?.username || 'Unknown'}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(complaint.createdAt)}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            {complaint.category || 'General'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => {
                                            setSelectedComplaint(complaint);
                                            setShowModal(true);
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Chi tiết
                                    </button>
                                    
                                    {complaint.status === 'pending' && (
                                        <>
                                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 transition-colors">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Giải quyết
                                            </button>
                                            <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {filteredComplaints.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có khiếu nại</h3>
                    <p className="text-gray-600">Không tìm thấy khiếu nại nào với bộ lọc hiện tại</p>
                </div>
            )}

            {/* Complaint Detail Modal */}
            {showModal && selectedComplaint && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Chi tiết Khiếu nại</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                        {selectedComplaint.subject}
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(selectedComplaint.status)}
                                        {getPriorityBadge(selectedComplaint.priority || 'medium')}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Người gửi:</span>
                                        <span className="ml-2 text-gray-900">{selectedComplaint.user?.username}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Email:</span>
                                        <span className="ml-2 text-gray-900">{selectedComplaint.user?.email}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Danh mục:</span>
                                        <span className="ml-2 text-gray-900">{selectedComplaint.category || 'General'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Ngày tạo:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedComplaint.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h5 className="font-semibold text-gray-900 mb-2">Nội dung khiếu nại:</h5>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {selectedComplaint.description}
                                    </p>
                                </div>
                            </div>

                            {/* Response Section */}
                            {selectedComplaint.response && (
                                <div>
                                    <h5 className="font-semibold text-gray-900 mb-2">Phản hồi:</h5>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-gray-700">{selectedComplaint.response}</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Phản hồi bởi: {selectedComplaint.respondedBy?.username} - {formatDate(selectedComplaint.respondedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                {selectedComplaint.status === 'pending' && (
                                    <>
                                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            ✅ Giải quyết
                                        </button>
                                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            ❌ Từ chối
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintManagement; 