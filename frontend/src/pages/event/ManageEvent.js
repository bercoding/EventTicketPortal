import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faMapMarkerAlt, faCalendarAlt, faUsers, faTag, faUserTie, faFileAlt, faMoneyBillWave, faGlobe, faClock, faImages, faInfoCircle, faRulerCombined, faTicketAlt, faUpload } from '@fortawesome/free-solid-svg-icons';
import useManageEventLogic from '../../hooks/useManageEventLogic';
import ImageUpload from '../../components/event/ImageUpload';
import useCreateEventLogic from '../../hooks/useCreateEventLogic';
import { uploadImage } from '../../services/api';

const ManageEvent = () => {
  const { id: eventId } = useParams();
  
  // Call hooks first, before any early returns
  const {
    loading,
    event,
    isEditing,
    setIsEditing,
    formData,
    handleChange,
    handleSubmit,
    handleDelete,
    user,
    handleCategoryChange,
    handleTagsChange,
    handleImageChange // lấy hàm này
  } = useManageEventLogic(eventId);

  // Lấy logic dropdown tỉnh thành từ useCreateEventLogic
  const {
    provinces,
    selectedProvinceCode,
    handleChange: handleChangeDropdown
  } = useCreateEventLogic();

  // Tự động bật chế độ chỉnh sửa nếu user là event_owner và là organizer
  React.useEffect(() => {
    if (
      user &&
      user.role === 'event_owner' &&
      event &&
      event.organizers &&
      event.organizers.some(organizer => organizer._id === user._id)
    ) {
      setIsEditing(true);
    }
  }, [user, event, setIsEditing]);

  // Early validation to prevent null eventId API calls
  if (!eventId || eventId === 'null' || eventId === 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-10">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-4">🚫 URL không hợp lệ</h2>
          <p className="mb-4">ID sự kiện không tồn tại hoặc không hợp lệ</p>
          <Link to="/events" className="bg-green-500 px-6 py-3 rounded-lg hover:bg-green-600 text-white">
            Về trang sự kiện
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-10">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-10">
        <div className="text-center text-red-600">Không tìm thấy sự kiện</div>
      </div>
    );
  }

  if (!user || user.role !== 'event_owner' || !event?.organizers?.some(organizer => organizer._id === user._id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-10">
        <div className="bg-red-700 text-white px-6 py-4 rounded-xl shadow-lg mb-8 text-center text-lg">
          Bạn không có quyền quản lý sự kiện này
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-10">
      <div className="max-w-7xl mx-auto bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-700">
          <h1 className="text-5xl font-extrabold text-green-400 mb-4 md:mb-0">Chi tiết sự kiện</h1>
          <div className="flex flex-wrap justify-center md:justify-end space-x-4">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center shadow-lg"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2" /> Chỉnh sửa
                </button>
                <button
                  onClick={handleDelete}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center shadow-lg"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" /> Xóa
                </button>
                <Link
                  to={`/events/manage-tickets/${event._id}`}
                  className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center shadow-lg"
                >
                  <FontAwesomeIcon icon={faTicketAlt} className="mr-2" /> Quản lý vé
                </Link>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* edit */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-3" /> Thông tin cơ bản
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Tên sự kiện</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Chọn thể loại</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category[0] || ''}
                    onChange={handleCategoryChange}
                    placeholder="Nhập thể loại sự kiện"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">Thẻ (Tags)</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    placeholder="Ví dụ: âm nhạc, thể thao, nghệ thuật (phân cách bằng dấu phẩy)"
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-400 mt-1">Phân cách các thẻ bằng dấu phẩy (,)</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-3" /> Thời gian & Sức chứa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-2">Sức chứa</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3" /> Địa điểm
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="venueName" className="block text-sm font-medium text-gray-300 mb-2">Tên địa điểm</label>
                  <input
                    type="text"
                    id="venueName"
                    name="venueName"
                    value={formData.location.venueName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.location.address}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                {/* Thành phố (dropdown) */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">Thành phố</label>
                  <select
                    id="city"
                    name="location.city"
                    value={selectedProvinceCode || ''}
                    onChange={handleChangeDropdown}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  >
                    <option value="">Chọn Tỉnh/Thành</option>
                    {provinces && provinces.map(province => (
                      <option key={province.code} value={province.code}>{province.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">Quốc gia</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.location.country}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-3" /> Chi tiết sự kiện
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="mainProgram" className="block text-sm font-medium text-gray-300 mb-2">Chương trình chính</label>
                  <textarea
                    id="mainProgram"
                    name="detailedDescription.mainProgram"
                    value={formData.detailedDescription.mainProgram}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-300 mb-2">Khách mời</label>
                  <textarea
                    id="guests"
                    name="detailedDescription.guests"
                    value={formData.detailedDescription.guests}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="specialExperiences" className="block text-sm font-medium text-gray-300 mb-2">Trải nghiệm đặc biệt</label>
                  <textarea
                    id="specialExperiences"
                    name="detailedDescription.specialExperiences"
                    value={formData.detailedDescription.specialExperiences}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>



            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faImages} className="mr-3" /> Hình ảnh sự kiện
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="Ảnh bìa sự kiện"
                  imageUrl={formData.images.banner}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const result = await uploadImage(file, 'banner');
                      if (result.success) {
                        handleImageChange('banner', result.url);
                      } else {
                        alert(result.message || 'Upload ảnh thất bại');
                      }
                    }
                  }}
                />
                <ImageUpload
                  label="Ảnh logo sự kiện"
                  imageUrl={formData.images.logo}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const result = await uploadImage(file, 'logo');
                      if (result.success) {
                        handleImageChange('logo', result.url);
                      } else {
                        alert(result.message || 'Upload ảnh thất bại');
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faFileAlt} className="mr-3" /> Điều khoản & Điều kiện
              </h2>
              <textarea
                id="termsAndConditions"
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                rows={6}
                className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
              />
            </div>



            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 shadow-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 shadow-lg"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* info event */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-64 w-full bg-gray-700 rounded-xl overflow-hidden shadow-lg">
                <img src={event.images.banner || 'https://via.placeholder.com/600x400?text=Event+Banner'} alt="Banner sự kiện" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
                <h2 className="absolute bottom-4 left-4 text-4xl font-extrabold text-white leading-tight">{event.title}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-lg text-gray-300"><strong>Mô tả:</strong> {event.description}</p>
                <p className="text-gray-300"><FontAwesomeIcon icon={faTag} className="mr-2 text-blue-400" /> <strong>Thể loại:</strong> {event.category.join(', ')}</p>
                <p className="text-gray-300"><FontAwesomeIcon icon={faTag} className="mr-2 text-purple-400" /> <strong>Thẻ:</strong> {event.tags.join(', ')}</p>
                <p className="text-gray-300"><FontAwesomeIcon icon={faGlobe} className="mr-2 text-green-400" /> <strong>Chế độ hiển thị:</strong> {event.visibility === 'public' ? 'Công khai' : event.visibility === 'private' ? 'Riêng tư' : 'Nổi bật'}</p>
              </div>
            </div>

            {/* time & capacity */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-3" /> Thời gian & Sức chứa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <p><strong>Ngày bắt đầu:</strong> {new Date(event.startDate).toLocaleString()}</p>
                <p><strong>Ngày kết thúc:</strong> {new Date(event.endDate).toLocaleString()}</p>
                <p><strong>Sức chứa:</strong> {event.capacity} người</p>
              </div>
            </div>

            {/* venue details */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3" /> Địa điểm
              </h2>
              <div className="space-y-4 text-gray-300">
                <p><strong>Loại địa điểm:</strong> {event.location.type === 'offline' ? 'Offline' : 'Online'}</p>
                {event.location.type === 'offline' && (
                  <>
                    <p><strong>Tên địa điểm:</strong> {event.location.venueName}</p>
                    <p><strong>Địa chỉ:</strong> {event.location.address}, {event.location.ward}, {event.location.district}, {event.location.city}, {event.location.country}</p>
                    <p><strong>Mô hình khán đài:</strong> {event.location.venueLayout === 'hall' ? 'Hội trường' : event.location.venueLayout === 'cinema' ? 'Rạp phim' : 'Sân vận động'}</p>
                  </>
                )}
              </div>
            </div>

            {/* detailed description */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-3" /> Chi tiết sự kiện
              </h2>
              <div className="space-y-4 text-gray-300">
                <p><strong>Chương trình chính:</strong> {event.detailedDescription.mainProgram}</p>
                <p><strong>Khách mời:</strong> {event.detailedDescription.guests}</p>
                <p><strong>Trải nghiệm đặc biệt:</strong> {event.detailedDescription.specialExperiences}</p>
              </div>
            </div>

            {/* terms and condition */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center">
                <FontAwesomeIcon icon={faFileAlt} className="mr-3" /> Điều khoản và điều kiện
              </h2>
              <p className="text-gray-300">{event.termsAndConditions}</p>
            </div>




          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvent; 