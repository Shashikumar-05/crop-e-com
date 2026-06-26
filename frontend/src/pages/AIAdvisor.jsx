import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// --- Inline SVG Icons (MNC Style / Minimalist) ---
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

function AIAdvisor() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello. I am the AgriGuru AI assistant. How can I assist you with your agricultural operations, crop monitoring, or yield analysis today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const prompt = input;
    // Append the user's message immediately
    setMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      const config = {};
      if (userStr) {
        const user = JSON.parse(userStr);
        config.headers = { Authorization: `Bearer ${user.token}` };
      }

      const { data } = await axios.post('/api/chat', { prompt }, config);
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'A network error occurred connecting to the intelligence server. Please try again.';
      setMessages(prev => [...prev, { sender: 'ai', text: `System Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopic = () => {
    setMessages([{ sender: 'ai', text: 'A new chat session has started. How can I help you regarding agriculture today?' }]);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', // adjust for navbar if present
      margin: '0 -20px -20px -20px', // counteract container padding if inside one
      backgroundColor: '#f9fafb',
      fontFamily: 'var(--font-body)',
      borderTop: '1px solid #e5e7eb'
    }}>
      
      {/* Enterprise Sidebar Workspace */}
      <div className="ai-sidebar" style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 15px',
        boxShadow: '2px 0 10px rgba(0,0,0,0.01)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', padding: '0 10px', gap: '10px' }}>
          <LeafIcon />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
            AgriGuru <span style={{ color: '#6b7280', fontWeight: '400' }}>Copilot</span>
          </h2>
        </div>

        <button 
          onClick={handleNewTopic}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '12px 14px',
            borderRadius: '8px', border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff', color: '#374151',
            fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease',
            justifyContent: 'flex-start'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          <PlusIcon />
          New chat
        </button>

        <div style={{ marginTop: '30px', padding: '0 5px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>
            Recent Queries
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              "Tomato blight solutions", 
              "Optimal pH for corn", 
              "Monsoon prep strategies"
            ].map((topic, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 10px', borderRadius: '6px',
                color: '#4b5563', fontSize: '0.9rem', cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4b5563'; }}
              >
                <div style={{ color: '#7a8393ff' }}><MessageSquareIcon /></div>
                {topic}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Messages Feed */}
        <div className="ai-chat-feed" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          scrollBehavior: 'smooth'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '35px',
              animation: 'fadeIn 0.3s ease-out forwards'
            }}>
              
              {/* Professional Avatar */}
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                backgroundColor: msg.sender === 'user' ? '#f8f8f9ff' : '#22c55e',
                color: msg.sender === 'user' ? '#64768fff' : '#ffffff',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexShrink: 0,
                border: msg.sender === 'user' ? '1px solid #e5e7eb' : 'none',
                boxShadow: msg.sender === 'user' ? 'none' : '0 2px 4px rgba(34,197,94,0.3)',
                marginTop: '4px'
              }}>
                {msg.sender === 'user' ? <UserIcon /> : <BotIcon />}
              </div>

              {/* Message Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  margin: '0 0 6px 0', 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  {msg.sender === 'user' ? 'You' : 'AgriGuru Copilot'}
                </p>
                <div style={{
                  color: msg.sender === 'user' ? '#111827' : '#374151',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: msg.sender === 'user' ? 'var(--font-body)' : 'var(--font-body)'
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '35px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                backgroundColor: '#22c55e', color: '#dacbcbff',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexShrink: 0, boxShadow: '0 2px 4px rgba(34,197,94,0.3)', marginTop: '4px'
              }}>
                <BotIcon />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>AgriGuru Copilot</p>
                <div style={{ 
                  display: 'flex', gap: '6px', alignItems: 'center', height: '24px', color: '#9ca3af'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: '40px' }} />
        </div>

        {/* Floating Input Area (MNC Enterprise Style) */}
        <div className="ai-input-area" style={{ 
          background: 'linear-gradient(180deg, rgba(249,250,251,0) 0%, rgba(218, 239, 221, 1) 30%)',
          position: 'sticky',
          bottom: 0
        }}>
          <form onSubmit={sendMessage} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#22c55e',
              border: '1px solid #1d1f23ff',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              padding: '6px 6px 6px 20px',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <input
                type="text"
                className="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AgriGuru Copilot..."
                disabled={loading}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: '#ffffffff', // Changed to white for better contrast
                  backgroundColor: 'transparent',
                  padding: '12px 0',
                  boxShadow: 'none'
                }}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  backgroundColor: (loading || !input.trim()) ? '#ffffffff' : '#22c55e',
                  color: (loading || !input.trim()) ? '#30774dff' : '#0ee516ff',
                  border: 'none',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginLeft: '10px'
                }}
              >
                <div style={{ transform: 'translateX(-1px)' }}><SendIcon /></div>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: '#325ba1ff', margin: 0 }}>
                AgriGuru can make mistakes. Consider verifying critical agricultural advice.
              </p>
            </div>
          </form>
        </div>

      </div>
      
      {/* Required for the subtle loading animation and placeholders */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        /* White placeholder overrides for the MNC chat input */
        .ai-chat-input::placeholder {
          color: rgba(255, 255, 255, 0.75) !important;
          opacity: 1; /* Firefox */
        }
        
        .ai-chat-input::-ms-input-placeholder {
          color: rgba(255, 255, 255, 0.75) !important;
        }

        /* Mobile Responsive Overrides */
        .ai-chat-feed { padding: 40px 15%; }
        .ai-input-area { padding: 0 15% 30px 15%; }

        @media (max-width: 768px) {
          .ai-sidebar {
            display: none !important;
          }
          .ai-chat-feed {
            padding: 20px 15px !important;
          }
          .ai-input-area {
            padding: 0 15px 15px 15px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AIAdvisor;
