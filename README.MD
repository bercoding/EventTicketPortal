# Nền tảng đặt vé sự kiện trực tuyến

Một ứng dụng web cho phép người dùng đặt vé sự kiện trực tuyến, được xây dựng với Node.js, React.js và MongoDB.

## Tính năng

- Đăng ký và đăng nhập tài khoản
- Xem danh sách sự kiện
- Đặt vé cho sự kiện
- Quản lý thông tin cá nhân và vé đã đặt
- Quản lý sự kiện (cho Admin)

## Công nghệ sử dụng

- **Frontend**: React.js, React Router, Axios, Bootstrap
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MongoDB

## Cài đặt và chạy

### Yêu cầu
- Node.js (v14+)
- MongoDB
- npm hoặc yarn

### Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các gói phụ thuộc
npm install

# Tạo file .env
touch .env

# Cấu hình các biến môi trường trong file .env
# PORT=5001
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret

# Chạy server
npm run dev
```

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói phụ thuộc
npm install

# Chạy ứng dụng
npm start
```

## Cấu trúc dự án
