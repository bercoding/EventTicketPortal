import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImages, faInfoCircle, faMapMarkedAlt, 
  faTicketAlt, faUsers, faCog, faSave, faChair,
  faVial, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import useCreateEventLogic from '../../hooks/useCreateEventLogic';
import FormSection from '../../components/event/FormSection';
import ImageUpload from '../../components/event/ImageUpload';
import NavigationButtons from '../../components/event/NavigationButtons';
import ProgressBar from '../../components/event/ProgressBar';
import Sidebar from '../../components/event/Sidebar';
import SimpleSeatingDesigner from '../../components/seating/SimpleSeatingDesigner';
import BasicSeatingDesigner from '../../components/seating/BasicSeatingDesigner';
import api, { testBackendConnection } from '../../services/api';
import './CreateEvent.css';
import MainLayout from '../../components/layout/MainLayout';

const StepInstructions = ({ currentStep }) => {
  const instructions = {
    1: "Nhập tên sự kiện, mô tả và upload hình ảnh cho sự kiện.",
    2: "Cung cấp thời gian diễn ra và thông tin địa điểm sự kiện.",
    3: "Thiết lập các loại vé và giá vé cho sự kiện.",
    4: "Thiết kế sơ đồ chỗ ngồi và các cài đặt cuối cùng cho sự kiện."
  };

  const requirements = {
    1: "Thông tin bắt buộc: tên sự kiện, mô tả, thể loại.",
    2: "Thông tin bắt buộc: thời gian bắt đầu, kết thúc và địa điểm đầy đủ.",
    3: "Thông tin bắt buộc: ít nhất một loại vé với tên, giá và số lượng.",
    4: "Thiết kế sơ đồ chỗ ngồi và hoàn tất sự kiện."
  };

  return (
    <div className="bg-blue-900/30 p-4 rounded-lg mb-6">
      <p className="text-blue-200 font-semibold mb-1">
        Bước {currentStep}/4: {instructions[currentStep]}
      </p>
      <p className="text-blue-300 text-sm">
        {requirements[currentStep]}
      </p>
    </div>
  );
};

const FormError = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mt-4">
      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
      {message}
    </div>
  );
};

