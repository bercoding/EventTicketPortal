import React from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faImages,
  faInfoCircle,
  faRulerCombined,
  faFileAlt,
  faUserTie,
  faClock,
  faTicketAlt,
  faUsers,
  faCog,
  faMoneyBillWave,
  faMapMarkedAlt,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import useCreateEventLogic from '../../hooks/useCreateEventLogic';
import ImageUpload from '../../components/event/ImageUpload';
import FormSection from '../../components/event/FormSection';
import TicketType from '../../components/event/TicketType';
import SeatingMapSection from '../../components/event/SeatingMapSection';
import VenueLayout from '../../components/event/VenueLayout';
import NavigationButtons from '../../components/event/NavigationButtons';
import ProgressBar from '../../components/event/ProgressBar';
import Sidebar from '../../components/event/Sidebar';

const CreateEvent = () => {
  const location = useLocation();
  const templateInfo = location.state;
  
  const {
    formData,
    provinces,
    districts,
    wards,
    selectedProvinceCode,
    selectedDistrictCode,
    selectedWardCode,
    currentStep,
    handleChange,
    handleImageUpload,
    handleOrganizerLogoUpload,
    handleNextStep,
    handlePrevStep,
    handleAddSeatingMapSection,
    handleRemoveSeatingMapSection,
    handleSeatingMapSectionChange,
    handleAddTicketType,
    handleRemoveTicketType,
    handleTicketTypeChange,
    handleFinalSubmit,
    handleCategoryChange,
    handleTagsChange,
    handleVenueLayoutChange,
    loading,
    user,
    // Template variables
    isOnlineEvent,
    isGeneralEvent,
    isSeatingEvent
  } = useCreateEventLogic(templateInfo);

  // Set location type based on template - PHẢI ĐẶT TRƯỚC EARLY RETURN
  React.useEffect(() => {
    if (templateInfo?.templateType && formData.location.type !== (isOnlineEvent ? 'online' : 'offline')) {
      handleChange({
        target: {
          name: 'location.type',
          value: isOnlineEvent ? 'online' : 'offline'
        }
      });
    }
  }, [templateInfo, formData.location.type, handleChange, isOnlineEvent]);

  if (!user || user.role !== 'event_owner') {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-900 text-white min-h-screen">
        <div className="bg-red-700 text-white px-4 py-3 rounded">
          Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với vai trò Event Owner.
        </div>
      </div>
    );
  }

  // Xác định tiêu đề dựa trên template
  const getPageTitle = () => {
    if (isOnlineEvent) {
      return '🌐 Tạo Sự Kiện Trực Tuyến';
    }
    if (isGeneralEvent) {
      return '🎪 Tạo Sự Kiện Tham Gia Tự Do';
    }
    return '📝 Tạo Sự Kiện Mới';
  };

  const getPageDescription = () => {
    if (isOnlineEvent) {
      return 'Tạo sự kiện hoàn toàn trực tuyến với link tham gia';
    }
    if (isGeneralEvent) {
      return 'Tạo sự kiện ngoài trời hoặc không gian mở, không ghế ngồi cố định';
    }
    return 'Tạo sự kiện với các tính năng tùy chỉnh';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-10">
        <ProgressBar currentStep={currentStep} />
        
        <h1 className="text-4xl font-extrabold mb-10 text-white text-center">
          {getPageTitle()}
        </h1>
        
        {templateInfo && (
          <div className="text-center mb-6">
            <span className={`text-white px-4 py-2 rounded-full text-sm ${
              isOnlineEvent ? 'bg-orange-600' : 
              isGeneralEvent ? 'bg-green-600' : 
              'bg-blue-600'
            }`}>
              {isOnlineEvent ? '🌐' : isGeneralEvent ? '🎪' : '📋'} Template: {templateInfo.templateName}
            </span>
          </div>
        )}

        <form onSubmit={currentStep === 4 ? handleFinalSubmit : handleNextStep} className="space-y-10">
          {currentStep === 1 && (
            <div className="space-y-10">
              {/* upload image */}
              <FormSection title="Upload hình ảnh" icon={faImages}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUpload
                    image={formData.images.logo}
                    handleImageUpload={handleImageUpload}
                    type="logo"
                    title="Thêm logo sự kiện"
                    description="(Tỷ lệ 720x950, tối đa 5MB)"
                  />
                  <ImageUpload
                    image={formData.images.banner}
                    handleImageUpload={handleImageUpload}
                    type="banner"
                    title="Thêm ảnh nền sự kiện"
                    description="(Tỷ lệ 1200x720, tối đa 10MB)"
                  />
                </div>
              </FormSection>

              {/* basic info */}
              <FormSection title="Thông tin cơ bản" icon={faInfoCircle}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Tên sự kiện <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      placeholder="Ví dụ: Hòa nhạc mùa hè 2024"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                    <p className="text-right text-xs text-gray-400 mt-1">{formData.title.length}/100</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">Địa chỉ sự kiện <span className="text-red-500">*</span></label>
                    <div className="flex space-x-6">
                      <label className={`inline-flex items-center text-gray-300 cursor-pointer ${
                        isOnlineEvent ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        <input
                          type="radio"
                          name="location.type"
                          value="offline"
                          checked={formData.location.type === 'offline'}
                          onChange={handleChange}
                          disabled={isOnlineEvent}
                          className="form-radio h-5 w-5 text-green-500 border-gray-600 bg-gray-700 focus:ring-green-500 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50"
                        />
                        <span className="ml-2 text-base">
                          Sự kiện Offline
                          {isOnlineEvent && <span className="text-gray-500 text-sm ml-1">(Không khả dụng cho template này)</span>}
                        </span>
                      </label>
                      <label className={`inline-flex items-center text-gray-300 cursor-pointer ${
                        (isGeneralEvent && formData.location.type === 'offline') ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        <input
                          type="radio"
                          name="location.type"
                          value="online"
                          checked={formData.location.type === 'online'}
                          onChange={handleChange}
                          disabled={isGeneralEvent && formData.location.type === 'offline'}
                          className="form-radio h-5 w-5 text-green-500 border-gray-600 bg-gray-700 focus:ring-green-500 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50"
                        />
                        <span className="ml-2 text-base">
                          Sự kiện Online
                          {isGeneralEvent && <span className="text-gray-500 text-sm ml-1">(Khuyến nghị offline cho template này)</span>}
                        </span>
                      </label>
                    </div>
                    
                    {/* Thông tin template */}
                    {templateInfo && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${
                        isOnlineEvent ? 'bg-orange-900/20 border border-orange-700' :
                        isGeneralEvent ? 'bg-green-900/20 border border-green-700' :
                        'bg-blue-900/20 border border-blue-700'
                      }`}>
                        <p className={`font-medium ${
                          isOnlineEvent ? 'text-orange-400' :
                          isGeneralEvent ? 'text-green-400' :
                          'text-blue-400'
                        }`}>
                          {isOnlineEvent ? '🌐 Template Online:' :
                           isGeneralEvent ? '🎪 Template Tự Do:' :
                           '🪑 Template Ghế Ngồi:'} {templateInfo.templateName}
                        </p>
                        <p className="text-gray-300 mt-1">
                          {isOnlineEvent ? 'Sự kiện hoàn toàn trực tuyến, không cần địa điểm vật lý' :
                           isGeneralEvent ? 'Sự kiện ngoài trời hoặc không gian mở, không ghế ngồi cố định' :
                           'Sự kiện trong nhà với ghế ngồi được sắp xếp theo sơ đồ cố định'}
                        </p>
                      </div>
                    )}
                  </div>

                  {formData.location.type === 'online' && (
                    <div className="space-y-6">
                      <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4 mb-6">
                        <h3 className="text-orange-400 font-semibold mb-2">🌐 Sự kiện Online</h3>
                        <p className="text-gray-300 text-sm">
                          Vui lòng cung cấp thông tin kết nối cho người tham dự sự kiện trực tuyến của bạn.
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-2">Nền tảng trực tuyến <span className="text-red-500">*</span></label>
                        <select
                          id="platform"
                          name="location.platform"
                          value={formData.location.platform}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        >
                          <option value="">Chọn nền tảng</option>
                          <option value="zoom">Zoom</option>
                          <option value="google-meet">Google Meet</option>
                          <option value="microsoft-teams">Microsoft Teams</option>
                          <option value="facebook-live">Facebook Live</option>
                          <option value="youtube-live">YouTube Live</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-300 mb-2">
                          Link tham gia <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          id="meetingLink"
                          name="location.meetingLink"
                          value={formData.location.meetingLink}
                          onChange={handleChange}
                          required
                          placeholder="https://zoom.us/j/... hoặc https://meet.google.com/..."
                          className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          💡 Tip: Link này sẽ được gửi cho người tham dự sau khi đăng ký thành công
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {formData.location.type === 'offline' && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="venueName" className="block text-sm font-medium text-gray-300 mb-2">Tên địa điểm <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          id="venueName"
                          name="location.venueName"
                          value={formData.location.venueName}
                          onChange={handleChange}
                          required
                          maxLength={80}
                          placeholder="Ví dụ: Nhà hát lớn Hà Nội"
                          className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        />
                        <p className="text-right text-xs text-gray-400 mt-1">{formData.location.venueName.length}/80</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">Tỉnh/Thành</label>
                          <select
                            id="city"
                            name="location.city"
                            value={selectedProvinceCode}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                          >
                            <option value="">Chọn Tỉnh/Thành</option>
                            {provinces.map(province => (
                              <option key={province.code} value={province.code}>
                                {province.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="district" className="block text-sm font-medium text-gray-300 mb-2">Quận/Huyện</label>
                          <select
                            id="district"
                            name="location.district"
                            value={selectedDistrictCode}
                            onChange={handleChange}
                            disabled={!selectedProvinceCode || districts.length === 0}
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Quận/Huyện</option>
                            {districts.map(district => (
                              <option key={district.code} value={district.code}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="ward" className="block text-sm font-medium text-gray-300 mb-2">Phường/Xã</label>
                          <select
                            id="ward"
                            name="location.ward"
                            value={selectedWardCode}
                            onChange={handleChange}
                            disabled={!selectedDistrictCode || wards.length === 0}
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Phường/Xã</option>
                            {wards.map(ward => (
                              <option key={ward.code} value={ward.code}>
                                {ward.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">Số nhà, đường <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            id="address"
                            name="location.address"
                            value={formData.location.address}
                            onChange={handleChange}
                            required
                            maxLength={80}
                            placeholder="Ví dụ: 123 Phố Huế"
                            className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                          />
                          <p className="text-right text-xs text-gray-400 mt-1">{formData.location.address.length}/80</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FormSection>

              {/* event types */}
              <FormSection title="Thể loại sự kiện" icon={faRulerCombined}>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Chọn thể loại <span className="text-red-500">*</span></label>
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
              </FormSection>

              {/* event detail info */}
              <FormSection title="Giới thiệu & Chi tiết sự kiện" icon={faInfoCircle}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Giới thiệu sự kiện <span className="text-red-500">*</span></label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    ></textarea>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">Chi tiết sự kiện:</label>
                    <div>
                      <label htmlFor="mainProgram" className="block text-xs font-medium text-gray-400 mb-1">Chương trình chính: [Liệt kê những hoạt động nổi bật trong sự kiện, các phần trình diễn, khách mời đặc biệt, kịch trình các tiết mục cụ thể nếu có.]</label>
                      <textarea
                        id="mainProgram"
                        name="detailedDescription.mainProgram"
                        value={formData.detailedDescription.mainProgram}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="guests" className="block text-xs font-medium text-gray-400 mb-1">Khách mời: [Thông tin về các khách mời đặc biệt, nghệ sĩ, diễn giả sẽ tham gia sự kiện. Có thể bao gồm phần mô tả ngắn gọn về họ và những gì họ sẽ mang lại cho sự kiện.]</label>
                      <textarea
                        id="guests"
                        name="detailedDescription.guests"
                        value={formData.detailedDescription.guests}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="specialExperiences" className="block text-xs font-medium text-gray-400 mb-1">Trải nghiệm đặc biệt: [Nêu có các hoạt động đặc biệt khác như workshop, khu trải nghiệm, photo booth, khu vực check-in hay các phần quà/ưu đãi dành riêng cho người tham dự.]</label>
                      <textarea
                        id="specialExperiences"
                        name="detailedDescription.specialExperiences"
                        value={formData.detailedDescription.specialExperiences}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* terms and conditions */}
              <FormSection title="Điều khoản và điều kiện" icon={faFileAlt}>
                <div>
                  <textarea
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Nhập các điều khoản và điều kiện áp dụng cho sự kiện của bạn."
                    className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  ></textarea>
                </div>
              </FormSection>

              {/* organizing committee info */}

            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-10">
              {/* time & capacity */}
              <FormSection title="Thời gian & Sức chứa" icon={faClock}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Ngày bắt đầu <span className="text-red-500">*</span></label>
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
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">Ngày kết thúc <span className="text-red-500">*</span></label>
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
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-2">Sức chứa <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Số lượng người tham dự tối đa"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  {/* Chỉ hiển thị venue layout cho sự kiện có ghế ngồi */}
                  {formData.location.type === 'offline' && !isGeneralEvent && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-4">Mô hình khán đài <span className="text-red-500">*</span></label>
                      <VenueLayout 
                        selectedLayout={formData.location.venueLayout}
                        onLayoutChange={handleVenueLayoutChange}
                      />
                    </div>
                  )}

                  {/* Hiển thị thông tin khác cho sự kiện online */}
                  {isOnlineEvent && (
                    <div className="col-span-2">
                      <div>
                        <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-300 mb-2">Link tham gia <span className="text-red-500">*</span></label>
                        <input
                          type="url"
                          id="meetingLink"
                          name="location.meetingLink"
                          value={formData.location.meetingLink || ''}
                          onChange={handleChange}
                          required={isOnlineEvent}
                          placeholder="https://zoom.us/j/123456789 hoặc https://meet.google.com/abc-defg-hij"
                          className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        />
                        <p className="text-xs text-gray-400 mt-1">Link sẽ được gửi qua email cho người tham gia</p>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-2">Nền tảng</label>
                        <select
                          id="platform"
                          name="location.platform"
                          value={formData.location.platform || 'zoom'}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        >
                          <option value="zoom">Zoom</option>
                          <option value="google-meet">Google Meet</option>
                          <option value="microsoft-teams">Microsoft Teams</option>
                          <option value="facebook-live">Facebook Live</option>
                          <option value="youtube-live">YouTube Live</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Thông tin bổ sung cho sự kiện general */}
                  {isGeneralEvent && (
                    <div className="col-span-2">
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <h4 className="text-green-400 font-medium mb-2">🎪 Sự kiện tham gia tự do</h4>
                        <p className="text-gray-300 text-sm">
                          Sự kiện này không có ghế ngồi cố định. Khách hàng sẽ mua vé theo khu vực và tự do di chuyển trong khu vực đó.
                        </p>
                        <ul className="text-gray-400 text-sm mt-2 space-y-1">
                          <li>• Không cần sơ đồ ghế ngồi</li>
                          <li>• Quản lý theo số lượng người/khu vực</li>
                          <li>• Phù hợp cho festival, hội chợ, workshop</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </FormSection>

              {/* manage ticket types */}
              <FormSection title="Quản lý loại vé" icon={faTicketAlt}>
                <p className="text-gray-400 mb-4">Thêm các loại vé và số lượng cho sự kiện của bạn.</p>
                <div className="space-y-4">
                  {formData.ticketTypes.map((ticket, index) => (
                    <TicketType
                      key={index}
                      ticket={ticket}
                      index={index}
                      handleTicketTypeChange={handleTicketTypeChange}
                      handleRemoveTicketType={handleRemoveTicketType}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTicketType}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" /> Thêm loại vé
                  </button>
                </div>
              </FormSection>

              {/* Cấu hình sơ đồ khán đài - chỉ cho sự kiện có ghế ngồi */}
              {formData.location.type === 'offline' && !isGeneralEvent && (
                <FormSection title="Cấu hình sơ đồ khán đài" icon={faUsers}>
                  <p className="text-gray-400 mb-4">Thêm các khu vực (section) và số lượng chỗ ngồi cho từng khu vực trên sơ đồ khán đài của bạn.</p>
                  <div className="space-y-4">
                    {formData.seatingMap.sections.map((section, index) => (
                      <SeatingMapSection
                        key={index}
                        section={section}
                        index={index}
                        handleSeatingMapSectionChange={handleSeatingMapSectionChange}
                        handleRemoveSeatingMapSection={handleRemoveSeatingMapSection}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleAddSeatingMapSection}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" /> Thêm khu vực
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Thông tin bổ sung cho sự kiện general */}
              {isGeneralEvent && (
                <FormSection title="Quản lý khu vực" icon={faMapMarkedAlt}>
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <h4 className="text-green-400 font-medium mb-3">🌳 Quản lý theo khu vực linh hoạt</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Sự kiện tự do không cần sơ đồ ghế cố định. Bạn chỉ cần tạo các loại vé theo khu vực (VIP, General, etc.) ở phần "Quản lý loại vé" phía trên.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="text-green-300 font-medium mb-2">✅ Ưu điểm:</h5>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Khách tự do di chuyển</li>
                          <li>• Không cần chọn ghế cụ thể</li>
                          <li>• Phù hợp sự kiện outdoor</li>
                          <li>• Tương tác tự nhiên</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-yellow-300 font-medium mb-2">📋 Ví dụ phù hợp:</h5>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Festival âm nhạc ngoài trời</li>
                          <li>• Hội chợ, triển lãm</li>
                          <li>• Workshop, hội thảo</li>
                          <li>• Networking event</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </FormSection>
              )}

              {/* Thông tin cho sự kiện online */}
              {isOnlineEvent && (
                <FormSection title="Cài đặt sự kiện online" icon={faGlobe}>
                  <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                    <h4 className="text-orange-400 font-medium mb-3">🌐 Sự kiện hoàn toàn trực tuyến</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Sự kiện online không cần địa điểm vật lý. Người tham gia sẽ nhận link tham gia qua email sau khi mua vé.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="text-orange-300 font-medium mb-2">🚀 Tính năng:</h5>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Không giới hạn địa lý</li>
                          <li>• Link tự động gửi email</li>
                          <li>• Hỗ trợ nhiều nền tảng</li>
                          <li>• Quản lý số lượng tham gia</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-blue-300 font-medium mb-2">💡 Lưu ý:</h5>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Chuẩn bị link trước sự kiện</li>
                          <li>• Test kết nối trước</li>
                          <li>• Có phương án dự phòng</li>
                          <li>• Hướng dẫn người dùng</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </FormSection>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-10">
              {/* setting event */}
              <FormSection title="Cài đặt sự kiện" icon={faCog}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-2">Chế độ hiển thị <span className="text-red-500">*</span></label>
                    <select
                      id="visibility"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    >
                      <option value="public">Công khai</option>
                      <option value="private">Riêng tư</option>
                      <option value="featured">Nổi bật</option>
                    </select>
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
              </FormSection>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-10">
              {/* payment info */}
              <FormSection title="Thông tin thanh toán" icon={faMoneyBillWave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-300 mb-2">Tên ngân hàng</label>
                    <input
                      type="text"
                      id="bankName"
                      name="payment.bankName"
                      value={formData.payment?.bankName || ''}
                      onChange={handleChange}
                      placeholder="Ví dụ: Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300 mb-2">Số tài khoản</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="payment.accountNumber"
                      value={formData.payment?.accountNumber || ''}
                      onChange={handleChange}
                      placeholder="Ví dụ: 001100123456789"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-300 mb-2">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      id="accountHolderName"
                      name="payment.accountHolderName"
                      value={formData.payment?.accountHolderName || ''}
                      onChange={handleChange}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-300 mb-2">Chi nhánh</label>
                    <input
                      type="text"
                      id="branch"
                      name="payment.branch"
                      value={formData.payment?.branch || ''}
                      onChange={handleChange}
                      placeholder="Ví dụ: Chi nhánh Hà Nội"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="swiftBic" className="block text-sm font-medium text-gray-300 mb-2">Mã SWIFT/BIC (nếu có)</label>
                    <input
                      type="text"
                      id="swiftBic"
                      name="payment.swiftBic"
                      value={formData.payment?.swiftBic || ''}
                      onChange={handleChange}
                      placeholder="Ví dụ: BFTVVNVX"
                      className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-700 text-white p-3 shadow-sm focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          <NavigationButtons
            currentStep={currentStep}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            onSubmit={handleFinalSubmit}
            loading={loading}
          />
        </form>
      </main>
    </div>
  );
};

export default CreateEvent; 