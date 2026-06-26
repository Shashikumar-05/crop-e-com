import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

function NotificationBell({ onUnreadChange }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const formatTime = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent', border: 'none', fontSize: '1.4rem',
          cursor: 'pointer', position: 'relative', padding: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--neutral-600)'
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px',
            backgroundColor: 'var(--danger)', color: 'white',
            borderRadius: '50%', width: '16px', height: '16px',
            fontSize: '0.65rem', fontWeight: 'bold', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notif-header">
            <h4>Notifications <span>({unreadCount})</span></h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary-600)',
                  fontSize: '0.8rem', cursor: 'pointer', padding: 0
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  onClick={async () => {
                    if (!notif.read) {
                      try {
                        await axios.put(`/api/notifications/${notif._id}/read`);
                        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, read: true } : n));
                      } catch (error) {
                        console.error('Error marking read:', error);
                      }
                    }
                  }}
                  style={{ cursor: !notif.read ? 'pointer' : 'default' }}
                >
                  <div className="notif-icon">{notif.icon || '🔔'}</div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--neutral-800)', lineHeight: '1.4' }}>
                      {notif.text}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid var(--neutral-100)', backgroundColor: 'var(--neutral-50)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-600)', cursor: 'pointer', fontWeight: '600' }}>
              View All History
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
