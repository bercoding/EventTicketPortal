const express = require('express');
const multer = require('multer');
const { storage } = require('./config/cloudinary');
const router = express.Router();

const upload = multer({ storage: storage });

// Test upload route
router.post('/', upload.single('image'), (req, res) => {
    console.log('Test upload - File received:', req.file);
    console.log('Test upload - Body:', req.body);
    
    if (!req.file) {
        return res.status(400).json({ 
            success: false,
            error: 'No file uploaded' 
        });
    }
    
    res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: req.file.url || req.file.path,
            size: req.file.size
        }
    });
});

// Test multiple upload
router.post('/multiple', upload.array('images', 10), (req, res) => {
    console.log('Test multiple upload - Files received:', req.files);
    console.log('Test multiple upload - Body:', req.body);
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'No files uploaded' 
        });
    }
    
    const files = req.files.map(file => ({
        originalname: file.originalname,
        filename: file.filename,
        url: file.url || file.path,
        size: file.size
    }));
    
    res.json({
        success: true,
        message: `${req.files.length} files uploaded successfully`,
        files: files
    });
});

module.exports = router; 