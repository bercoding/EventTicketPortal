import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { FaCheck, FaTimes, FaSpinner, FaEye, FaMoneyBillWave, FaFileAlt, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import vi from 'date-fns/locale/vi';

const RefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/refunds/admin/requests?status=${filter === 'all' ? '' : filter}&page=${currentPage}&limit=10`);
      
      if (response.data.success) {
        setRefundRequests(response.data.refundRequests);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        toast.error('Không thể tải danh sách yêu cầu hoàn tiền');
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
  }, [filter, currentPage]);

  const handleProcessRequest = async (id, status) => {
    try {
      setIsProcessing(true);
      
      const requestData = {
        status,
        adminNotes: adminNotes
      };
      
      if (status === 'rejected' && !rejectionReason) {
        toast.error('Vui lòng nhập lý do từ chối');
        return;
      }
      
      if (status === 'rejected') {
        requestData.rejectionReason = rejectionReason;
      }
      
      const response = await api.put(`/refunds/admin/requests/${id}`, requestData);
      
      if (response.data.success) {
        toast.success(`Đã ${status === 'completed' ? 'hoàn thành' : status === 'rejected' ? 'từ chối' : 'cập nhật'} yêu cầu hoàn tiền`);
        fetchRefundRequests();
        setSelectedRefund(null);
        setAdminNotes('');
        setRejectionReason('');
      } else {
        toast.error(response.data.message || 'Không thể xử lý yêu cầu');
      }
    } catch (error) {
      console.error('Error processing refund request:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý yêu cầu');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      return 'Ngày không hợp lệ';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Chờ xử lý</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Đang xử lý</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Hoàn thành</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Từ chối</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý yêu cầu hoàn tiền</h1>
      
      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Hoàn thành</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>
      
      {/* Refund Request List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        </div>
      ) : refundRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Không có yêu cầu hoàn tiền nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người yêu cầu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sự kiện
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày yêu cầu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refundRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={request.user?.avatar ? `http://localhost:5001${request.user.avatar}` : '/images/placeholder-avatar.svg'} 
                          alt={request.user?.username} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.user?.username}</div>
                        <div className="text-sm text-gray-500">{request.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-1">{request.event?.title}</div>
                    <div className="text-xs text-gray-500">{formatDate(request.event?.startDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(request.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{request.refundAmount?.toLocaleString('vi-VN')}đ</div>
                    <div className="text-xs text-gray-500">
                      <span className="line-through">{request.amount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedRefund(request)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FaEye className="inline" /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trước
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic để hiển thị 5 trang gần với trang hiện tại
              const pageNum = Math.max(
                1,
                currentPage > 3
                  ? currentPage + i - 2
                  : i + 1
              );
              
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sau
            </button>
          </nav>
        </div>
      )}
      
      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-blue-600 text-white px-6 py-4">
              <h3 className="text-lg font-semibold">Chi tiết yêu cầu hoàn tiền</h3>
              <button
                onClick={() => setSelectedRefund(null)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              {/* Request Details */}
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Mã yêu cầu</h4>
                  <p className="text-base font-mono bg-gray-100 p-1 rounded">{selectedRefund._id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Ngày tạo</h4>
                  <p className="text-base flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-500" />
                    {formatDate(selectedRefund.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Người yêu cầu</h4>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 mr-2">
                      <img 
                        className="h-8 w-8 rounded-full object-cover" 
                        src={selectedRefund.user?.avatar ? `http://localhost:5001${selectedRefund.user.avatar}` : '/images/placeholder-avatar.svg'} 
                        alt={selectedRefund.user?.username} 
                      />
                    </div>
                    <div>
                      <p className="text-base">{selectedRefund.user?.username}</p>
                      <p className="text-sm text-gray-500">{selectedRefund.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Trạng thái</h4>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Sự kiện</h4>
                <p className="text-base">{selectedRefund.event?.title}</p>
              </div>
              
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Số tiền ban đầu</h4>
                  <p className="text-base text-gray-700">{selectedRefund.amount?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Số tiền hoàn lại (75%)</h4>
                  <p className="text-lg font-bold text-green-600">{selectedRefund.refundAmount?.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Lý do trả vé</h4>
                <p className="text-base bg-gray-50 p-3 rounded-md border">{selectedRefund.reason}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Thông tin ngân hàng</h4>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p><span className="font-semibold">Tên ngân hàng:</span> {selectedRefund.bankInfo.bankName}</p>
                  <p><span className="font-semibold">Số tài khoản:</span> {selectedRefund.bankInfo.accountNumber}</p>
                  <p><span className="font-semibold">Tên chủ tài khoản:</span> {selectedRefund.bankInfo.accountHolderName}</p>
                  {selectedRefund.bankInfo.branch && (
                    <p><span className="font-semibold">Chi nhánh:</span> {selectedRefund.bankInfo.branch}</p>
                  )}
                </div>
              </div>
              
              {/* Admin Actions - Only show for pending/processing requests */}
              {(selectedRefund.status === 'pending' || selectedRefund.status === 'processing') && (
                <>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Ghi chú của admin</h4>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Thêm ghi chú (không bắt buộc)"
                    />
                  </div>
                  
                  {/* Rejection Reason - Only show when rejecting */}
                  {selectedRefund.status !== 'rejected' && (
                    <div className="mb-6" style={{ display: isProcessing && rejectionReason !== '' ? 'block' : 'none' }}>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Lý do từ chối <span className="text-red-500">*</span></h4>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Nhập lý do từ chối yêu cầu"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => setSelectedRefund(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all"
                      disabled={isProcessing}
                    >
                      Đóng
                    </button>
                    
                    {selectedRefund.status === 'pending' && (
                      <button
                        onClick={() => handleProcessRequest(selectedRefund._id, 'processing')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <FaSpinner className="inline animate-spin mr-1" /> : null}
                        Đang xử lý
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsProcessing(true);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                      disabled={isProcessing}
                    >
                      {isProcessing && rejectionReason !== undefined ? <FaSpinner className="inline animate-spin mr-1" /> : null}
                      Từ chối
                    </button>
                    
                    {isProcessing && rejectionReason !== undefined && (
                      <div className="w-full mt-2">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Nhập lý do từ chối yêu cầu"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => {
                              setIsProcessing(false);
                              setRejectionReason(undefined);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all mr-2"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleProcessRequest(selectedRefund._id, 'rejected')}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                            disabled={!rejectionReason}
                          >
                            Xác nhận từ chối
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleProcessRequest(selectedRefund._id, 'completed')}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all"
                      disabled={isProcessing}
                    >
                      {isProcessing ? <FaSpinner className="inline animate-spin mr-1" /> : <FaCheck className="inline mr-1" />}
                      Đã hoàn tiền
                    </button>
                  </div>
                </>
              )}
              
              {/* Show completion/rejection info */}
              {selectedRefund.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <h4 className="font-medium text-green-800 flex items-center">
                    <FaCheck className="mr-2" /> Đã hoàn tiền
                  </h4>
                  <p className="text-green-700 mt-1">Thời gian: {formatDate(selectedRefund.completedAt)}</p>
                  {selectedRefund.adminNotes && (
                    <p className="text-green-700 mt-1">Ghi chú: {selectedRefund.adminNotes}</p>
                  )}
                </div>
              )}
              
              {selectedRefund.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                  <h4 className="font-medium text-red-800 flex items-center">
                    <FaTimes className="mr-2" /> Đã từ chối
                  </h4>
                  <p className="text-red-700 mt-1">Thời gian: {formatDate(selectedRefund.rejectedAt)}</p>
                  <p className="text-red-700 mt-1">Lý do: {selectedRefund.rejectionReason}</p>
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