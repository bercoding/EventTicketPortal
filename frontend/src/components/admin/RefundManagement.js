import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, faSearch, faCheckCircle, faTimesCircle, 
  faSpinner, faMoneyBillWave, faClock, faUserCircle, 
  faCalendarAlt, faInfoCircle, faEye
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';

const RefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 1
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Fetch refund requests
  useEffect(() => {
    fetchRefundRequests();
  }, [filters]);
  
  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/refunds/admin/requests', { params: filters });
      if (response.data.success) {
        setRefundRequests(response.data.refundRequests);
        setPagination({
          total: response.data.pagination.total,
          currentPage: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        toast.error('Failed to fetch refund requests');
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const openRefundModal = (refund) => {
    setSelectedRefund(refund);
    setAdminNotes('');
    setRejectionReason('');
    setIsModalOpen(true);
  };
  
  const closeRefundModal = () => {
    setIsModalOpen(false);
    setSelectedRefund(null);
  };
  
  const handleProcessRefund = async (status) => {
    try {
      setProcessingAction(true);
      
      const data = {
        status,
        adminNotes
      };
      
      if (status === 'rejected') {
        if (!rejectionReason.trim()) {
          toast.error('Vui lòng nhập lý do từ chối');
          return;
        }
        data.rejectionReason = rejectionReason;
      }
      
      const response = await api.put(`/refunds/admin/requests/${selectedRefund._id}`, data);
      
      if (response.data.success) {
        toast.success(
          status === 'completed' 
            ? 'Đã xác nhận hoàn tiền thành công' 
            : status === 'rejected'
            ? 'Đã từ chối yêu cầu hoàn tiền'
            : 'Đã cập nhật trạng thái yêu cầu'
        );
        closeRefundModal();
        fetchRefundRequests();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faClock} className="mr-1" /> Đang chờ
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <FontAwesomeIcon icon={faSpinner} className="mr-1" /> Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Hoàn thành
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-400 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Quản lý hoàn tiền</h1>
        <p className="text-green-100">Xem xét và xử lý các yêu cầu hoàn tiền từ người dùng</p>
      </div>
      
      {/* Filter Controls */}
      <div className="p-4 bg-white rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            >
              <option value="">Tất cả</option>
              <option value="pending">Đang chờ</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={fetchRefundRequests} 
              className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" /> Lọc
            </button>
            <button 
              onClick={() => setFilters({ status: 'pending', page: 1, limit: 10 })} 
              className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" /> Đặt lại
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content: Refunds List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon={faSpinner} className="text-3xl text-teal-600 animate-spin" />
        </div>
      ) : refundRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-5xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800">Không có yêu cầu hoàn tiền</h3>
          <p className="text-gray-500 mt-1">Chưa có yêu cầu hoàn tiền nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sự kiện / Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày yêu cầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refundRequests.map((refund) => (
                <tr key={refund._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={refund.user?.avatar || 'https://via.placeholder.com/40'} 
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{refund.user?.username}</div>
                        <div className="text-sm text-gray-500">{refund.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{refund.event?.title}</div>
                    <div className="text-sm text-gray-500">Booking: {refund.booking?.bookingCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">{refund.refundAmount?.toLocaleString('vi-VN')}đ</div>
                    <div className="text-xs text-gray-500">Phí: {(refund.amount - refund.refundAmount)?.toLocaleString('vi-VN')}đ</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(refund.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(refund.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openRefundModal(refund)}
                      className="text-teal-600 hover:text-teal-900 bg-teal-100 hover:bg-teal-200 p-2 rounded-full"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Trang {pagination.currentPage} / {pagination.totalPages} ({pagination.total} kết quả)
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => handlePageChange(pagination.currentPage - 1)} 
              disabled={pagination.currentPage <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button 
              onClick={() => handlePageChange(pagination.currentPage + 1)} 
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
      
      {/* Refund Detail Modal */}
      {isModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết yêu cầu hoàn tiền
              </h3>
              <button 
                onClick={closeRefundModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User and Event Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="space-y-2">
                  <p className="font-semibold flex items-center text-gray-700">
                    <FontAwesomeIcon icon={faUserCircle} className="mr-2 text-teal-500" /> Thông tin người dùng
                  </p>
                  <div className="flex items-center">
                    <img 
                      src={selectedRefund.user?.avatar || 'https://via.placeholder.com/40'} 
                      alt="" 
                      className="h-10 w-10 rounded-full mr-2"
                    />
                    <div>
                      <p className="font-medium">{selectedRefund.user?.username}</p>
                      <p className="text-sm text-gray-500">{selectedRefund.user?.email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Event Info */}
                <div className="space-y-2">
                  <p className="font-semibold flex items-center text-gray-700">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-teal-500" /> Thông tin sự kiện
                  </p>
                  <p className="font-medium">{selectedRefund.event?.title}</p>
                  <p className="text-sm text-gray-500">
                    Booking: {selectedRefund.booking?.bookingCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    Ngày yêu cầu: {formatDate(selectedRefund.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Refund Info */}
              <div>
                <p className="font-semibold flex items-center text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-teal-500" /> Thông tin hoàn tiền
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Số tiền gốc:</p>
                      <p className="font-medium">{selectedRefund.amount?.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số tiền hoàn:</p>
                      <p className="font-medium text-green-600">{selectedRefund.refundAmount?.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phí hoàn vé (25%):</p>
                      <p className="font-medium text-red-500">{(selectedRefund.amount - selectedRefund.refundAmount)?.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái:</p>
                      <p>{getStatusBadge(selectedRefund.status)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bank Info */}
              <div>
                <p className="font-semibold flex items-center text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-teal-500" /> Thông tin ngân hàng
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Ngân hàng:</p>
                      <p className="font-medium">{selectedRefund.bankInfo.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số tài khoản:</p>
                      <p className="font-medium">{selectedRefund.bankInfo.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chủ tài khoản:</p>
                      <p className="font-medium">{selectedRefund.bankInfo.accountHolderName}</p>
                    </div>
                    {selectedRefund.bankInfo.branch && (
                      <div>
                        <p className="text-sm text-gray-500">Chi nhánh:</p>
                        <p className="font-medium">{selectedRefund.bankInfo.branch}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reason */}
              <div>
                <p className="font-semibold flex items-center text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-teal-500" /> Lý do trả vé
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>{selectedRefund.reason}</p>
                </div>
              </div>
              
              {/* Admin Notes */}
              {(selectedRefund.status === 'pending' || selectedRefund.status === 'processing') && (
                <div>
                  <p className="font-semibold flex items-center text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-teal-500" /> Ghi chú của Admin
                  </p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full h-24 border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nhập ghi chú xử lý của bạn..."
                  />
                </div>
              )}
              
              {/* Rejection Reason */}
              {selectedRefund.status === 'pending' && (
                <div className={`${selectedRefund.status === 'rejected' ? '' : 'hidden'}`}>
                  <p className="font-semibold flex items-center text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-teal-500" /> Lý do từ chối
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full h-24 border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nhập lý do từ chối yêu cầu..."
                  />
                </div>
              )}
              
              {/* Admin Actions */}
              {selectedRefund.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeRefundModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={processingAction}
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => handleProcessRefund('processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={processingAction}
                  >
                    {processingAction ? 'Đang xử lý...' : 'Đánh dấu đang xử lý'}
                  </button>
                  <button
                    onClick={() => handleProcessRefund('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    disabled={processingAction}
                  >
                    {processingAction ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                  <button
                    onClick={() => handleProcessRefund('completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={processingAction}
                  >
                    {processingAction ? 'Đang xử lý...' : 'Đã hoàn tiền'}
                  </button>
                </div>
              )}
              
              {selectedRefund.status === 'processing' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeRefundModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={processingAction}
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => handleProcessRefund('completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={processingAction}
                  >
                    {processingAction ? 'Đang xử lý...' : 'Đã hoàn tiền'}
                  </button>
                </div>
              )}
              
              {(selectedRefund.status === 'completed' || selectedRefund.status === 'rejected') && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={closeRefundModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement; 