const express = require('express');
const multer = require('multer');
const { storage } = require('./config/cloudinary');

const app = express();
const upload = multer({ storage: storage });

// Test upload route
app.post('/test-upload', upload.single('image'), (req, res) => {
    console.log('File received:', req.file);
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        success: true,
        file: req.file,
        url: req.file.url || req.file.path
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test upload server running on port ${PORT}`);
});

module.exports = app; 