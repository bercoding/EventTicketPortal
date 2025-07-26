import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userProfileAPI } from '../services/api';
import { FaUserCircle, FaEdit, FaCamera, FaSave, FaTimes, FaKey } from 'react-icons/fa';

const OwnerStatus = () => {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'owner') {
            userProfileAPI.getOwnerRequestStatus()
                .then(response => {
                    setRequest(response.data);
                })
                .catch(err => {
                    console.error("Failed to fetch owner request status", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <div className="p-4 bg-gray-100 rounded-lg text-center">Loading status...</div>;
    }

    if (!user || user.role === 'owner') {
        return null; // Don't show anything if they are already an owner
    }

    const status = request?.status;

    if (status === 'pending' || status === 'under_review') {
        return (
            <div className="p-4 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-center">
                <h3 className="font-semibold">Request Pending</h3>
                <p className="text-sm">Your application to become an event organizer is currently under review.</p>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
             <div className="p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg">
                <h3 className="font-semibold text-center">Request Rejected</h3>
                <p className="text-sm mt-1">Reason: {request.rejectionReason || 'No reason provided.'}</p>
                <p className="text-sm mt-2 text-center">You may submit a new application if you wish.</p>
                <Link to="/become-owner" className="mt-3 block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Submit New Application
                </Link>
            </div>
        );
    }
    
    // Default case: 'not_submitted' or any other status
    return (
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white text-center shadow-lg">
            <h3 className="font-bold text-xl">Want to Host Your Own Events?</h3>
            <p className="mt-2 mb-4">Click below to register as an event organizer and start creating amazing experiences.</p>
            <Link to="/become-owner" className="inline-block bg-white text-indigo-600 font-semibold px-6 py-2 rounded-md hover:bg-gray-100 transition-colors">
                Become an Organizer
            </Link>
        </div>
    );
}

const ProfilePage = () => {
    const { user, setUser, checkUser } = useAuth();
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
                let userData = null;
                if (response && response.data) {
                    userData = response.data;
                } else if (response && response.success && response.data) {
                    userData = response.data;
                } else {
                    userData = response;
                }
                setProfileData(userData);
                if (userData && JSON.stringify(userData) !== JSON.stringify(user)) {
                     setUser(userData); 
                }
                setAvatarPreview(userData?.avatar); 
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Không thể tải thông tin cá nhân.');
            }
            setLoading(false);
        };
        if (user) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [setUser]);

    const handleInputChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleDateChange = (e) => {
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
            const { fullName, bio, dateOfBirth, phoneNumber } = profileData;
            const dataToUpdate = { fullName, bio, dateOfBirth, phoneNumber };
            const response = await userProfileAPI.updateUserProfile(dataToUpdate);
            let updatedData = response;
            if (response && response.data) {
                updatedData = response.data;
            } else if (response && response.success && response.data) {
                updatedData = response.data;
            }
            setProfileData(updatedData);
            setUser(updatedData);
            setSuccess('Cập nhật thông tin thành công!');
            setEditMode(false);
        } catch (err) {
            if (err.response?.status === 401) {
                try {
                    await checkUser();
                    setError('Phiên đăng nhập đã được làm mới. Vui lòng thử lại.');
                } catch (refreshError) {
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Dữ liệu không hợp lệ.');
            } else if (err.response?.status === 422) {
                setError('Thông tin nhập vào không đúng định dạng.');
            } else {
                setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật thông tin.');
            }
        }
        setLoading(false);
    };

    const getAvatarUrl = (avatar) => {
      if (!avatar) return null;
      if (avatar.startsWith('http')) return avatar;
      return `http://localhost:5001/${avatar.replace(/^\/+/,'')}`;
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
        formData.append('avatar', avatarFile);
        try {
            const response = await userProfileAPI.updateUserAvatar(formData);
            const profileRes = await userProfileAPI.getCurrentUserProfile();
            const userData = profileRes?.data || profileRes;
            setProfileData(userData);
            setUser(userData);
            setAvatarPreview(userData.avatar);
            setAvatarFile(null);
            setSuccess(response.data.message || 'Cập nhật ảnh đại diện thành công!');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật ảnh đại diện.');
        }
        setLoading(false);
    };

    if (loading && !profileData) {
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Đang tải thông tin cá nhân...</p></div>;
    }
    if (!profileData && error && !loading) { 
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-red-500">{error}</p></div>;
    }
    if (!profileData && !loading) { 
        return <div className="flex justify-center items-center h-screen"><p className="text-xl text-gray-500">Không thể tải dữ liệu người dùng.</p></div>;
    }
    const formattedDateOfBirth = profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '';
    return (
        <div className="bg-gradient-to-br from-[#0a192f] to-[#101820] min-h-screen w-full">
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-center">Hồ Sơ Cá Nhân</h1>
            {error && <div className="mb-4 p-3 bg-red-900/80 text-red-200 border border-red-400 rounded-md text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-900/80 text-green-200 border border-green-400 rounded-md text-sm">{success}</div>}
            <div className="bg-[#101820] shadow-xl rounded-lg overflow-hidden md:flex mb-8 border border-[#22304a]">
                <div className="md:w-1/3 bg-gradient-to-br from-blue-900/80 to-indigo-900/80 p-6 md:p-8 text-center flex flex-col items-center justify-center">
                    {(() => {
                        if (avatarPreview) {
                            const isBase64 = typeof avatarPreview === 'string' && avatarPreview.startsWith('data:image');
                            const src = isBase64 ? avatarPreview : getAvatarUrl(avatarPreview);
                            return (
                                <img 
                                    src={src}
                                    alt="Avatar" 
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-4"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                />
                            );
                        } else {
                            return <FaUserCircle className="w-32 h-32 md:w-40 md:h-40 text-white opacity-75 mx-auto mb-4" />;
                        }
                    })()}
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
                        <div className="flex flex-col gap-2 w-full">
                            <button 
                                onClick={handleSubmitAvatar}
                                disabled={loading}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 text-sm disabled:opacity-50"
                            >
                                {loading ? 'Đang xử lý...' : 'Lưu ảnh mới'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAvatarFile(null); setAvatarPreview(profileData?.avatar || null); }}
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-200 text-sm"
                                disabled={loading}
                            >
                                Hủy
                            </button>
                        </div>
                    )}
                    <p className="text-gray-100 text-xl font-semibold mt-4">{profileData?.fullName || profileData?.username}</p>
                    <p className="text-gray-300 text-sm">{profileData?.email}</p>
                </div>
                <div className="md:w-2/3 p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-100">Thông tin chi tiết</h2>
                        <div className="flex items-center space-x-2">
                            {!editMode ? (
                                <button 
                                    onClick={() => { setEditMode(true); setError(''); setSuccess(''); }}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition duration-150"
                                >
                                    <FaEdit className="mr-2"/> Chỉnh sửa
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleSubmitProfile}
                                        disabled={loading}
                                        className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition duration-150 disabled:opacity-50"
                                    >
                                        <FaSave className="mr-2"/> {loading ? 'Đang xử lý...': 'Lưu thay đổi'}
                                    </button>
                                    <button 
                                        onClick={() => { 
                                            setEditMode(false); 
                                            setError(''); 
                                            setSuccess(''); 
                                        }}
                                        className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition duration-150"
                                    >
                                        <FaTimes className="mr-2"/> Hủy
                                    </button>
                                </>
                            )}
                            <Link 
                                to="/profile/change-password"
                                className="flex items-center text-orange-600 hover:text-orange-700 font-medium py-2 px-3 rounded-lg hover:bg-orange-50 transition duration-150 ml-2"
                            >
                                <FaKey className="mr-2" /> Đổi mật khẩu
                            </Link>
                        </div>
                    </div>
                    {profileData && (
                        <form onSubmit={handleSubmitProfile} className="space-y-5">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Tên đăng nhập</label>
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
                                    <p className="text-gray-100 text-base bg-[#181f2e] p-2.5 rounded-lg">{profileData.username}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Họ và tên</label>
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
                                    <p className="text-gray-100 text-base bg-[#181f2e] p-2.5 rounded-lg">{profileData.fullName || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Tiểu sử</label>
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
                                    <p className="text-gray-100 text-base bg-[#181f2e] p-2.5 rounded-lg min-h-[60px] whitespace-pre-wrap">{profileData.bio || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-1">Ngày sinh</label>
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
                                    <p className="text-gray-100 text-base bg-[#181f2e] p-2.5 rounded-lg">
                                        {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <p className="text-gray-100 text-base bg-[#222b3a] p-2.5 rounded-lg cursor-not-allowed">{profileData.email} (Không thể thay đổi)</p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            <div className="w-full max-w-4xl mx-auto mt-8">
                <OwnerStatus />
            </div>
          </div>
        </div>
    );
};

export default ProfilePage;
