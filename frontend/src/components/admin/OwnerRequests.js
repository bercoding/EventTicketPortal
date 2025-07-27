import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaUserTie } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { useSocket } from '../../context/SocketContext';

const OwnerRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters] = useState({ status: 'pending', page: 1, limit: 10 });
    
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { socket } = useSocket();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await adminAPI.getOwnerRequests(filters);
            const { data } = response;
            setRequests(data.requests || []);
        } catch (err) {
            const message = err.response?.data?.message || 'Error fetching owner requests';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Lắng nghe socket event new_owner_request
    useEffect(() => {
        if (!socket) return;
        const handler = () => {
            fetchRequests();
        };
        socket.on('new_owner_request', handler);
        return () => socket.off('new_owner_request', handler);
    }, [socket, fetchRequests]);

    const handleAction = async (action, requestId, reason = '') => {
        setIsSubmitting(true);
        try {
            if (action === 'approve') {
                await adminAPI.approveOwnerRequest(requestId);
                toast.success('Request approved successfully!');
            } else if (action === 'reject') {
                await adminAPI.rejectOwnerRequest(requestId, { reason });
                toast.success('Request rejected successfully!');
            }
            setIsModalOpen(false);
            fetchRequests(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // UI Helper Functions and other handlers...
    const openModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-1">Owner Requests</h1>
                <p className="text-purple-100">Approve or reject requests to become an event owner.</p>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center items-center h-64"><ClipLoader size={40} color={"#4f46e5"} /></div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {requests.length > 0 ? requests.map((req) => (
                            <li key={req._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start sm:items-center space-x-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                        <FaUserTie className="text-indigo-500 text-2xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-700 truncate">{req.businessName}</p>
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <span className="font-medium">{req.user?.username || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 ml-4">
                                        <span className="text-xs text-gray-500 hidden sm:block">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                        <button onClick={() => openModal(req)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-indigo-600">
                                            <FaEye />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        )) : (
                            <div className="text-center py-16">
                                <h3 className="text-lg font-medium text-gray-800">No Pending Requests</h3>
                                <p className="text-gray-500 mt-1">There are no owner requests to review at this time.</p>
                            </div>
                        )}
                    </ul>
                </div>
            )}
            
            {/* Modal for Details and Actions - Improved Style */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                        <h3 className="text-xl font-semibold">Review Request</h3>
                        <div className="mt-4 space-y-2">
                            <p><strong>User:</strong> {selectedRequest.user.username}</p>
                            <p><strong>Business:</strong> {selectedRequest.businessName} ({selectedRequest.businessType})</p>
                            <p><strong>Description:</strong> {selectedRequest.businessDescription}</p>
                            <p><strong>Contact:</strong> {selectedRequest.contactInfo.email}, {selectedRequest.contactInfo.phone}</p>
                        </div>
                        {selectedRequest.status === 'pending' && (
                            <div className="mt-6">
                                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (required if rejecting)</label>
                                <textarea id="rejectionReason" rows="3" className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}></textarea>
                            </div>
                        )}
                        <div className="mt-8 flex justify-end space-x-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button onClick={() => handleAction('reject', selectedRequest._id, rejectionReason)} disabled={isSubmitting || !rejectionReason} className="flex items-center justify-center px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-300">
                                        {isSubmitting ? <ClipLoader size={20} color="#fff" /> : <><FaTimes className="mr-2"/>Reject</> }
                                    </button>
                                    <button onClick={() => handleAction('approve', selectedRequest._id)} disabled={isSubmitting} className="flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300">
                                         {isSubmitting ? <ClipLoader size={20} color="#fff" /> : <><FaCheck className="mr-2"/>Approve</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRequests; 