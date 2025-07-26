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

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Thêm filter dựa trên tab được chọn
            let categoryFilter = filters.category;
            let subjectFilter = '';
            
            if (activeTab === 'ban-appeals') {
                categoryFilter = 'user_behavior';
                subjectFilter = 'Kháng cáo'; // Tìm trong subject có từ "Kháng cáo"
            } else if (activeTab === 'other') {
                categoryFilter = filters.category || 'payment,event,technical,other';
            }
            
            const filterParams = {
                ...filters,
                category: categoryFilter,
                subject: subjectFilter
            };
            
            console.log("🔍 Fetching complaints with filters:", filterParams);
            const response = await adminAPI.getComplaints(filterParams); 
            const { data } = response;
            console.log("📄 Complaints data từ API:", data);
            
            // Kiểm tra cấu trúc dữ liệu trả về từ API
            if (data.complaints && data.complaints.length > 0) {
                console.log("📋 Mẫu khiếu nại đầu tiên:", data.complaints[0]);
                console.log("👤 Thuộc tính user:", data.complaints[0].user);
                
                // Kiểm tra và phân tích cấu trúc user
                if (typeof data.complaints[0].user === 'string') {
                    console.log("⚠️ Chú ý: user là một chuỗi ID, không phải object");
                } else if (data.complaints[0].user && typeof data.complaints[0].user === 'object') {
                    console.log("✓ User là một đối tượng:", Object.keys(data.complaints[0].user));
                }
            }
            
            // Lọc thêm cho tab kháng cáo ban (nếu cần)
            let filteredComplaints = data.complaints || [];
            
            if (activeTab === 'ban-appeals') {
                filteredComplaints = filteredComplaints.filter(
                    complaint => 
                        complaint.subject?.toLowerCase().includes('kháng cáo') || 
                        complaint.subject?.toLowerCase().includes('ban') || 
                        complaint.description?.toLowerCase().includes('ban') ||
                        complaint.description?.toLowerCase().includes('khóa tài khoản')
                );
                console.log("🔒 Ban appeals filtered:", filteredComplaints.length);
            }
            
            // Bổ sung thêm dữ liệu cho filteredComplaints nếu cần
            const processedComplaints = filteredComplaints.map(complaint => {
                // Nếu user là string, tạo đối tượng user với _id
                if (complaint.user && typeof complaint.user === 'string') {
                    return {
                        ...complaint,
                        processedUser: {
                            _id: complaint.user
                        }
                    };
                }
                return complaint;
            });
            
            setComplaints(processedComplaints);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                total: activeTab === 'ban-appeals' ? filteredComplaints.length : data.total
            });
        } catch (err) {
            const message = err.response?.data?.message || 'Error fetching complaints';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }, [filters, activeTab]);

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

    // Mở modal để xem chi tiết và giải quyết khiếu nại
    const openModal = (complaint) => {
        // Hiển thị thông tin chi tiết về khiếu nại để debug
        console.log('📝 Chi tiết khiếu nại đầy đủ:', complaint);
        console.log('👤 Thuộc tính user:', complaint.user);
        
        // JSON stringify để xem cấu trúc dữ liệu đầy đủ
        console.log('📊 Dữ liệu JSON đầy đủ:', JSON.stringify(complaint, null, 2));
        
        // Lưu complaint và reset resolution
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
    
    // Đơn giản hóa lại hàm xử lý hành động nhanh để mở khóa tài khoản
    const handleQuickUnban = async () => {
      if (!selectedComplaint) {
        toast.error('Không có thông tin khiếu nại');
        return;
      }

      try {
        // Lấy mô tả khiếu nại để tìm thông tin người dùng
        const description = selectedComplaint.description || '';
        
        // Tìm các pattern có thể là email trong mô tả khiếu nại
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = description.match(emailRegex) || [];
        
        // Lấy thông tin từ email đầu tiên tìm thấy hoặc từ người tạo khiếu nại
        let emailToUnban = emails.length > 0 ? emails[0] : (selectedComplaint.user?.email || '');
        
        // Nếu không tìm được email, yêu cầu nhập thủ công
        if (!emailToUnban) {
          const userInput = window.prompt('Không tìm thấy email trong nội dung. Vui lòng nhập email người dùng cần mở khóa:');
          
          if (!userInput || !userInput.trim()) {
            toast.warning('Bạn chưa nhập email, hành động đã bị hủy.');
            return;
          }
          
          emailToUnban = userInput.trim();
          
          // Kiểm tra cơ bản nếu input giống email
          if (!emailToUnban.includes('@')) {
            toast.error('Email không hợp lệ, vui lòng nhập đúng định dạng email');
            return;
          }
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
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {activeTab === 'ban-appeals' || selectedComplaint.subject?.includes('Kháng cáo') ? (
                                    <>
                                        <FaUserSlash className="inline mr-2 text-red-500" />
                                        Giải quyết kháng cáo ban
                                    </>
                                ) : (
                                    'Giải quyết khiếu nại'
                                )}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                       
                        {/* Phía dưới Modal Title, thêm một form đơn giản để hiển thị thông tin người dùng */}
                        {selectedComplaint && (
                            <div className="mt-4 space-y-4 text-sm text-gray-600">
                                <p><span className="font-semibold">Người dùng:</span> {selectedComplaint.user?.username || 'N/A'}</p>
                                <p><span className="font-semibold">Email:</span> {selectedComplaint.user?.email || 'N/A'}</p>
                                <p><span className="font-semibold">Chủ đề:</span> {selectedComplaint.subject}</p>
                                <p><span className="font-semibold">Mô tả:</span></p>
                                <p className="p-2 bg-gray-50 border rounded-md">{selectedComplaint.description}</p>
                                {selectedComplaint.relatedEvent && <p><span className="font-semibold">Sự kiện liên quan:</span> {selectedComplaint.relatedEvent.title}</p>}
                                {selectedComplaint.relatedUser && <p><span className="font-semibold">Người dùng liên quan:</span> {selectedComplaint.relatedUser.username}</p>}
                            </div>
                        )}

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

                        <form onSubmit={handleResolveComplaint} className="mt-6">
                            <textarea
                                id="resolution"
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                rows="4"
                                placeholder="Giải thích cách giải quyết khiếu nại..."
                                required
                            />
                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                    {isSubmitting ? <ClipLoader size={20} color={"#fff"} /> : <><FaPaperPlane className="mr-2" /> Đánh dấu đã giải quyết</>}
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