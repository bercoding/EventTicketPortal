const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');

// Tạo thư mục uploads/avatars nếu chưa tồn tại
const avatarUploadPath = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(avatarUploadPath)) {
    fs.mkdirSync(avatarUploadPath, { recursive: true });
}

// Cấu hình lưu trữ cho Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadPath); // Thư mục lưu file
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất: shortid-originalname.ext
        const uniqueSuffix = shortid.generate();
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}-${file.originalname.split('.')[0]}${extension}`);
    }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Chỉ cho phép tải lên file hình ảnh (jpeg, jpg, png, gif)!'), false);
};

const uploadAvatar = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Giới hạn 5MB
    },
    fileFilter: fileFilter
});

module.exports = { uploadAvatar }; 