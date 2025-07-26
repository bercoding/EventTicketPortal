/**
 * Mock VNPT eKYC Service
 * Dùng để test xác thực CCCD khi không thể kết nối tới VNPT eKYC API
 */
const fs = require('fs');
const path = require('path');

/**
 * Mô phỏng xác thực CCCD
 * @param {String} imagePath Đường dẫn tới file hình ảnh
 * @param {String} side Mặt của CCCD ('front' hoặc 'back')
 */
const verifyIdCard = async (imagePath, side = 'front') => {
  try {
    // Giả lập độ trễ của API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Đọc file để đảm bảo tồn tại và có dung lượng hợp lệ
    const fileStats = fs.statSync(imagePath);
    
    if (fileStats.size < 10000) {
      // Ảnh quá nhỏ, có thể không đủ chất lượng
      return {
        success: false,
        message: 'Chất lượng ảnh quá thấp, vui lòng chụp lại',
      };
    }
    
    // Tạo dữ liệu mẫu dựa vào mặt của CCCD
    if (side === 'front') {
      return {
        success: true,
        data: {
          id: "079123456789",
          name: "NGUYỄN VĂN A",
          dob: "01/01/1990",
          gender: "Nam",
          nationality: "Việt Nam",
          home: "123 Đường ABC, Phường XYZ, Quận 123, TP.HCM",
          features: "Không",
          issueDate: "",
          confidence: 0.95
        }
      };
    } else {
      return {
        success: true,
        data: {
          issue_date: "01/01/2022",
          issue_place: "CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI",
          confidence: 0.92
        }
      };
    }
  } catch (error) {
    console.error(`Error in mock verify service (${side} side):`, error);
    return {
      success: false,
      message: 'Lỗi xử lý ảnh: ' + error.message
    };
  }
};

/**
 * Kiểm tra tính hợp lệ của thông tin CCCD
 * @param {Object} frontData Dữ liệu mặt trước
 * @param {Object} backData Dữ liệu mặt sau
 */
const validateIdCardData = (frontData, backData) => {
  // Luôn trả về hợp lệ trong môi trường mô phỏng
  return { isValid: true };
};

module.exports = {
  verifyIdCard,
  validateIdCardData
}; 