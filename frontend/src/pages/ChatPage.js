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
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Cần đăng nhập</h2>
                    <p className="text-gray-600 mb-6">Vui lòng đăng nhập để sử dụng chức năng chat.</p>
                    <a href="/login" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg">
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
        <div className="flex h-[calc(100vh-80px)] bg-gray-100 rounded-lg overflow-hidden shadow-xl my-0 md:my-0">
            <div className={`w-full md:w-[320px] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isChatAreaActive ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-800">Tin nhắn</h2>
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                            </span>
                        </div>
                    </div>
                    <UserSearch onSelectUser={handleStartNewConversation} currentUser={user} />
                </div>
                <div className="overflow-y-auto flex-grow custom-scrollbar py-2">
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
                                className={`flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors duration-150 ease-in-out ${isActive ? 'bg-green-50 border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                            >
                                <img 
                                    src={otherParticipant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username)}&background=random&color=fff&font-size=0.5`}
                                    alt={otherParticipant.username} 
                                    className="w-11 h-11 rounded-full mr-3 object-cover flex-shrink-0"
                                />
                                <div className="flex-grow overflow-hidden">
                                    <p className={`font-semibold truncate ${isActive ? 'text-green-600' : 'text-gray-700'}`}>
                                        {otherParticipant.username}
                                    </p>
                                    <p className={`text-sm truncate ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                                        {lastMsgSender}{lastMsgContent}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                         <p className="p-4 text-gray-500 text-center mt-6">Không có cuộc trò chuyện nào. Hãy tìm bạn bè để bắt đầu!</p>
                    )}
                </div>
            </div>

            <div className={`w-full md:flex-1 flex flex-col bg-gray-50 ${!isChatAreaActive ? 'hidden md:flex' : 'flex'}`}>
                {isChatAreaActive ? (
                    <>
                        <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
                            <div className="flex items-center">
                                <button onClick={handleBackToConversations} className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 text-gray-600">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                </button>
                                <img 
                                    src={activeChatPartner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatPartner.username)}&background=random&color=fff&font-size=0.5`}
                                    alt={activeChatPartner.username}
                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                />
                                <div>
                                    <h3 className="text-md font-semibold text-gray-800">
                                        {activeChatPartner.username}
                                    </h3>
                                </div>
                            </div>
                            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                                <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                        </div>

                        <div ref={messagesEndRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-gradient-to-br from-gray-50 to-gray-100">
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
                                        <div className={`max-w-[65%] md:max-w-[60%] p-2.5 px-3.5 rounded-2xl shadow-sm relative ${isSender ? 'bg-green-500 text-white rounded-br-md' : 'bg-white text-gray-700 rounded-bl-md'}`}>
                                            {!isSender && <p className="text-xs font-semibold mb-0.5 text-green-600">{senderName}</p>}
                                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${isSender ? 'text-green-100 opacity-70' : 'text-gray-400'} text-right`}>
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
                            {messagesToDisplay.length === 0 && (
                                <div className="text-center text-gray-500 pt-10 flex flex-col items-center">
                                    <FontAwesomeIcon icon={faUserCircle} size="3x" className="text-gray-300 mb-3"/>
                                    <p>Chưa có tin nhắn nào.</p>
                                    <p className="text-sm">{currentConversationId ? "Hãy bắt đầu cuộc trò chuyện!" : (newRecipientInfo ? `Gửi tin nhắn cho ${newRecipientInfo.username}.` : "")}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 md:p-4 border-t border-gray-200 bg-white flex items-center space-x-3">
                            <input
                                type="text"
                                value={newMessageContent}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSendMessage(e); }}}
                                onChange={(e) => setNewMessageContent(e.target.value)}
                                placeholder={activeChatPartner ? `Nhắn tin tới ${activeChatPartner.username}...` : "..."}
                                className="flex-grow p-3 px-4 border-none bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                disabled={!activeChatPartner}
                            />
                            <button
                                onClick={handleSendMessage}
                                type="button"
                                disabled={!newMessageContent.trim() || !activeChatPartner}
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold p-3 w-12 h-12 flex items-center justify-center rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center bg-white p-6 text-center">
                        <svg className="w-16 h-16 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Trò chuyện chưa bắt đầu</h3>
                        <p className="text-gray-500 max-w-xs">Chọn một người bạn từ danh sách bên trái hoặc tìm kiếm để bắt đầu một cuộc hội thoại mới.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage; 