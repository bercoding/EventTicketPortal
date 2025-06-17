const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientId: { // Vẫn giữ recipientId để biết đích danh người nhận trong conversation (hữu ích cho unread, notifications)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    // status: { 
    //     type: String, 
    //     enum: ['sent', 'delivered', 'read'], 
    //     default: 'sent' 
    // },
    // readBy: [{ // Lưu những ai đã đọc tin nhắn này (cho group chat)
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // }]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;