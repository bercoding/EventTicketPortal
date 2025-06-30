# 🎭 Event Ticketing Platform

Nền tảng đặt vé sự kiện với tính năng tạo sơ đồ ghế tự động cho Event Owner.

## 🚀 Tính năng chính

### ✨ Đã hoàn thành - Event Owner có thể:
- **Tạo sự kiện với sơ đồ ghế tùy chỉnh** - Chọn số ghế (1-1000) và số khu (1-20)
- **Tự động tạo sơ đồ ghế** - Hệ thống chia ghế đều vào các khu A, B, C...
- **Tạo stage với hiệu ứng** - Sân khấu có gradient và 7 điểm lighting
- **Quản lý loại vé** - Nhiều loại vé với giá khác nhau
- **Validation thông minh** - Kiểm tra tổng số vé = tổng số ghế
- **UI responsive** - Giao diện đẹp, hoạt động tốt trên mọi thiết bị

## 🔧 Cài đặt

### 1. Clone repository
\`\`\`bash
git clone <repo-url>
cd event-ticketing-platform
\`\`\`

### 2. Cài đặt dependencies
\`\`\`bash
# Cài đặt tất cả packages
npm run install:all

# Hoặc cài đặt từng phần
npm run install:backend
npm run install:frontend
\`\`\`

### 3. Cấu hình môi trường
\`\`\`bash
# Backend - Tạo file .env trong /backend
cp backend/.env.example backend/.env

# Cập nhật thông tin database và các config khác
\`\`\`

### 4. Khởi động ứng dụng
\`\`\`bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng từng phần
npm run dev:backend    # Backend: http://localhost:5001
npm run dev:frontend   # Frontend: http://localhost:3000
\`\`\`

## 🎯 Cách sử dụng

### Event Owner tạo sự kiện với sơ đồ ghế:

1. **Đăng nhập** với tài khoản có role `owner` hoặc `admin`
2. **Truy cập trang Home** - Sẽ thấy section "Dành Cho Event Owner"
3. **Click nút "🎭 Tạo Sự Kiện Với Sơ Đồ Ghế"**
4. **Điền thông tin cơ bản:**
   - Tên sự kiện
   - Mô tả
   - Ngày giờ bắt đầu/kết thúc
   - Địa điểm

5. **Cấu hình ghế ngồi:**
   - Chọn tổng số ghế (1-1000)
   - Chọn số khu vực (1-20)
   - Xem preview realtime

6. **Thiết lập loại vé:**
   - Tên loại vé (VIP, Thường, ...)
   - Giá vé
   - Số lượng vé
   - Mô tả

7. **Click "Tạo Sự Kiện"** - Hệ thống sẽ tự động:
   - Tạo sơ đồ ghế chia đều vào các khu
   - Tạo stage với lighting effects
   - Lưu tất cả thông tin vào database

## 🔧 API Endpoints

### Tạo sự kiện với sơ đồ ghế
\`\`\`
POST /api/events/create-with-seating
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Concert Demo",
  "description": "Mô tả sự kiện",
  "startDate": "2024-12-25T19:00:00",
  "endDate": "2024-12-25T22:00:00",
  "seatOptions": {
    "totalSeats": 120,
    "totalSections": 6
  },
  "ticketTypes": [
    {
      "name": "VIP",
      "price": 500000,
      "description": "Vé VIP",
      "quantity": 40
    },
    {
      "name": "Thường", 
      "price": 200000,
      "description": "Vé thường",
      "quantity": 80
    }
  ]
}
\`\`\`

### Kết quả:
- **120 ghế** chia thành **6 khu** (A, B, C, D, E, F)
- Mỗi khu **20 ghế** (4 hàng x 5 ghế)
- **Stage** với gradient và 7 điểm lighting
- **2 loại vé:** VIP (40 vé) + Thường (80 vé)

## 🗂️ Cấu trúc thư mục

\`\`\`
event-ticketing-platform/
├── backend/                 # Node.js + Express API
│   ├── controllers/
│   │   └── eventController.js    # Logic tạo sự kiện với ghế
│   ├── routes/
│   │   └── event.js             # Routes API
│   ├── models/
│   │   └── Event.js             # Schema MongoDB
│   └── server.js                # Entry point backend
│
├── frontend/                # React.js Frontend  
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js          # Trang chủ với navigation cho owner
│   │   │   └── event/
│   │   │       └── CreateEventWithSeating.js  # Form tạo sự kiện
│   │   └── App.js               # Routing chính
│   └── public/
│
├── package.json             # Scripts chung
└── README.md               # File này
\`\`\`

## 🔧 Troubleshooting

### Server không khởi động:
\`\`\`bash
# Kiểm tra dependencies
npm run install:all

# Cài đặt package còn thiếu
cd backend && npm install shortid socket.io
cd frontend && npm install
\`\`\`

### Port 5001 bị chiếm:
\`\`\`bash
# Kill process đang chiếm port
lsof -ti:5001 | xargs kill -9
\`\`\`

### Merge conflicts Git:
Tất cả conflicts đã được giải quyết trong:
- \`backend/server.js\`
- \`backend/routes/event.js\`
- \`backend/controllers/eventController.js\`
- \`frontend/src/App.js\`
- \`frontend/package.json\`

## 🎉 Demo

1. **Khởi động:** \`npm run dev\`
2. **Truy cập:** http://localhost:3000
3. **Đăng nhập** với tài khoản owner
4. **Click nút:** "🎭 Tạo Sự Kiện Với Sơ Đồ Ghế"
5. **Tạo sự kiện** với 120 ghế, 6 khu, 2 loại vé

## 📞 Hỗ trợ

Mọi vấn đề xin liên hệ team phát triển. Hệ thống đã ổn định và ready for production! 🚀
