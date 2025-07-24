import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import UserSearch from '../components/chat/UserSearch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUserCircle, faArrowLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const ChatPage = () => {
    const {
        sendMessage,
        messages,
        conversations,
        currentConversationId,
        requestMessagesForConversation,
        setCurrentConversationId,
        isConnected
    } = useSocket();
    const { user } = useAuth();
    const [newMessageContent, setNewMessageContent] = useState('');
    const [newRecipientInfo, setNewRecipientInfo] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages, currentConversationId]);

    useEffect(() => {
        if (currentConversationId && (!messages[currentConversationId] || messages[currentConversationId].length === 0)) {
            requestMessagesForConversation(currentConversationId);
        }
    }, [currentConversationId, messages, requestMessagesForConversation]);

    useEffect(() => {
        if (newRecipientInfo && conversations.length > 0) {
            const newConvo = conversations.find(c => 
                c.participants.some(p => p._id === newRecipientInfo._id) &&
                c.participants.some(p => p._id === user._id)
            );
            if (newConvo) {
                setCurrentConversationId(newConvo._id);
                setNewRecipientInfo(null);
            }
        }
    }, [conversations, newRecipientInfo, user, setCurrentConversationId]);

    const handleSelectConversation = (conversationId) => {
        setCurrentConversationId(conversationId);
        setNewRecipientInfo(null);
    };

    const handleStartNewConversation = (selectedUser) => {
        if (!selectedUser || !selectedUser._id || selectedUser._id === user._id) return;
        
        const existingConvo = conversations.find(c => 
            c.participants.length === 2 && 
            c.participants.some(p => p._id === selectedUser._id) &&
            c.participants.some(p => p._id === user._id)
        );

        if (existingConvo) {
            setCurrentConversationId(existingConvo._id);
            setNewRecipientInfo(null);
        } else {
            setCurrentConversationId(null);
            setNewRecipientInfo({ _id: selectedUser._id, username: selectedUser.username, avatar: selectedUser.avatar });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessageContent.trim()) return;
        let recipientTargetId = null;
        if (currentConversationId) {
            const currentConvo = conversations.find(c => c._id === currentConversationId);
            if (currentConvo) {
                const recipient = currentConvo.participants.find(p => p._id !== user._id);
                if (recipient) recipientTargetId = recipient._id;
                else { return; }
            }
        } else if (newRecipientInfo?._id) {
            recipientTargetId = newRecipientInfo._id;
        }
        if (recipientTargetId) {
            sendMessage(recipientTargetId, newMessageContent);
            setNewMessageContent('');
        } 
    };

    const handleBackToConversations = () => {
        setCurrentConversationId(null);
        setNewRecipientInfo(null);
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0a192f] to-[#101820]">
                <div className="text-center bg-[#101820] p-8 rounded-2xl shadow-xl max-w-md border border-[#22304a]">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-100 mb-4">Cần đăng nhập</h2>
                    <p className="text-gray-400 mb-6">Vui lòng đăng nhập để sử dụng chức năng chat.</p>
                    <a href="/login" className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-900 hover:to-indigo-950 transition-all duration-300 shadow-lg">
                        Đăng nhập ngay
                    </a>
                </div>
            </div>
        );
    }

    const messagesToDisplay = currentConversationId ? (messages[currentConversationId] || []) : [];
    let activeChatPartner = null;
    if (currentConversationId) {
        const activeConvo = conversations.find(c => c._id === currentConversationId);
        if (activeConvo) activeChatPartner = activeConvo.participants.find(p => p._id !== user._id);
    } else if (newRecipientInfo) {
        activeChatPartner = newRecipientInfo;
    }
    const isChatAreaActive = !!activeChatPartner;

    return (
        <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-[#0a192f] to-[#101820] rounded-lg overflow-hidden shadow-xl my-0 md:my-0">
            <div className={`w-full md:w-[320px] bg-[#101820] border-r border-[#22304a] flex flex-col transition-all duration-300 ease-in-out ${isChatAreaActive ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-[#22304a]">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-100">Tin nhắn</h2>
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                            </span>
                        </div>
                    </div>
                    <UserSearch onSelectUser={handleStartNewConversation} currentUser={user} />
                </div>
                {/* Danh sách hội thoại */}
                <div className="flex-1 overflow-y-auto bg-[#16213a]">
                    {conversations.length > 0 ? conversations.map((convo) => {
                        const otherParticipant = convo.participants.find(p => p._id !== user._id);
                        if (!otherParticipant) return null;
                        const isActive = currentConversationId === convo._id;
                        const lastMsg = convo.lastMessage;
                        const lastMsgSender = lastMsg?.senderId?._id === user._id ? "Bạn: " : "";
                        const lastMsgContent = lastMsg?.content || (isActive ? "Đang trò chuyện..." : "Bắt đầu trò chuyện");
                        return (
                            <div
                                key={convo._id}
                                onClick={() => handleSelectConversation(convo._id)}
                                className={`flex items-center px-4 py-3 hover:bg-[#22304a] cursor-pointer transition-colors duration-150 ease-in-out ${isActive ? 'bg-blue-900/40 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                            >
                                <img 
                                    src={otherParticipant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username)}&background=random&color=fff&font-size=0.5`}
                                    alt={otherParticipant.username} 
                                    className="w-11 h-11 rounded-full mr-3 object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-100 truncate">{otherParticipant.username}</div>
                                    <div className="text-xs text-gray-400 truncate">{lastMsgSender}{lastMsgContent}</div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-gray-400 text-center py-8">Không có hội thoại nào</div>
                    )}
                </div>
            </div>
            <div className={`w-full md:flex-1 flex flex-col bg-[#16213a] ${!isChatAreaActive ? 'hidden md:flex' : 'flex'}`}>
                {isChatAreaActive ? (
                    <>
                        <div className="p-3 border-b border-[#22304a] bg-[#101820] flex items-center justify-between shadow-sm">
                            <div className="flex items-center">
                                <button onClick={handleBackToConversations} className="md:hidden mr-2 p-2 rounded-full hover:bg-[#22304a] text-gray-300">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                </button>
                                <img 
                                    src={activeChatPartner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatPartner.username)}&background=random&color=fff&font-size=0.5`}
                                    alt={activeChatPartner.username}
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                />
                                <div>
                                    <h3 className="text-md font-semibold text-gray-100">
                                        {activeChatPartner.username}
                                    </h3>
                                </div>
                            </div>
                            <button className="p-2 rounded-full hover:bg-[#22304a] text-gray-400">
                                <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                        </div>
                        <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-[#16213a]">
                            {messagesToDisplay.map((msg) => {
                                const isSender = msg.senderId?._id === user._id;
                                const senderName = isSender ? 'Bạn' : msg.senderId?.username;
                                const senderAvatar = isSender ? user.avatar : msg.senderId?.avatar;
                                return (
                                    <div key={msg._id} className={`flex items-end ${isSender ? 'justify-end' : 'justify-start'} group`}>
                                        {!isSender && (
                                            <img 
                                                src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'U')}&background=random&color=fff&font-size=0.5`}
                                                alt={senderName} 
                                                className="w-7 h-7 rounded-full mr-2 mb-1 object-cover flex-shrink-0 self-start mt-1"
                                            />
                                        )}
                                        <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 shadow-md ${isSender ? 'bg-blue-700 text-white ml-8' : 'bg-[#22304a] text-gray-100 mr-8'}`}>
                                            {!isSender && <p className="text-xs font-semibold mb-0.5 text-green-400">{senderName}</p>}
                                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${isSender ? 'text-blue-200 opacity-70' : 'text-gray-400'} text-right`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {isSender && (
                                            <img 
                                                src={senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'M')}&background=random&color=fff&font-size=0.5`}
                                                alt={user.username} 
                                                className="w-7 h-7 rounded-full ml-2 mb-1 object-cover flex-shrink-0 self-start mt-1"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-4 border-t border-[#22304a] bg-[#101820]">
                            <input
                                type="text"
                                value={newMessageContent}
                                onChange={e => setNewMessageContent(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 px-4 py-3 rounded-xl bg-[#16213a] text-gray-100 border border-[#22304a] focus:ring-2 focus:ring-blue-700 focus:border-transparent placeholder-gray-400 outline-none"
                                autoComplete="off"
                            />
                            <button
                                onClick={handleSendMessage}
                                type="button"
                                disabled={!newMessageContent.trim() || !activeChatPartner}
                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold p-3 w-12 h-12 flex items-center justify-center rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center bg-[#101820] p-6 text-center">
                        <svg className="w-16 h-16 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-200 mb-2">Trò chuyện chưa bắt đầu</h3>
                        <p className="text-gray-400 max-w-xs">Chọn một người bạn từ danh sách bên trái hoặc tìm kiếm để bắt đầu một cuộc hội thoại mới.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage; 