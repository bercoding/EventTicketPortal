// backend/socket/socketHandler.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // Để lấy thông tin user nếu cần

const onlineUsers = {}; // { userId: socketId }
const socketToUserMap = {}; // { socketId: userId }

module.exports = (io) => {
    io.on('connection', (socket) => {
        // console.log(`New client connected: ${socket.id}`);

        socket.on('authenticate', async (userId) => {
            if (!userId) return;
            // console.log(`Authenticating socket ${socket.id} for user ${userId}`);
            onlineUsers[userId] = socket.id;
            socketToUserMap[socket.id] = userId;
            // console.log('Online users:', Object.keys(onlineUsers));
            socket.join(userId);
        });

        socket.on('request_conversations', async () => {
            const userId = socketToUserMap[socket.id];
            if (!userId) return;
            try {
                const conversations = await Conversation.find({ participants: userId })
                    .populate('participants', 'username avatar email') // Lấy thông tin người tham gia
                    .populate({
                        path: 'lastMessage',
                        populate: { path: 'senderId', select: 'username avatar' }
                    })
                    .sort({ updatedAt: -1 });
                socket.emit('conversations_list', conversations);
            } catch (error) {
                console.error('Error fetching conversations for user:', userId, error);
                socket.emit('error_fetching_conversations', { message: 'Không thể tải danh sách cuộc trò chuyện.' });
            }
        });

        socket.on('request_messages', async ({ conversationId }) => {
            const userId = socketToUserMap[socket.id];
            if (!userId || !conversationId) return;
            try {
                // Kiểm tra user có phải là participant của conversation này không (bảo mật)
                const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
                if (!conversation) {
                    return socket.emit('error_fetching_messages', { message: 'Không có quyền truy cập cuộc trò chuyện này.'});
                }

                const messages = await Message.find({ conversationId })
                    .populate('senderId', 'username avatar')
                    .sort({ createdAt: 1 }); // Sắp xếp tin nhắn từ cũ đến mới
                socket.emit('messages_history', { conversationId, messages });
            } catch (error) {
                console.error('Error fetching messages for conversation:', conversationId, error);
                socket.emit('error_fetching_messages', { message: 'Không thể tải tin nhắn.'});
            }
        });

        socket.on('private_message', async ({ recipientId, content }) => {
            const senderId = socketToUserMap[socket.id];
            if (!senderId || !recipientId || !content) {
                return socket.emit('message_error', { message: 'Thiếu thông tin người gửi, người nhận hoặc nội dung.'});
            }
            if (senderId === recipientId) {
                 return socket.emit('message_error', { message: 'Bạn không thể tự gửi tin nhắn cho chính mình.'});
            }
            // console.log(`Message from ${senderId} to ${recipientId}: ${content}`);

            try {
                const participants = [senderId, recipientId].sort();
                let conversation;

                // 1. Tìm kiếm Conversation hiện có
                conversation = await Conversation.findOne({ 
                    participants: { $all: participants, $size: 2 } 
                });

                if (conversation) {
                    // 2. Nếu tìm thấy, cập nhật updatedAt (lastMessage sẽ cập nhật sau)
                    conversation.updatedAt = new Date();
                    // Không cần lưu ngay, sẽ lưu cùng lastMessage
                } else {
                    // 3. Nếu không tìm thấy, tạo mới
                    conversation = new Conversation({
                        participants: participants
                        // lastMessage sẽ được thiết lập sau
                        // createdAt và updatedAt sẽ được Mongoose tự động thêm nhờ timestamps: true
                    });
                    // Không cần lưu ngay, sẽ lưu cùng lastMessage
                }

                // Tạo và lưu tin nhắn mới
                const newMessage = new Message({
                    conversationId: conversation._id, // Sẽ là _id mới nếu conversation vừa được tạo
                    senderId,
                    recipientId,
                    content
                });
                await newMessage.save();

                // Cập nhật lastMessage cho conversation và lưu conversation
                conversation.lastMessage = newMessage._id;
                await conversation.save(); // Lưu conversation (dù là mới hay cũ đã cập nhật)

                // Populate lại conversation để có participants đầy đủ sau khi lưu
                // (quan trọng nếu conversation vừa được tạo và populate trước đó chưa có hiệu lực)
                const populatedConversation = await Conversation.findById(conversation._id)
                                                    .populate('participants', 'username avatar email')
                                                    .populate({
                                                        path: 'lastMessage',
                                                        populate: { path: 'senderId', select: 'username avatar' }
                                                    });

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('senderId', 'username avatar');

                // Gửi tin nhắn đến người nhận (nếu họ online)
                const recipientSocketId = onlineUsers[recipientId];
                if (recipientSocketId) {
                    // Gửi cả message và thông tin conversation đã cập nhật (nếu cần thiết ở client)
                    io.to(recipientSocketId).emit('new_private_message', { message: populatedMessage, conversation: populatedConversation });
                }

                // Gửi tin nhắn và conversation lại cho người gửi (để cập nhật UI của họ)
                socket.emit('new_private_message', { message: populatedMessage, conversation: populatedConversation });

            } catch (error) {
                console.error('Error saving or sending message (socketHandler):', error);
                socket.emit('message_error', { message: 'Không thể gửi hoặc lưu tin nhắn.'});
            }
        });

        socket.on('disconnect', () => {
            // console.log(`Client disconnected: ${socket.id}`);
            const userId = socketToUserMap[socket.id];
            if (userId) {
                delete onlineUsers[userId];
                delete socketToUserMap[socket.id];
                socket.leave(userId); // Rời khỏi room riêng
                // console.log('Online users after disconnect:', Object.keys(onlineUsers));
                // (Tùy chọn) Thông báo cho người dùng khác về trạng thái offline
                // socket.broadcast.emit('user_offline', userId);
            }
        });
    });
}; 