const CreateEventWithSeating = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const templateInfo = location.state || { templateType: 'seating', templateName: 'Sự kiện có chỗ ngồi' };
  
  const {
    formData,
    provinces,
    districts,
    wards,
    selectedProvinceCode,
    selectedDistrictCode,
    currentStep,
    handleChange,
    handleImageUpload,
    handleNextStep,
    handlePrevStep,
    handleAddTicketType,
    handleRemoveTicketType,
    handleTicketTypeChange,
    handleFinalSubmit,
    handleCategoryChange,
    handleTagsChange,
    handleVenueLayoutChange,
    loading,
    user,
    isSeatingEvent
  } = useCreateEventLogic({ ...templateInfo, templateType: 'seating' });

  const [formErrors, setFormErrors] = useState({});
  const [ticketColors] = useState([
    '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6'
  ]);

  // Log khi seatingMap thay đổi
  useEffect(() => {
    if (formData.seatingMap) {
      console.log("SeatingMap in formData updated:", {
        sections: formData.seatingMap?.sections?.length || 0,
        venueObjects: formData.seatingMap?.venueObjects?.length || 0
      });
    }
  }, [formData.seatingMap]);

  // Đặt màu cho mỗi loại vé
  useEffect(() => {
    if (formData.ticketTypes) {
      const updatedTypes = formData.ticketTypes.map((type, index) => {
        if (!type.color) {
          return { ...type, color: ticketColors[index % ticketColors.length] };
        }
        return type;
      });
      
      if (JSON.stringify(updatedTypes) !== JSON.stringify(formData.ticketTypes)) {
        handleChange({
          target: { name: 'ticketTypes', value: updatedTypes }
        });
      }
    }
  }, [formData.ticketTypes, ticketColors]);

  // Kiểm tra kết nối backend
  const testBackendApi = async () => {
    try {
      const result = await testBackendConnection();
      if (result.success) {
        toast.success(`Backend connection successful: ${result.message}`);
      } else {
        toast.error(`Backend connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Error testing backend connection: ${error.message}`);
    }
  };

  // Xử lý cập nhật sơ đồ chỗ ngồi
  const handleSeatingMapUpdate = (data) => {
    console.log('handleSeatingMapUpdate called with:', typeof data);
    
    try {
      const seatingMapData = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('SeatingMap data received:', { 
        sections: seatingMapData.sections?.length || 0, 
        venueObjects: seatingMapData.venueObjects?.length || 0 
      });

      // Kiểm tra kích thước data trước khi cập nhật
      const jsonSize = JSON.stringify(seatingMapData).length;
      console.log(`SeatingMap data size: ${jsonSize} bytes`);
      
      if (jsonSize > 1000000) { // > 1MB
        toast.warning('Sơ đồ ghế ngồi quá lớn, hệ thống sẽ tự động giới hạn để tránh lỗi.');
        
        // Tối ưu hóa data bằng cách giới hạn số lượng phần tử
        if (seatingMapData.sections && seatingMapData.sections.length > 0) {
          // Giới hạn số sections nếu quá nhiều
          if (seatingMapData.sections.length > 20) {
            seatingMapData.sections = seatingMapData.sections.slice(0, 20);
            toast.info('Giới hạn số khu vực (sections) trong sơ đồ.');
          }
          
          // Giới hạn số lượng đối tượng
          if (seatingMapData.venueObjects && seatingMapData.venueObjects.length > 30) {
            seatingMapData.venueObjects = seatingMapData.venueObjects.slice(0, 30);
            toast.info('Giới hạn số vật thể trong sơ đồ.');
          }
        }
      }
      
      // Cập nhật seatingMap trong formData
      handleChange({
        target: {
          name: 'seatingMap',
          value: seatingMapData
        }
      });
      
      console.log('SeatingMap in formData updated:', { 
        sections: seatingMapData.sections?.length || 0, 
        venueObjects: seatingMapData.venueObjects?.length || 0 
      });
    } catch (error) {
      console.error('Error updating seating map:', error);
      toast.error('Có lỗi khi cập nhật sơ đồ ghế ngồi.');
    }
  };

  // Hiển thị nội dung phù hợp với bước hiện tại
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="create-event-step">
            <h2 className="step-title">Thông tin cơ bản</h2>
            
            <FormSection title="Thông tin chính">
              <div className="form-group">
                <label>Tên sự kiện *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nhập tên sự kiện"
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả ngắn *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về sự kiện"
                  required
                  className="form-control"
                  rows="3"
                />
              </div>
            </FormSection>
            
            <FormSection title="Hình ảnh sự kiện">
              <div className="image-upload-grid">
                <div className="upload-section">
                  <ImageUpload
                    label="Ảnh bìa"
                    imageUrl={formData.images?.banner}
                    onChange={(e) => handleImageUpload(e, 'banner')}
                  />
                </div>
                <div className="upload-section">
                  <ImageUpload
                    label="Logo sự kiện (tùy chọn)"
                    imageUrl={formData.images?.logo}
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                </div>
              </div>
            </FormSection>
            
            <FormSection title="Danh mục & Tags">
              <div className="form-group">
                <label>Danh mục</label>
                <select
                  name="category"
                  value={formData.category[0] || ''}
                  onChange={handleCategoryChange}
                  className="form-control"
                >
                  <option value="">-- Chọn danh mục --</option>
                  <option value="music">Âm nhạc</option>
                  <option value="theater">Sân khấu - Kịch</option>
                  <option value="sports">Thể thao</option>
                  <option value="seminar">Hội thảo - Khóa học</option>
                  <option value="arts">Nghệ thuật - Triển lãm</option>
                  <option value="entertainment">Giải trí</option>
                  <option value="community">Cộng đồng</option>
                  <option value="technology">Công nghệ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Tags (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="VD: nhạc rock, trực tiếp, cuối tuần"
                  className="form-control"
                />
              </div>
            </FormSection>
          </div>
        );
        
      case 2:
        return (
          <div className="create-event-step">
            <h2 className="step-title">Thời gian & Địa điểm</h2>
            
            <FormSection title="Thời gian">
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group col-md-6">
                  <label>Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
              </div>
            </FormSection>
            
            <FormSection title="Địa điểm">
              <div className="form-group">
                <label>Loại địa điểm</label>
                <div className="venue-type-selector">
                  <label className="venue-type-option">
                    <input
                      type="radio"
                      name="location.type"
                      value="offline"
                      checked={formData.location.type === 'offline'}
                      onChange={handleChange}
                    />
                    <div className="venue-type-content">
                      <h4>Offline</h4>
                      <p>Sự kiện diễn ra tại địa điểm thực tế</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {formData.location.type === 'offline' && (
                <>
                  <div className="form-group">
                    <label>Tên địa điểm *</label>
                    <input
                      type="text"
                      name="location.venueName"
                      value={formData.location.venueName}
                      onChange={handleChange}
                      placeholder="Nhập tên địa điểm"
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Địa chỉ cụ thể *</label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      placeholder="Địa chỉ chi tiết"
                      required
                      className="form-control"
                    />
                  </div>
                  
                  {/* Thay input Thành phố thành dropdown */}
                  <div className="form-group">
                    <label>Thành phố *</label>
                    <select
                      name="location.city"
                      value={selectedProvinceCode}
                      onChange={handleChange}
                      required
                      className="form-control"
                    >
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces && provinces.map(province => (
                        <option key={province.code} value={province.code}>{province.name}</option>
                      ))}
                    </select>
                    {/* Hiển thị tên thành phố đã chọn */}
                    {formData.location.city && (
                      <input
                        type="text"
                        value={formData.location.city}
                        readOnly
                        className="form-control mt-2 bg-gray-100"
                        style={{ pointerEvents: 'none', color: '#333' }}
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Quốc gia</label>
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country || 'Vietnam'}
                      onChange={handleChange}
                      placeholder="Tên quốc gia"
                      className="form-control"
                    />
                  </div>
                </>
              )}
            </FormSection>
            
            <FormSection title="Kiểu bố trí chỗ ngồi">
              <div className="layout-options">
                <div
                  className={`layout-option ${formData.location.venueLayout === 'theater' ? 'selected' : ''}`}
                  onClick={() => handleVenueLayoutChange('theater')}
                >
                  <div className="layout-icon theater-icon"></div>
                  <div className="layout-name">Nhà hát</div>
                </div>
                
                <div
                  className={`layout-option ${formData.location.venueLayout === 'concert' ? 'selected' : ''}`}
                  onClick={() => handleVenueLayoutChange('concert')}
                >
                  <div className="layout-icon concert-icon"></div>
                  <div className="layout-name">Concert</div>
                </div>
                
                <div
                  className={`layout-option ${formData.location.venueLayout === 'stadium' ? 'selected' : ''}`}
                  onClick={() => handleVenueLayoutChange('stadium')}
                >
                  <div className="layout-icon stadium-icon"></div>
                  <div className="layout-name">SVĐ</div>
                </div>
              </div>
            </FormSection>
          </div>
        );
        
      case 3:
        return (
          <div className="create-event-step">
            <h2 className="step-title">Vé & Sơ đồ chỗ ngồi</h2>
            
            <FormSection title="Thiết lập loại vé">
              <div className="ticket-types-container">
                {formData.ticketTypes.map((ticket, index) => (
                  <div key={index} className="ticket-type-item">
                    <div className="ticket-type-header">
                      <h4>{ticket.name || `Loại vé #${index + 1}`}</h4>
                      <button
                        type="button"
                        className="remove-ticket-btn"
                        onClick={() => handleRemoveTicketType(index)}
                      >
                        Xóa
                      </button>
                    </div>
                    
                    <div className="ticket-form-row">
                      <div className="form-group">
                        <label>Tên loại vé</label>
                        <input
                          type="text"
                          name="name"
                          value={ticket.name}
                          onChange={(e) => handleTicketTypeChange(index, e)}
                          className="form-control"
                          placeholder="VIP, Thường, v.v..."
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Giá (VNĐ)</label>
                        <input
                          type="number"
                          name="price"
                          value={ticket.price}
                          onChange={(e) => handleTicketTypeChange(index, e)}
                          className="form-control"
                          min="0"
                          placeholder="Giá vé"
                        />
                      </div>
                    </div>
                    
                    <div className="ticket-form-row">
                      <div className="form-group">
                        <label>Số lượng</label>
                        <input
                          type="number"
                          name="totalQuantity"
                          value={ticket.totalQuantity}
                          onChange={(e) => handleTicketTypeChange(index, e)}
                          className="form-control"
                          min="1"
                          placeholder="Số lượng vé"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Màu hiển thị</label>
                        <input
                          type="color"
                          name="color"
                          value={ticket.color || ticketColors[index % ticketColors.length]}
                          onChange={(e) => handleTicketTypeChange(index, e)}
                          className="form-control color-picker"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Mô tả</label>
                      <textarea
                        name="description"
                        value={ticket.description}
                        onChange={(e) => handleTicketTypeChange(index, e)}
                        className="form-control"
                        placeholder="Mô tả quyền lợi của loại vé này"
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-ticket-btn"
                  onClick={handleAddTicketType}
                >
                  + Thêm loại vé
                </button>
              </div>
            </FormSection>
            
            <FormSection title="Thiết kế sơ đồ chỗ ngồi">
              <div className="form-group">
                <label>Loại bố cục</label>
                <select 
                  name="location.venueLayout"
                  value={formData.location.venueLayout || 'theater'}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Update both venueLayout in location and layoutType in seatingMap
                    handleChange({
                      target: {
                        name: 'location.venueLayout',
                        value
                      }
                    });
                    
                    // Update seatingMap layoutType to match
                    handleChange({
                      target: {
                        name: 'seatingMap.layoutType',
                        value
                      }
                    });
                  }}
                  className="form-control"
                >
                  <option value="theater">Nhà hát (Theater)</option>
                  <option value="conference">Hội nghị (Conference)</option>
                  <option value="concert">Buổi hòa nhạc (Concert)</option>
                  <option value="stadium">Sân vận động (Stadium)</option>
                  <option value="outdoor">Ngoài trời (Outdoor)</option>
                  <option value="cinema">Rạp chiếu phim (Cinema)</option>
                  <option value="custom">Tuỳ chỉnh (Custom)</option>
                </select>
              </div>
              
              <div className="seating-designer-container">
                <BasicSeatingDesigner
                    seatingMap={formData.seatingMap} 
                    setSeatingMap={handleSeatingMapUpdate} 
                    ticketTypes={formData.ticketTypes}
                  layoutType={formData.location.venueLayout || 'theater'}
                  height={600}
                />
              </div>
              
              <div className="form-group mt-4">
                <div className="seating-info">
                  <p><strong>Tổng số khu vực:</strong> {formData.seatingMap?.sections?.length || 0}</p>
                  <p><strong>Đối tượng khác:</strong> {formData.seatingMap?.venueObjects?.length || 0}</p>
                </div>
              </div>
            </FormSection>
          </div>
        );
        
      case 4:
        return (
          <div className="create-event-step">
            <h2 className="step-title">Thông tin chi tiết & Điều khoản</h2>
            
            <FormSection title="Mô tả chi tiết">
              <div className="form-group">
                <label>Chương trình chính</label>
                <textarea
                  name="detailedDescription.mainProgram"
                  value={formData.detailedDescription.mainProgram}
                  onChange={handleChange}
                  placeholder="Nội dung chi tiết của chương trình"
                  className="form-control"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Khách mời</label>
                <textarea
                  name="detailedDescription.guests"
                  value={formData.detailedDescription.guests}
                  onChange={handleChange}
                  placeholder="Thông tin về khách mời, nghệ sĩ"
                  className="form-control"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Trải nghiệm đặc biệt</label>
                <textarea
                  name="detailedDescription.specialExperiences"
                  value={formData.detailedDescription.specialExperiences}
                  onChange={handleChange}
                  placeholder="Những trải nghiệm đặc biệt tại sự kiện"
                  className="form-control"
                  rows="3"
                />
              </div>
            </FormSection>
            
            <FormSection title="Thông tin nhà tổ chức">
              <div className="form-group">
                <label>Tên nhà tổ chức</label>
                <input
                  type="text"
                  name="organizer.name"
                  value={formData.organizer.name}
                  onChange={handleChange}
                  placeholder="Tên công ty/tổ chức của bạn"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Thông tin nhà tổ chức</label>
                <textarea
                  name="organizer.info"
                  value={formData.organizer.info}
                  onChange={handleChange}
                  placeholder="Thông tin về nhà tổ chức"
                  className="form-control"
                  rows="3"
                />
              </div>
            </FormSection>
            
            <FormSection title="Điều khoản và điều kiện">
              <div className="form-group">
                <label>Điều khoản & quy định</label>
                <textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleChange}
                  placeholder="Điều khoản và quy định khi tham gia sự kiện"
                  className="form-control"
                  rows="4"
                />
              </div>
            </FormSection>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Check if user is an event owner
  if (!user || user.role !== 'event_owner') {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-900 text-white min-h-screen">
        <div className="bg-red-700 text-white px-4 py-3 rounded">
          Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với vai trò Event Owner.
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h1>Tạo sự kiện mới - {templateInfo?.templateName}</h1>
        <p className="event-type-tag">{templateInfo?.templateDescription || 'Sự kiện có sơ đồ chỗ ngồi'}</p>
      </div>
      <div className="step-indicator">
        <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Thông tin cơ bản</div>
        </div>
        <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Thời gian & Địa điểm</div>
        </div>
        <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Vé & Sơ đồ chỗ ngồi</div>
        </div>
        <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Chi tiết & Điều khoản</div>
        </div>
      </div>
      <form 
        className="create-event-form" 
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          currentStep === 4 ? handleFinalSubmit(e) : handleNextStep(e);
        }}
      >
        {renderStepContent()}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={4}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
          onSubmit={handleFinalSubmit}
          finalButtonText="Tạo sự kiện"
          loading={loading}
        />
      </form>
    </div>
  );
};

export default CreateEventWithSeating;
