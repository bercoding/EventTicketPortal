import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const RefundRequestForm = ({ booking, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    reason: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Nhập lý do, 2: Nhập thông tin ngân hàng, 3: Xác nhận

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.reason.trim()) {
      toast.error('Vui lòng nhập lý do trả vé');
      return;
    }
    
    if (step === 2) {
      if (!formData.bankName.trim()) {
        toast.error('Vui lòng nhập tên ngân hàng');
        return;
      }
      if (!formData.accountNumber.trim()) {
        toast.error('Vui lòng nhập số tài khoản');
        return;
      }
      if (!formData.accountHolderName.trim()) {
        toast.error('Vui lòng nhập tên chủ tài khoản');
        return;
      }
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate form data
      if (!formData.reason.trim()) {
        toast.error('Vui lòng nhập lý do trả vé');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.bankName.trim()) {
        toast.error('Vui lòng nhập tên ngân hàng');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.accountNumber.trim()) {
        toast.error('Vui lòng nhập số tài khoản');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.accountHolderName.trim()) {
        toast.error('Vui lòng nhập tên chủ tài khoản');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare request body
      const requestData = {
        bookingId: booking._id,
        reason: formData.reason,
        bankInfo: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          branch: formData.branch || ''
        }
      };
      
      console.log('Sending refund request data:', requestData);
      
      // Call API to create refund request
      const response = await api.post('/refunds/requests', requestData);
      
      if (response.data.success) {
        toast.success('Yêu cầu hoàn tiền đã được gửi thành công');
        if (onSuccess) {
          onSuccess(response.data.refundRequest);
        }
      } else {
        toast.error(response.data.message || 'Đã xảy ra lỗi');
      }
    } catch (error) {
      console.error('Error submitting refund request:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(`Lỗi: ${error.message}`);
      } else {
        toast.error('Đã xảy ra lỗi khi gửi yêu cầu');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tính số tiền sẽ được hoàn lại (75% giá trị đơn hàng)
  const refundAmount = Math.floor(booking?.totalAmount * 0.75);
  const feeAmount = Math.ceil(booking?.totalAmount * 0.25);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-blue-800 flex items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2 mt-1" />
              <div>
                <p className="font-medium">Lý do trả vé</p>
                <p className="text-sm">Hãy cho chúng tôi biết lý do bạn muốn trả vé. Thông tin này giúp chúng tôi cải thiện dịch vụ.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do trả vé <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vui lòng nhập lý do bạn muốn trả vé..."
                required
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-blue-800 flex items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2 mt-1" />
              <div>
                <p className="font-medium">Thông tin tài khoản ngân hàng</p>
                <p className="text-sm">Vui lòng cung cấp thông tin tài khoản ngân hàng để chúng tôi hoàn tiền cho bạn.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên ngân hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Vietcombank, Techcombank,..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số tài khoản của bạn"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: NGUYEN VAN A"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chi nhánh
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Chi nhánh Hà Nội (không bắt buộc)"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-start">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-1 text-yellow-600" />
              <div>
                <p className="font-medium">Xác nhận hoàn tiền</p>
                <p className="text-sm">Lưu ý: Phí hoàn vé là 25% tổng giá trị đơn hàng. Bạn sẽ nhận được 75% số tiền đã thanh toán.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Thông tin yêu cầu hoàn tiền</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Mã đặt vé:</p>
                  <p>{booking.bookingCode}</p>
                </div>
                <div>
                  <p className="font-medium">Tổng tiền đã thanh toán:</p>
                  <p>{booking.totalAmount?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <p className="font-medium">Phí hoàn vé (25%):</p>
                  <p className="text-red-600">{feeAmount?.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <p className="font-medium">Số tiền sẽ được hoàn:</p>
                  <p className="text-green-600 font-bold">{refundAmount?.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="font-medium">Thông tin tài khoản:</p>
                <p>{formData.bankName} - {formData.accountNumber}</p>
                <p>Chủ TK: {formData.accountHolderName}</p>
                {formData.branch && <p>Chi nhánh: {formData.branch}</p>}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận trả vé'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h3 className="text-xl font-bold mb-4 text-center">Yêu cầu trả vé & hoàn tiền</h3>
      {renderStep()}
    </form>
  );
};

export default RefundRequestForm; 