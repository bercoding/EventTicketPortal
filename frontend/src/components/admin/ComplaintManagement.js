import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaEye, FaFilter, FaRedo, FaTimes, FaUser, FaTag, FaExclamationCircle, FaPaperPlane, FaUserSlash, FaUnlock, FaShieldAlt, FaKey, FaEdit, FaSearch } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import axios from 'axios'; // Added axios import
import { API_URL } from '../../services/api'; // Added API_URL import

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'ban-appeals', 'other'
    
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0
    });
    
    const [filters, setFilters] = useState({
        status: 'pending', // Default to pending complaints
        category: '',
        page: 1,
        limit: 10
    });

    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resolution, setResolution] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Thêm state để lưu trữ thông tin người dùng được tìm thấy
    const [foundUser, setFoundUser] = useState(null);
    // Thêm state để lưu trữ thông tin nhập để tìm kiếm
    const [searchInput, setSearchInput] = useState('');

    // Thêm biến state để lưu email được trích xuất hoặc tìm thấy
    const [extractedEmail, setExtractedEmail] = useState('');

    // Thêm state cho việc chỉnh sửa email
    const [editableEmail, setEditableEmail] = useState('');

    // Fetch complaints with proper filtering
    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Xác định loại filter dựa vào tab đang chọn
            let type = '';
            if (activeTab === 'ban-appeals') {
                type = 'ban-appeals';
            } else if (activeTab === 'event-reports') {
                type = 'event-reports';
            }
            
            // Sử dụng API với các tham số rõ ràng
            const response = await axios.get(
                `${API_URL}/admin/complaints?page=${filters.page}&limit=${filters.limit}&status=${filters.status || ''}&type=${type}&search=${searchInput || ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            console.log('📋 Dữ liệu khiếu nại:', response.data);
            
            if (response.data.complaints) {
                setComplaints(response.data.complaints);
                setPagination({
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages,
                    total: response.data.total
                });
            }
        } catch (error) {
            console.error('❌ Lỗi khi tải danh sách khiếu nại:', error);
            toast.error('Không thể tải danh sách khiếu nại');
        } finally {
            setLoading(false);
        }
    }, [filters, activeTab, searchInput]);

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

    // Sửa hàm openModal để không cần trích xuất email thủ công nữa
    const openModal = (complaint) => {
      setSelectedComplaint(complaint);
      setIsModalOpen(true);
      setResolution('');
      
      // Ưu tiên dùng thông tin từ backend trước
      if (complaint.bannedUser) {
        // Dùng thông tin từ backend cho người bị ban
        setEditableEmail(complaint.bannedUser.email);
      } else {
        // Nếu không có thông tin từ backend, thử trích xuất từ nội dung
        const description = complaint.description || '';
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = description.match(emailRegex) || [];
        
        let foundEmail = '';
        if (emails.length > 0) {
          foundEmail = emails[0];
        } else if (complaint.user && complaint.user.email) {
          foundEmail = complaint.user.email;
        }
        
        setEditableEmail(foundEmail);
      }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComplaint(null);
    };

    const handleResolveComplaint = async (e) => {
        e.preventDefault();
        if (!resolution.trim()) {
            toast.warn('Vui lòng cung cấp ghi chú giải quyết.');
            return;
        }
        setIsSubmitting(true);
        try {
            console.log('🔧 Đang giải quyết khiếu nại:', selectedComplaint._id);
            await adminAPI.resolveComplaint(selectedComplaint._id, { resolution }); 
            toast.success('Khiếu nại đã được giải quyết thành công!');
            
            // Nếu là kháng cáo ban, hiển thị thông báo nhắc nhở admin
            if (activeTab === 'ban-appeals' || 
                selectedComplaint.subject?.includes('Kháng cáo') ||
                selectedComplaint.description?.includes('ban')) {
                toast.info('Nhớ unban người dùng nếu bạn chấp nhận kháng cáo!', {
                    autoClose: 6000
                });
            }
            
            closeModal();
            fetchComplaints(); // Refresh the list
        } catch (err) {
            console.error('❌ Lỗi giải quyết khiếu nại:', err);
            const errMsg = err.response?.data?.message || 'Không thể giải quyết khiếu nại.';
            toast.error(errMsg);
            
            // Nếu là lỗi 404, hiển thị thông báo hữu ích hơn
            if (err.response?.status === 404) {
                toast.error('Không tìm thấy khiếu nại. Có thể đã bị xóa hoặc ID không tồn tại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Xử lý thay đổi tab
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Reset filters khi chuyển tab
        setFilters({
            status: 'pending',
            category: '',
            page: 1,
            limit: 10
        });
    };
    
    // Sửa hàm xử lý hành động nhanh để mở khóa tài khoản
    const handleQuickUnban = async () => {
      if (!selectedComplaint) {
        toast.error('Không có thông tin khiếu nại');
        return;
      }

      try {
        // Lấy email từ thông tin hiển thị
        let emailToUnban = editableEmail;
        
        // Kiểm tra nếu email hợp lệ
        if (!emailToUnban || !emailToUnban.includes('@')) {
          toast.error('Email không hợp lệ, vui lòng nhập đúng email cần mở khóa');
          return;
        }
        
        setIsSubmitting(true);
        console.log('🔓 Thực hiện mở khóa nhanh cho email:', emailToUnban);
        
        // Gọi API để unban user bằng email
        const token = localStorage.getItem('token');
        const unbanResponse = await axios.post(
          `${API_URL}/admin/users/unban-by-email`,
          { email: emailToUnban },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Kết quả mở khóa:', unbanResponse.data);
        
        // Luôn thông báo thành công
        toast.success(`Đã mở khóa tài khoản ${emailToUnban} thành công!`);
        
        // Giải quyết khiếu nại
        const resolveResponse = await axios.post(
          `${API_URL}/admin/complaints/${selectedComplaint._id}/resolve`,
          { resolution: `Đã chấp nhận kháng cáo và mở khóa tài khoản ${emailToUnban}.` },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Kết quả giải quyết khiếu nại:', resolveResponse.data);
        toast.success('Đã giải quyết khiếu nại thành công!');
        
        closeModal();
        fetchComplaints();
      } catch (error) {
        console.error('❌ Lỗi khi mở khóa:', error);
        
        if (error.response?.data) {
          console.error('Chi tiết lỗi từ server:', error.response.data);
          toast.error(`Không thể mở khóa: ${error.response.data.message || error.message}`);
        } else {
          toast.error(`Lỗi: ${error.message}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    // Thêm hàm tìm kiếm người dùng
    const findUserInfo = async () => {
      if (!selectedComplaint) return;

      try {
        setIsSubmitting(true);
        const username = selectedComplaint.user?.username;
        const email = selectedComplaint.user?.email;
        const id = selectedComplaint.user?._id || selectedComplaint.user;
        
        console.log('🔍 Tìm kiếm người dùng với thông tin:', { id, username, email });
        
        // Tạo URL tìm kiếm với các tham số hiện có
        let searchParams = new URLSearchParams();
        if (id) searchParams.append('id', id);
        if (username) searchParams.append('username', username);
        if (email) searchParams.append('email', email);
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/admin/debug/find-user?${searchParams.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('✅ Kết quả tìm kiếm người dùng:', response.data);
        
        if (response.data.success && response.data.users && response.data.users.length > 0) {
          // Lấy người dùng đầu tiên tìm thấy
          setFoundUser(response.data.users[0]);
          
          // Thông báo dựa vào trạng thái tài khoản
          if (response.data.users[0].status === 'banned') {
            toast.success(`Tìm thấy người dùng: ${response.data.users[0].username} (Đang bị khóa)`);
          } else {
            toast.info(`Tìm thấy người dùng: ${response.data.users[0].username} (Đang hoạt động - không bị khóa)`);
          }
        } else {
          setFoundUser(null);
          toast.error('Không tìm thấy thông tin người dùng');
        }
      } catch (error) {
        console.error('❌ Lỗi khi tìm kiếm người dùng:', error);
        toast.error('Không thể tìm kiếm người dùng');
        setFoundUser(null);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Thêm hàm tìm kiếm người dùng cụ thể theo input
    const findSpecificUser = async () => {
      if (!searchInput.trim()) {
        toast.error('Vui lòng nhập email hoặc username để tìm kiếm');
        return;
      }

      try {
        setIsSubmitting(true);
        
        console.log('🔍 Tìm kiếm người dùng cụ thể:', searchInput);
        
        // Tạo URL tìm kiếm với input
        let searchParams = new URLSearchParams();
        // Kiểm tra nếu input có dạng email
        if (searchInput.includes('@')) {
          searchParams.append('email', searchInput.trim());
        } else {
          searchParams.append('username', searchInput.trim());
        }
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/admin/debug/find-user?${searchParams.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('✅ Kết quả tìm kiếm người dùng:', response.data);
        
        if (response.data.success && response.data.users && response.data.users.length > 0) {
          // Lấy người dùng đầu tiên tìm thấy
          setFoundUser(response.data.users[0]);
          
          // Thông báo dựa vào trạng thái tài khoản
          if (response.data.users[0].status === 'banned') {
            toast.success(`Tìm thấy người dùng: ${response.data.users[0].username} (Đang bị khóa)`);
          } else {
            toast.info(`Tìm thấy người dùng: ${response.data.users[0].username} (Đang hoạt động - không bị khóa)`);
          }
        } else {
          setFoundUser(null);
          toast.error('Không tìm thấy thông tin người dùng');
        }
      } catch (error) {
        console.error('❌ Lỗi khi tìm kiếm người dùng:', error);
        toast.error('Không thể tìm kiếm người dùng');
        setFoundUser(null);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Hàm thực hiện mở khóa người dùng với ID đã tìm thấy
    const unbanFoundUser = async () => {
      if (!foundUser || !foundUser._id) {
        toast.error('Không có thông tin người dùng để mở khóa');
        return;
      }
      
      try {
        setIsSubmitting(true);
        
        console.log('🔓 Mở khóa cho người dùng đã tìm thấy:', foundUser);
        
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_URL}/admin/users/${foundUser._id}/unban`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Kết quả mở khóa:', response.data);
        toast.success('Đã mở khóa tài khoản thành công');
        
        // Giải quyết khiếu nại
        if (selectedComplaint) {
          await axios.post(
            `${API_URL}/admin/complaints/${selectedComplaint._id}/resolve`,
            { resolution: 'Đã chấp nhận kháng cáo và mở khóa tài khoản.' },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          toast.success('Đã giải quyết khiếu nại thành công');
          closeModal();
          fetchComplaints();
        }
      } catch (error) {
        console.error('❌ Lỗi khi mở khóa:', error);
        if (error.response?.data) {
          toast.error(`Không thể mở khóa: ${error.response.data.message || 'Lỗi không xác định'}`);
        } else {
          toast.error('Không thể kết nối đến server');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-1">Quản lý Khiếu nại</h1>
                <p className="text-red-100">Xem xét và giải quyết khiếu nại từ người dùng</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => handleTabChange('all')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'all' 
                                ? 'border-orange-500 text-orange-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FaExclamationCircle className="inline mr-2" />
                            Tất cả khiếu nại
                        </button>
                        <button
                            onClick={() => handleTabChange('ban-appeals')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'ban-appeals' 
                                ? 'border-orange-500 text-orange-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FaUserSlash className="inline mr-2" />
                            Kháng cáo ban
                        </button>
                        <button
                            onClick={() => handleTabChange('other')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'other' 
                                ? 'border-orange-500 text-orange-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FaShieldAlt className="inline mr-2" />
                            Khiếu nại khác
                        </button>
                    </nav>
                </div>
            </div>

            {/* Stats Cards - Chỉ hiển thị cho All */}
            {activeTab === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><FaExclamationCircle className="text-yellow-500 text-2xl" /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Đang chờ</p>
                            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Stats Cards - Chỉ hiển thị cho kháng cáo ban */}
            {activeTab === 'ban-appeals' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><FaUserSlash className="text-red-500 text-2xl" /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Kháng cáo ban</p>
                            <p className="text-2xl font-bold text-gray-900">{complaints.filter(c => c.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Controls - Improved Layout */}
            <div className="p-4 bg-white rounded-xl shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Đang chờ</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="closed">Đã đóng</option>
                        </select>
                    </div>
                    {activeTab === 'other' && (
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                            <select
                                id="category"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Tất cả</option>
                                <option value="payment">Thanh toán</option>
                                <option value="event">Sự kiện</option>
                                <option value="technical">Kỹ thuật</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    )}
                    <div className="flex space-x-2">
                        <button onClick={() => fetchComplaints()} className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <FaFilter className="mr-2" /> Lọc
                        </button>
                        <button onClick={() => setFilters({ status: 'pending', category: '', page: 1, limit: 10 })} className="mt-1 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
                    <h3 className="text-lg font-medium text-gray-800">Không tìm thấy khiếu nại</h3>
                    <p className="text-gray-500 mt-1">Không có khiếu nại phù hợp với bộ lọc hiện tại.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {complaints.map((complaint) => (
                            <li key={complaint._id} className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                                activeTab === 'ban-appeals' && complaint.subject?.includes('Kháng cáo') 
                                    ? 'border-l-4 border-red-400' 
                                    : ''
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-indigo-600 truncate">
                                            {activeTab === 'ban-appeals' && (
                                                <FaUserSlash className="inline mr-2 text-red-500" />
                                            )}
                                            {complaint.subject}
                                        </p>
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <FaUser className="mr-1.5" />
                                            <span className="font-medium mr-3">{complaint.user?.username || 'N/A'}</span>
                                            <FaTag className="mr-1.5" />
                                            <span>{complaint.category}</span>
                                        </div>
                                        {/* Hiển thị trích đoạn nội dung khiếu nại */}
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{complaint.description?.substring(0, 100)}...</p>
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

            {/* Resolution Modal */}
            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">{selectedComplaint.subject}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-2">Thông tin khiếu nại:</p>
                            <div className="mt-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                                <p className="text-gray-700 mb-2">
                                    <span className="font-medium">Người gửi khiếu nại:</span> {selectedComplaint.user?.username || 'Không có thông tin'}
                                </p>
                                
                                {/* Email cần mở khóa - Luôn hiển thị bất kể có thông tin từ backend hay không */}
                                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <h4 className="font-medium text-gray-700 mb-2">Thông tin người bị khóa:</h4>
                                    
                                    {selectedComplaint.bannedUser ? (
                                        <>
                                            {/* Nếu có thông tin người dùng bị ban từ backend */}
                                            <p className="text-gray-700 mb-1">
                                                <span className="font-medium">Username:</span> {selectedComplaint.bannedUser.username}
                                            </p>
                                            <p className="text-gray-700 mb-1">
                                                <span className="font-medium">Email:</span> {selectedComplaint.bannedUser.email}
                                            </p>
                                            <p className="text-gray-700 mb-1">
                                                <span className="font-medium">Trạng thái:</span> 
                                                {selectedComplaint.bannedUser.status === 'banned' ? (
                                                    <span className="text-red-500 font-semibold"> Đang bị khóa</span>
                                                ) : (
                                                    <span className="text-green-500 font-semibold"> Đang hoạt động</span>
                                                )}
                                            </p>
                                            {selectedComplaint.bannedUser.banReason && (
                                                <p className="text-gray-700">
                                                    <span className="font-medium">Lý do khóa:</span> {selectedComplaint.bannedUser.banReason}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Nếu không có thông tin từ backend */}
                                            <p className="text-gray-500 italic">
                                                Hệ thống chưa xác định được thông tin người bị khóa.
                                            </p>
                                            <div className="mt-2">
                                                <label htmlFor="manual-email" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email cần mở khóa:
                                                </label>
                                                <input 
                                                    id="manual-email"
                                                    type="email"
                                                    value={editableEmail}
                                                    onChange={(e) => setEditableEmail(e.target.value)}
                                                    placeholder="Nhập email cần mở khóa"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <p className="text-gray-700 mb-2">
                                    <span className="font-medium">Ngày tạo:</span> {new Date(selectedComplaint.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-medium">Mô tả:</span> {selectedComplaint.description}
                                </p>
                            </div>
                        </div>
                        
                        {/* Hiển thị các nút hành động đặc biệt cho kháng cáo ban */}
                        {(activeTab === 'ban-appeals' || selectedComplaint?.subject?.includes('Kháng cáo')) && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-700 mb-2">Hành động nhanh:</h4>
                                
                                {/* Form đơn giản để unban */}
                                <div className="mb-4">
                                    <button 
                                        onClick={handleQuickUnban}
                                        disabled={isSubmitting}
                                        className="mb-2 flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <FaUnlock className="mr-1.5" /> Chấp nhận & Mở khóa
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={() => {
                                            setResolution('Kháng cáo bị từ chối. Tài khoản vẫn bị khóa theo quyết định ban đầu.');
                                        }}
                                        disabled={isSubmitting}
                                        className="mb-2 flex items-center justify-center w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 mt-2"
                                    >
                                        <FaUserSlash className="mr-1.5" /> Từ chối kháng cáo
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Form giải quyết khiếu nại */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giải thích cách giải quyết khiếu nại:
                            </label>
                            <textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="4"
                                placeholder="Nhập giải thích cách bạn đã giải quyết khiếu nại này..."
                            ></textarea>
                            
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => handleResolveComplaint(selectedComplaint._id)}
                                    disabled={isSubmitting || !resolution.trim()}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đánh dấu đã giải quyết'
                                    )}
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