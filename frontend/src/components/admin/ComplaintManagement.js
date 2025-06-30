import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api'; // Corrected import to adminAPI
import { toast } from 'react-toastify';
import { FaEye, FaFilter, FaRedo, FaTimes, FaUser, FaTag, FaExclamationCircle, FaPaperPlane } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners'; // For a better loading spinner

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0
    });
    
    const [filters, setFilters] = useState({
        status: 'pending', // Default to pending complaints
        page: 1,
        limit: 10
    });

    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resolution, setResolution] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Use the specific function from adminAPI
            const response = await adminAPI.getComplaints(filters); 
            const { data } = response;
            setComplaints(data.complaints || []);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                total: data.total
            });
        } catch (err) {
            const message = err.response?.data?.message || 'Error fetching complaints';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };
    
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const openModal = (complaint) => {
        setSelectedComplaint(complaint);
        setResolution('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComplaint(null);
    };

    const handleResolveComplaint = async (e) => {
        e.preventDefault();
        if (!resolution.trim()) {
            toast.warn('Please provide a resolution note.');
            return;
        }
        setIsSubmitting(true);
        try {
            // Use the specific function from adminAPI
            await adminAPI.resolveComplaint(selectedComplaint._id, { resolution }); 
            toast.success('Complaint resolved successfully!');
            closeModal();
            fetchComplaints(); // Refresh the list
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to resolve complaint.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-1">Complaint Management</h1>
                <p className="text-red-100">Review and resolve user complaints efficiently.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><FaExclamationCircle className="text-yellow-500 text-2xl" /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                    </div>
                 </div>
                 {/* Add more stats cards if needed */}
            </div>

            {/* Filter Controls - Improved Layout */}
            <div className="p-4 bg-white rounded-xl shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div className="flex space-x-2">
                         <button onClick={() => fetchComplaints()} className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                             <FaFilter className="mr-2" /> Filter
                         </button>
                         <button onClick={() => setFilters({ status: 'pending', page: 1, limit: 10 })} className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                             <FaRedo className="mr-2" /> Reset
                         </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Complaints List */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <ClipLoader size={40} color={"#4f46e5"} />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                    <h3 className="text-lg font-medium text-gray-800">No complaints found</h3>
                    <p className="text-gray-500 mt-1">There are no complaints matching the current filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {complaints.map((complaint) => (
                            <li key={complaint._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-600 truncate">{complaint.subject}</p>
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <FaUser className="mr-1.5" />
                                            <span className="font-medium mr-3">{complaint.user?.username || 'N/A'}</span>
                                            <FaTag className="mr-1.5" />
                                            <span>{complaint.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 ml-4">
                                         <button onClick={() => openModal(complaint)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-indigo-600">
                                            <FaEye />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Pagination */}
             <div className="mt-6 flex justify-between items-center">
                <span className="text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total results)
                </span>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handlePageChange(pagination.currentPage - 1)} 
                        disabled={pagination.currentPage <= 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => handlePageChange(pagination.currentPage + 1)} 
                        disabled={pagination.currentPage >= pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Resolution Modal */}
            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-semibold text-gray-900">Resolve Complaint</h3>
                             <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                 <FaTimes />
                             </button>
                        </div>
                       
                        <div className="mt-4 space-y-4 text-sm text-gray-600">
                             <p><span className="font-semibold">User:</span> {selectedComplaint.user?.username}</p>
                             <p><span className="font-semibold">Subject:</span> {selectedComplaint.subject}</p>
                             <p><span className="font-semibold">Description:</span></p>
                             <p className="p-2 bg-gray-50 border rounded-md">{selectedComplaint.description}</p>
                             {selectedComplaint.relatedEvent && <p><span className="font-semibold">Related Event:</span> {selectedComplaint.relatedEvent.title}</p>}
                             {selectedComplaint.relatedUser && <p><span className="font-semibold">Related User:</span> {selectedComplaint.relatedUser.username}</p>}
                        </div>

                        <form onSubmit={handleResolveComplaint} className="mt-6">
                            <textarea
                                id="resolution"
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                rows="4"
                                placeholder="Explain the resolution steps taken..."
                                required
                            />
                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                    {isSubmitting ? <ClipLoader size={20} color={"#fff"} /> : <><FaPaperPlane className="mr-2" /> Mark as Resolved</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintManagement; 