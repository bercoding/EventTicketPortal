const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const avatarUploadsDir = path.join(__dirname, '../public/uploads/avatars');
const eventUploadsDir = path.join(__dirname, '../public/uploads/events');

if (!fs.existsSync(avatarUploadsDir)) {
    fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

if (!fs.existsSync(eventUploadsDir)) {
    fs.mkdirSync(eventUploadsDir, { recursive: true });
}

// Cấu hình storage cho avatar
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Cấu hình storage cho event images
const eventStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, eventUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter để chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
    // Kiểm tra loại file
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh!'), false);
    }
};

// Cấu hình upload với giới hạn kích thước
const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    }
});

const uploadEventImages = multer({
    storage: eventStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Giới hạn 10MB cho event images
    }
});

module.exports = {
    uploadAvatar,
    uploadEventImages
}; 