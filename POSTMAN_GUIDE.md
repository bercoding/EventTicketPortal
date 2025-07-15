# Hướng Dẫn Test API Tạo Event Trên Postman

## 1. Cài Đặt Postman

- Tải và cài đặt Postman từ: https://www.postman.com/downloads/
- Tạo tài khoản Postman (miễn phí)

## 2. Cấu Hình Request

### 2.1. Tạo Event Cơ Bản (Không có ghế ngồi)

**Method:** POST  
**URL:** `http://localhost:5000/api/events`  
**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (raw JSON):** Sử dụng nội dung từ file `postman_event_example.json`

### 2.2. Tạo Event Với Ghế Ngồi

**Method:** POST  
**URL:** `http://localhost:5000/api/events/create-with-seating`  
**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (raw JSON):** Sử dụng nội dung từ file `postman_event_with_seating_example.json`

### 2.3. Tạo Event Online

**Method:** POST  
**URL:** `http://localhost:5000/api/events/create-with-seating`  
**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (raw JSON):** Sử dụng nội dung từ file `postman_online_event_example.json`

## 3. Lấy JWT Token

### 3.1. Đăng Nhập Để Lấy Token

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/login`  
**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response sẽ có:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "your-username",
    "email": "your-email@example.com"
  }
}
```

### 3.2. Sử Dụng Token

Copy token từ response và thêm vào header Authorization:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Các Trường Bắt Buộc

### 4.1. Event Cơ Bản

- `title`: Tên sự kiện
- `description`: Mô tả sự kiện
- `startDate`: Ngày bắt đầu (ISO 8601 format)
- `endDate`: Ngày kết thúc (ISO 8601 format)
- `organizers`: Array chứa ID của người tổ chức
- `location.venueName`: Tên địa điểm
- `location.address`: Địa chỉ
- `location.city`: Thành phố

### 4.2. Event Với Ghế Ngồi

- Tất cả trường của event cơ bản
- `templateType`: "seating"
- `designMode`: "template" hoặc "custom"
- `seatOptions`: Thông tin về ghế (nếu designMode = "template")
- `ticketTypes`: Array các loại vé

### 4.3. Event Online

- Tất cả trường của event cơ bản
- `templateType`: "online"
- `location.meetingLink`: Link tham gia
- `location.platform`: Nền tảng (zoom, google-meet, etc.)

## 5. Ví Dụ Response Thành Công

```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Concert Nhạc Rock 2024",
    "description": "Đêm nhạc rock đỉnh cao với các nghệ sĩ hàng đầu Việt Nam",
    "startDate": "2024-12-25T19:00:00.000Z",
    "endDate": "2024-12-25T23:00:00.000Z",
    "status": "pending",
    "organizers": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "username": "organizer1",
        "email": "organizer1@example.com",
        "fullName": "Nguyễn Văn A"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 6. Lỗi Thường Gặp

### 6.1. Lỗi 401 - Unauthorized

- Token không hợp lệ hoặc hết hạn
- Thiếu header Authorization

### 6.2. Lỗi 400 - Bad Request

- Thiếu trường bắt buộc
- Định dạng dữ liệu không đúng
- Ngày kết thúc trước ngày bắt đầu

### 6.3. Lỗi 404 - Not Found

- URL API không đúng
- Server chưa chạy

## 7. Tips

1. **Test từng loại event riêng biệt** để đảm bảo hiểu rõ cấu trúc
2. **Lưu token vào environment variables** của Postman để tái sử dụng
3. **Sử dụng Collection** để tổ chức các request
4. **Kiểm tra response status** và message để debug

## 8. Các API Khác Liên Quan

- **GET** `/api/events` - Lấy danh sách events
- **GET** `/api/events/:id` - Lấy chi tiết event
- **PUT** `/api/events/:id` - Cập nhật event
- **DELETE** `/api/events/:id` - Xóa event
- **POST** `/api/events/upload-images` - Upload ảnh event
