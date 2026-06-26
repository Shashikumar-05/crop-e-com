import { useState, useRef, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Chatbot.css';

function Chatbot() {
  const { user, token, isLoggedIn } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I am your AgriTech Assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // If not logged in, don't show the chatbot popup.
  // The system's rules are based on user role anyway.
  if (!isLoggedIn) return null;

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/chat/assistant',
        { message: userText, language: i18n.language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, { text: response.data.reply, isBot: true }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Sorry, I am having trouble connecting to the server.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      <button 
        className="chatbot-toggle-btn" 
        onClick={toggleChat}
        title="Chat Assistance"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4>{t('chatbot.support_assistant')}</h4>
            <span style={{fontSize: '0.8rem', opacity: 0.8}}>{user?.role} {t('chatbot.mode')}</span>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-container ${msg.isBot ? 'bot' : 'user'}`}>
                <div className={`chat-bubble ${msg.isBot ? 'bot-bubble' : 'user-bubble'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-container bot">
                <div className="chat-bubble bot-bubble typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.ask_question')}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {t('chatbot.send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
