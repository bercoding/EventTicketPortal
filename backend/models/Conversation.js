const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
   
}, { timestamps: true });

conversationSchema.index({ participants: 1 }); 

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;