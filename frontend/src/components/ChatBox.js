import React, { useState } from 'react';
import './ChatBox.css';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chatbox/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages([...newMessages, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { sender: 'bot', text: 'Có lỗi xảy ra, vui lòng thử lại.' }]);
    }
    setLoading(false);
  };

  return (
    <div className={`chatbox-container${open ? ' open' : ''}`}> 
      {open ? (
        <div className="chatbox">
          <div className="chatbox-header">
            <span>Chat với AI</span>
            <button className="chatbox-close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chatbox-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbox-message ${msg.sender}`}>{msg.text}</div>
            ))}
            {loading && <div className="chatbox-message bot">Đang trả lời...</div>}
          </div>
          <form className="chatbox-input" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>Gửi</button>
          </form>
        </div>
      ) : (
        <button className="chatbox-toggle" onClick={() => setOpen(true)}>💬</button>
      )}
    </div>
  );
};

export default ChatBox; 