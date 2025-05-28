import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { userProfileAPI } from '../services/api';
import { FaUserCircle, FaEdit, FaCamera, FaSave, FaTimes } from 'react-icons/fa';

const ProfilePage = () => {
    const { user, setUser } = useContext(AuthContext); // Lấy user và hàm setUser từ context
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await userProfileAPI.getCurrentUserProfile();
                setProfileData(response.data);
                // Cập nhật lại user trong context nếu cần, hoặc đảm bảo user từ context đã là mới nhất
                if (JSON.stringify(response.data) !== JSON.stringify(user)) {
                     setUser(response.data); // Cập nhật context nếu dữ liệu từ API khác context
                }
                setAvatarPreview(response.data.avatar); 
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Không thể tải thông tin cá nhân.');
            }
            setLoading(false);
        };

        fetchProfile();
    }, [setUser, user]); // Thêm user vào dependency array để fetch lại nếu user context thay đổi từ nguồn khác

    const handleInputChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleDateChange = (e) => {
        // Đảm bảo dateOfBirth được lưu ở định dạng YYYY-MM-DD cho input type="date"
        // Hoặc null nếu người dùng xóa ngày
        setProfileData({ ...profileData, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString().split('T')[0] : null });
        setError('');
        setSuccess('');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError('');
            setSuccess('');
        }
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Chỉ gửi các trường được phép chỉnh sửa
            const { fullName, bio, dateOfBirth, phoneNumber, username } = profileData;
            const dataToUpdate = { fullName, bio, dateOfBirth, phoneNumber, username };
            
            const response = await userProfileAPI.updateUserProfile(dataToUpdate);
            setProfileData(response.data);
            setUser(response.data); // Cập nhật lại user trong context
            setSuccess('Cập nhật thông tin thành công!');
            setEditMode(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật thông tin.');
        }
        setLoading(false);
    };

    const handleSubmitAvatar = async () => {
        if (!avatarFile) {
            setError('Vui lòng chọn một file ảnh.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        const formData = new FormData();
        formData.append('avatarFile', avatarFile);

        try {
            const response = await userProfileAPI.updateUserAvatar(formData);
            setProfileData(prev => ({...prev, avatar: response.data.avatar }));
            setUser(prev => ({...prev, avatar: response.data.avatar })); // Cập nhật avatar trong context
            setAvatarPreview(response.data.avatar); // Cập nhật preview với URL từ server
            setAvatarFile(null); // Reset file input
            setSuccess(response.data.message || 'Cập nhật ảnh đại diện thành công!');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật ảnh đại diện.');
        }
        setLoading(false);
    };

    if (loading && !profileData) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Đang tải thông tin cá nhân...</p></div>;
    }

    if (!profileData && error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-500">{error}</p></div>;
    }
    
    if (!profileData) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Không có dữ liệu người dùng.</p></div>;
    }

    // Định dạng ngày tháng cho input type date (YYYY-MM-DD)
    const formattedDateOfBirth = profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '';

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">Hồ Sơ Cá Nhân</h1>
            
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{success}</div>}

            <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
                {/* Avatar Section */}
                <div className="md:w-1/3 bg-gradient-to-br from-green-500 to-blue-600 p-6 md:p-8 text-center flex flex-col items-center justify-center">
                    {avatarPreview ? (
                        <img 
                            src={avatarPreview} 
                            alt="Avatar" 
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-4"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} // Fallback image
                        />
                    ) : (
                        <FaUserCircle className="w-32 h-32 md:w-40 md:h-40 text-white opacity-75 mx-auto mb-4" />
                    )}
                    <input 
                        type="file"
                        id="avatarUpload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <label 
                        htmlFor="avatarUpload"
                        className="cursor-pointer inline-flex items-center justify-center bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-100 transition duration-200 text-sm mb-2"
                    >
                        <FaCamera className="mr-2" /> Thay đổi ảnh
                    </label>
                    {avatarFile && (
                        <button 
                            onClick={handleSubmitAvatar}
                            disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 text-sm disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu ảnh mới'}
                        </button>
                    )}
                    <p className="text-white text-xl font-semibold mt-4">{profileData.fullName || profileData.username}</p>
                    <p className="text-gray-200 text-sm">{profileData.email}</p>
                </div>

                {/* Profile Info Section */}
                <div className="md:w-2/3 p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-700">Thông tin chi tiết</h2>
                        {!editMode ? (
                            <button 
                                onClick={() => setEditMode(true)}
                                className="flex items-center text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition duration-150"
                            >
                                <FaEdit className="mr-2"/> Chỉnh sửa
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={handleSubmitProfile}
                                    disabled={loading}
                                    className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                                >
                                    <FaSave className="mr-2"/> {loading ? 'Đang lưu...': 'Lưu thay đổi'}
                                </button>
                                <button 
                                    onClick={() => { setEditMode(false); setError(''); setSuccess(''); /* fetchProfile(); // Optionally re-fetch original data */ }}
                                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition duration-150"
                                >
                                    <FaTimes className="mr-2"/> Hủy
                                </button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmitProfile} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">Tên đăng nhập</label>
                            {editMode ? (
                                <input 
                                    type="text" 
                                    name="username"
                                    id="username"
                                    value={profileData.username || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                />
                            ) : (
                                <p className="text-gray-800 text-base bg-gray-50 p-2.5 rounded-lg">{profileData.username}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 mb-1">Họ và tên</label>
                            {editMode ? (
                                <input 
                                    type="text" 
                                    name="fullName"
                                    id="fullName"
                                    value={profileData.fullName || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                    placeholder="Nhập họ và tên của bạn"
                                />
                            ) : (
                                <p className="text-gray-800 text-base bg-gray-50 p-2.5 rounded-lg">{profileData.fullName || 'Chưa cập nhật'}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-600 mb-1">Tiểu sử</label>
                            {editMode ? (
                                <textarea 
                                    name="bio"
                                    id="bio"
                                    rows="3"
                                    value={profileData.bio || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                    placeholder="Giới thiệu ngắn về bạn..."
                                ></textarea>
                            ) : (
                                <p className="text-gray-800 text-base bg-gray-50 p-2.5 rounded-lg min-h-[60px]">{profileData.bio || 'Chưa cập nhật'}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                            {editMode ? (
                                <input 
                                    type="tel" 
                                    name="phoneNumber"
                                    id="phoneNumber"
                                    value={profileData.phoneNumber || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                    placeholder="Nhập số điện thoại"
                                />
                            ) : (
                                <p className="text-gray-800 text-base bg-gray-50 p-2.5 rounded-lg">{profileData.phoneNumber || 'Chưa cập nhật'}</p>
                            )}
                        </div>
                         <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-600 mb-1">Ngày sinh</label>
                            {editMode ? (
                                <input 
                                    type="date" 
                                    name="dateOfBirth"
                                    id="dateOfBirth"
                                    value={formattedDateOfBirth}
                                    onChange={handleDateChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                />
                            ) : (
                                <p className="text-gray-800 text-base bg-gray-50 p-2.5 rounded-lg">
                                    {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <p className="text-gray-800 text-base bg-gray-100 p-2.5 rounded-lg cursor-not-allowed">{profileData.email} (Không thể thay đổi)</p>
                        </div>
                        {/* Nút lưu chỉ hiển thị khi ở editMode và được đặt ở header của section này */}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 