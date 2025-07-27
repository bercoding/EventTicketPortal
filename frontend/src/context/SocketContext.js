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
    // Load messages from localStorage on initial render
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('chat_messages');
        return savedMessages ? JSON.parse(savedMessages) : {};
    }); 
    // Load conversations from localStorage on initial render
    const [conversations, setConversations] = useState(() => {
        const savedConversations = localStorage.getItem('chat_conversations');
        return savedConversations ? JSON.parse(savedConversations) : [];
    });
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({}); // { userId: true }
    const [lastNotification, setLastNotification] = useState(null); // State cho thông báo mới
    const { user, refreshUser } = useAuth();

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (Object.keys(messages).length > 0) {
            localStorage.setItem('chat_messages', JSON.stringify(messages));
        }
    }, [messages]);

    // Save conversations to localStorage whenever they change
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem('chat_conversations', JSON.stringify(conversations));
        }
    }, [conversations]);

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
            // Don't reset chat data on disconnect to preserve messages across sessions
            // The data will be loaded from localStorage on next connection
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
            // Merge with existing conversations from localStorage if available
            setConversations(prevConvos => {
                const mergedConvos = [...convos];
                // Keep only unique conversations based on _id
                return mergedConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        };

        const handleMessagesHistory = ({ conversationId, messages: historyMessages }) => {
            setMessages(prev => {
                const existingMessages = prev[conversationId] || [];
                const newMessages = historyMessages || [];
                
                // Combine existing and new messages, remove duplicates by _id
                const messageMap = new Map();
                [...existingMessages, ...newMessages].forEach(msg => {
                    if (msg._id) {
                        messageMap.set(msg._id, msg);
                    }
                });
                
                const combinedMessages = Array.from(messageMap.values());
                combinedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                
                return {
                    ...prev,
                    [conversationId]: combinedMessages
                };
            });
        };

        const handleNewMessage = (payload) => {
            const { message: actualMessage, conversation: updatedConversation } = payload;

            if (!actualMessage || !actualMessage.conversationId) {
                console.error('Invalid new message payload received in SocketContext:', payload);
                return;
            }

            setMessages(prev => {
                const existingMessages = prev[actualMessage.conversationId] || [];
                // Check if message already exists
                const messageExists = existingMessages.some(msg => msg._id === actualMessage._id);
                if (messageExists) {
                    return prev;
                }
                
                const updatedMessages = {
                    ...prev,
                    [actualMessage.conversationId]: [...existingMessages, actualMessage]
                };
                
                // Save to localStorage
                localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
                
                return updatedMessages;
            });
            
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
                
                const sortedConvos = newConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                
                // Save to localStorage
                localStorage.setItem('chat_conversations', JSON.stringify(sortedConvos));
                
                return sortedConvos;
            });
        };
        
        const handleMessageError = (error) => {
            console.error('Message error from server (SocketContext):', error.message);
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

        socket.on('owner_request_approved', () => {
            if (typeof refreshUser === 'function') {
                refreshUser();
            }
        });

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
            socket.off('owner_request_approved');
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, [socket, refreshUser]);

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
            // Always request messages from server to ensure we have the latest
            socket.emit('request_messages', { conversationId });
        }
    }, [socket]);

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

