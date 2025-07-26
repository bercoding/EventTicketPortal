import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast'; // Sử dụng react-hot-toast cho đẹp
import { FaBell } from 'react-icons/fa';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState({}); 
    const [conversations, setConversations] = useState([]); // Danh sách các cuộc trò chuyện
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({}); // { userId: true }
    const [lastNotification, setLastNotification] = useState(null); // State cho thông báo mới
    const { user } = useAuth();

    const connectSocket = useCallback(() => {
        if (user && !socket) {
            console.log('🔌 Connecting to socket server...');
            
            // Use the correct port 5001 instead of 5000
            const newSocket = io('http://localhost:5001', {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                auth: {
                    token: localStorage.getItem('token')
                }
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected successfully');
                setIsConnected(true);
                // Authenticate and request conversations when connected
                const userId = user?.id || user?._id;
                newSocket.emit('authenticate', userId);
                newSocket.emit('request_conversations');
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('🔴 Socket connection error (SocketContext):', error);
                setIsConnected(false);
            });

            setSocket(newSocket);
        }
    }, [user, socket]);

    const disconnectSocket = useCallback(() => {
        if (socket) {
            console.log('🔌 Disconnecting socket...');
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            // Reset all chat states
            setConversations([]);
            setMessages({});
            setCurrentConversationId(null);
            setOnlineUsers({});
        }
    }, [socket]);

    useEffect(() => {
        if (user) {
            connectSocket();
        } else {
            disconnectSocket();
        }

        return () => {
            disconnectSocket();
        };
    }, [user, connectSocket, disconnectSocket]);

    // Lắng nghe các sự kiện từ server
    useEffect(() => {
        if (!socket) return;

        const handleConversationsList = (convos) => {
            setConversations(convos || []);
        };

        const handleMessagesHistory = ({ conversationId, messages: historyMessages }) => {
            setMessages(prev => ({
                ...prev,
                [conversationId]: historyMessages || []
            }));
        };

        const handleNewMessage = (payload) => {
            const { message: actualMessage, conversation: updatedConversation } = payload;

            if (!actualMessage || !actualMessage.conversationId) {
                console.error('Invalid new message payload received in SocketContext:', payload);
                return;
            }

            setMessages(prev => ({
                ...prev,
                [actualMessage.conversationId]: [...(prev[actualMessage.conversationId] || []), actualMessage]
            }));
            
            setConversations(prevConvos => {
                const existingConvoIndex = prevConvos.findIndex(c => c._id === updatedConversation._id);
                let newConvos;
                if (existingConvoIndex !== -1) {
                    newConvos = prevConvos.map(c => 
                        c._id === updatedConversation._id 
                        ? { ...updatedConversation, lastMessage: actualMessage } 
                        : c
                    );
                } else {
                    newConvos = [...prevConvos, { ...updatedConversation, lastMessage: actualMessage }];
                }
                return newConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        };
        
        const handleMessageError = (error) => {
            console.error('Message error from server (SocketContext):', error.message);
            // Consider a more user-friendly notification system than alert

            // alert(`Lỗi gửi tin nhắn: ${error.message}`); 

        };

        socket.on('conversations_list', handleConversationsList);
        socket.on('messages_history', handleMessagesHistory);
        socket.on('new_private_message', handleNewMessage);
        socket.on('message_error', handleMessageError);

        // --- Lắng nghe sự kiện thông báo mới ---
        const handleNewNotification = (notification) => {
            console.log('🎉 New notification received:', notification);
            setLastNotification(notification); // Cập nhật state để trigger re-fetch ở nơi cần
            
            // Hiển thị toast
            toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                           <FaBell className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: notification.message }}></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
            ));
        };

        socket.on('new_notification', handleNewNotification);
        // --- Kết thúc lắng nghe ---

        socket.on('disconnect', (reason) => {
            // console.log('Socket disconnected from context:', reason);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error (SocketContext):', err);
        });

        return () => {
            socket.off('conversations_list', handleConversationsList);
            socket.off('messages_history', handleMessagesHistory);
            socket.off('new_private_message', handleNewMessage);
            socket.off('message_error', handleMessageError);
            socket.off('new_notification', handleNewNotification); // Cleanup
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, [socket]);

    const sendMessage = useCallback((recipientId, content) => {
        const userId = user?.id || user?._id;
        if (socket && user && userId && recipientId && content) {
            console.log('📤 Sending message:', { recipientId, content, userId });
            socket.emit('private_message', { recipientId, content });
        } else {
            console.error('SocketContext: Cannot send message. Missing socket, user, recipient, or content.', {
                hasSocket: !!socket,
                hasUser: !!user,
                userId: userId,
                recipientId,
                content
            });
        }
    }, [socket, user]);

    const requestMessagesForConversation = useCallback((conversationId) => {
        if (socket && conversationId) {
            setCurrentConversationId(conversationId);
            if (!messages[conversationId] || messages[conversationId].length === 0) {
                 socket.emit('request_messages', { conversationId });
            }
        }
    }, [socket, messages]);

    const value = {
        socket,
        isConnected,
        connectSocket,
        disconnectSocket,
        sendMessage,
        messages, // Object: { conversationId: [...] }
        conversations, 
        currentConversationId, 
        setCurrentConversationId, 
        requestMessagesForConversation,
        onlineUsers,
        lastNotification // Cung cấp state mới
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );

}; 

