import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaBuilding, FaBriefcase, FaPaperPlane, FaIdCard, FaCamera, FaUpload, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const BecomeOwnerPage = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'individual',
        businessDescription: '',
        contactInfo: {
            phone: '',
            email: '',
            website: '',
        },
        estimatedEventFrequency: 'occasional',
        previousExperience: '',
    });
    const [loading, setLoading] = useState(false);
    const [idImages, setIdImages] = useState({
        front: null,
        back: null
    });
    const [idVerified, setIdVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const frontIdRef = useRef(null);
    const backIdRef = useRef(null);
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                [name]: value,
            },
        }));
    };

    const handleIdImageChange = (e, side) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdImages(prev => ({
                ...prev,
                [side]: file
            }));
            // Reset verification status when new image is uploaded
            if (idVerified) {
                setIdVerified(false);
                setVerificationStatus('');
            }
        }
    };

    const verifyId = async () => {
        if (!idImages.front || !idImages.back) {
            toast.error('Vui lòng tải lên hình ảnh mặt trước và mặt sau CCCD');
            return;
        }

        setIsVerifying(true);
        setVerificationStatus('Đang xác thực...');

        try {
            const formData = new FormData();
            formData.append('frontIdImage', idImages.front);
            formData.append('backIdImage', idImages.back);

            const response = await userProfileAPI.verifyIdCard(formData);
            
            if (response.success) {
                setIdVerified(true);
                setVerificationStatus('Xác thực thành công!');
                toast.success('Xác thực CCCD thành công!');
            } else {
                setVerificationStatus('Xác thực thất bại: ' + response.message);
                toast.error(response.message || 'Xác thực thất bại, vui lòng thử lại');
            }
        } catch (error) {
            setVerificationStatus('Lỗi xác thực: ' + (error.response?.data?.message || error.message));
            toast.error('Lỗi xác thực: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsVerifying(false);
        }
    };

    // Thêm hàm để mở SDK Web trong iframe
    const openVnptEkycSdk = () => {
      // Tạo iframe để hiển thị trang web với SDK
      const iframe = document.createElement('iframe');
      iframe.src = '/vnpt-ekyc.html';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.zIndex = '9999';
      document.body.appendChild(iframe);

      // Đóng iframe khi nhận được thông báo xác thực thành công
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'id_verification_success') {
          document.body.removeChild(iframe);
          setIdVerified(true);
          setVerificationStatus('Xác thực CCCD thành công');
          toast.success('Xác thực CCCD thành công!');
        }
      });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!idVerified) {
            toast.error('Vui lòng xác thực CCCD trước khi gửi yêu cầu');
            return;
        }
        
        setLoading(true);
        try {
            const requestData = {
                ...formData,
                idVerification: {
                    verified: idVerified
                }
            };
            
            await userProfileAPI.requestOwnerRole(requestData);
            await refreshUser();
            toast.success('Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu.');
        } finally {
            setLoading(false);
        }
    };
    
    const backgroundImageUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            
            <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                {/* Close button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                    title="Đóng"
                >
                    &times;
                </button>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Trở thành Đối tác tổ chức sự kiện</h1>
                    <p className="text-gray-600 mt-2">Hoàn thành biểu mẫu dưới đây để bắt đầu tổ chức sự kiện của riêng bạn.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ID Verification Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center">
                                <FaIdCard className="mr-3 text-indigo-500" />
                                Xác thực căn cước công dân
                                <div className="relative group ml-2">
                                    <FaInfoCircle className="text-gray-500 cursor-pointer" />
                                    <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded p-3 w-64 -right-2 top-6 transform transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                        Việc xác thực căn cước công dân là bắt buộc để đảm bảo tính hợp pháp khi tổ chức sự kiện. Thông tin của bạn sẽ được xử lý an toàn và bảo mật.
                                    </div>
                                </div>
                            </h2>
                            <p className="text-gray-600 mb-4">Vui lòng cung cấp hình ảnh mặt trước và mặt sau của CCCD để xác thực danh tính.</p>
                        </div>

                        {/* Front ID Image */}
                        <div className="border rounded-lg p-4 flex flex-col items-center">
                            <p className="text-sm font-medium text-gray-700 mb-2">Mặt trước CCCD</p>
                            <div className="w-full h-48 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                {idImages.front ? (
                                    <img 
                                        src={URL.createObjectURL(idImages.front)} 
                                        alt="Front ID" 
                                        className="max-w-full max-h-full object-contain rounded"
                                    />
                                ) : (
                                    <FaIdCard className="text-gray-400 text-5xl" />
                                )}
                            </div>
                            <div className="flex space-x-2 w-full">
                                <button 
                                    type="button"
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-center"
                                    onClick={() => frontIdRef.current?.click()}
                                >
                                    <FaUpload className="mr-2" />
                                    Tải lên
                                </button>
                                <button 
                                    type="button"
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-center"
                                    onClick={() => {
                                        // Mở camera nếu hỗ trợ
                                        alert('Tính năng chụp ảnh đang được phát triển!');
                                    }}
                                >
                                    <FaCamera className="mr-2" />
                                    Chụp ảnh
                                </button>
                                <input 
                                    ref={frontIdRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden"
                                    onChange={(e) => handleIdImageChange(e, 'front')}
                                />
                            </div>
                        </div>

                        {/* Back ID Image */}
                        <div className="border rounded-lg p-4 flex flex-col items-center">
                            <p className="text-sm font-medium text-gray-700 mb-2">Mặt sau CCCD</p>
                            <div className="w-full h-48 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                {idImages.back ? (
                                    <img 
                                        src={URL.createObjectURL(idImages.back)} 
                                        alt="Back ID" 
                                        className="max-w-full max-h-full object-contain rounded"
                                    />
                                ) : (
                                    <FaIdCard className="text-gray-400 text-5xl" />
                                )}
                            </div>
                            <div className="flex space-x-2 w-full">
                                <button 
                                    type="button"
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-center"
                                    onClick={() => backIdRef.current?.click()}
                                >
                                    <FaUpload className="mr-2" />
                                    Tải lên
                                </button>
                                <button 
                                    type="button"
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-center"
                                    onClick={() => {
                                        // Mở camera nếu hỗ trợ
                                        alert('Tính năng chụp ảnh đang được phát triển!');
                                    }}
                                >
                                    <FaCamera className="mr-2" />
                                    Chụp ảnh
                                </button>
                                <input 
                                    ref={backIdRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden"
                                    onChange={(e) => handleIdImageChange(e, 'back')}
                                />
                            </div>
                        </div>
                        
                        {/* Verification Button and Status */}
                        <div className="md:col-span-2">
                            <div className="flex flex-col items-center">
                                <button 
                                    type="button"
                                    className={`w-full md:w-auto py-2 px-6 rounded-md shadow-sm text-sm font-medium ${
                                        idVerified
                                            ? 'bg-green-500 text-white'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    } focus:outline-none mb-2 flex items-center justify-center`}
                                    onClick={verifyId}
                                    disabled={!idImages.front || !idImages.back || isVerifying || idVerified}
                                >
                                    <FaIdCard className="mr-2" />
                                    {idVerified ? 'Đã xác thực' : (isVerifying ? 'Đang xác thực...' : 'Xác thực CCCD')}
                                </button>
                                {verificationStatus && (
                                    <p className={`text-sm ${idVerified ? 'text-green-500' : 'text-red-500'}`}>
                                        {verificationStatus}
                                    </p>
                                )}
                                {idVerified && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2 w-full">
                                        <h3 className="text-green-700 font-medium">Thông tin đã xác thực:</h3>
                                        <ul className="text-sm text-green-800">
                                            <li>- Xác thực hoàn tất qua dịch vụ VNPT eKYC</li>
                                            <li>- Căn cước công dân hợp lệ</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Business Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center">
                                <FaBuilding className="mr-3 text-indigo-500" />
                                Thông tin doanh nghiệp
                            </h2>
                        </div>
                       
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Tên doanh nghiệp</label>
                            <input type="text" name="businessName" id="businessName" value={formData.businessName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        
                        <div>
                            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">Loại hình</label>
                            <select name="businessType" id="businessType" value={formData.businessType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="individual">Cá nhân</option>
                                <option value="company">Công ty</option>
                                <option value="organization">Tổ chức</option>
                                <option value="non_profit">Phi lợi nhuận</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">Mô tả doanh nghiệp</label>
                            <textarea name="businessDescription" id="businessDescription" value={formData.businessDescription} onChange={handleChange} rows="4" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center">
                                <FaBriefcase className="mr-3 text-indigo-500" />
                                Thông tin liên hệ & Kinh nghiệm
                            </h2>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                            <input type="tel" name="phone" id="phone" value={formData.contactInfo.phone} onChange={handleContactChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email" value={formData.contactInfo.email} onChange={handleContactChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website (Tùy chọn)</label>
                            <input type="url" name="website" id="website" value={formData.contactInfo.website} onChange={handleContactChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="estimatedEventFrequency" className="block text-sm font-medium text-gray-700">Bạn dự định tổ chức sự kiện thường xuyên như thế nào?</label>
                            <select name="estimatedEventFrequency" id="estimatedEventFrequency" value={formData.estimatedEventFrequency} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="occasional">Thỉnh thoảng</option>
                                <option value="monthly">Hàng tháng</option>
                                <option value="quarterly">Hàng quý</option>
                                <option value="yearly">Hàng năm</option>
                                <option value="weekly">Hàng tuần</option>
                            </select>
                        </div>

                         <div className="md:col-span-2">
                            <label htmlFor="previousExperience" className="block text-sm font-medium text-gray-700">Kinh nghiệm tổ chức sự kiện trước đây (Tùy chọn)</label>
                            <textarea name="previousExperience" id="previousExperience" value={formData.previousExperience} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                    </div>
                    
                    {/* Submission */}
                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !idVerified}
                                className="w-full md:w-auto inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <FaPaperPlane className="mr-2" />
                                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BecomeOwnerPage; 