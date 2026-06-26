import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SidebarDrawer from './SidebarDrawer';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { cartCount } = useCart();
  
  const [supportPhone, setSupportPhone] = useState(localStorage.getItem('supportPhone') || '+919876543210');
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState(supportPhone);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/settings');
        if (data && data.supportPhone) {
          setSupportPhone(data.supportPhone);
          setEditPhoneValue(data.supportPhone);
          localStorage.setItem('supportPhone', data.supportPhone);
        }
      } catch (error) {
        console.error('Error fetching settings', error);
      }
    };
    fetchSettings();
  }, []);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const saveSupportPhone = async () => {
    try {
      const { data } = await axios.put('/api/settings', { supportPhone: editPhoneValue });
      setSupportPhone(data.supportPhone);
      localStorage.setItem('supportPhone', data.supportPhone);
      setIsEditingPhone(false);
      setShowPhoneMenu(false);
    } catch (error) {
      console.error('Error saving support phone', error);
    }
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  // Role-based home link
  const homeLink = () => {
    if (!user) return '/';
    if (user.role === 'Farmer') return '/dashboard';
    if (user.role === 'Delivery') return '/delivery';
    if (user.role === 'Manager') return '/manager/dashboard';
    return '/marketplace';
  };

  return (
    <nav style={{
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--neutral-200)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      {/* Sidebar Drawer Component */}
      <SidebarDrawer 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onLogout={onLogout} 
      />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '70px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>

        {/* Brand and Hamburger Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger Menu Icon */}
          {location.pathname !== '/' && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neutral-700)',
                position: 'relative'
              }}
              aria-label="Open Sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              {/* Notification Dot on Hamburger */}
              {user && unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  backgroundColor: 'var(--danger, #ef4444)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--white)'
                }}></span>
              )}
            </button>
          )}

          <Link to={homeLink()} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--primary-600)',
            textDecoration: 'none',
            fontSize: '1.4rem',
            fontWeight: '700',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.5px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
            </svg>
            <span className="d-none d-sm-inline">Farm2Home</span>
          </Link>
        </div>

        {/* Links */}
        <ul className="desktop-nav-links" style={{ display: 'flex', listStyle: 'none', gap: '6px', margin: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {user ? (
            <>
              {/* === BUYER NAV === */}
              {user.role === 'Buyer' && (
                <>
                  <li>
                    <Link to="/cart" style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--neutral-600)',
                      fontWeight: '600',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      textDecoration: 'none'
                    }}>
                      🛒
                      {cartCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '0px',
                          right: '0px',
                          backgroundColor: 'var(--primary-600)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}>{cartCount > 9 ? '9+' : cartCount}</span>
                      )}
                      <span className="d-none d-sm-inline">{t('navbar.cart')}</span>
                    </Link>
                  </li>
                </>
              )}

              {/* === SELLER NAV === */}
              {user.role === 'Farmer' && (
                <>
                  {/* Links moved to sidebar */}
                </>
              )}

              {/* === DELIVERY NAV === */}
              {user.role === 'Delivery' && (
                <>
                  <li className="hide-on-mobile"><NavLink to="/delivery" icon="🚚" label={t('navbar.dashboard')} /></li>
                </>
              )}

              {/* === MANAGER NAV === */}
              {user.role === 'Manager' && (
                <>
                  <li className="hide-on-mobile"><NavLink to="/manager/dashboard" icon="📈" label={t('navbar.dashboard')} /></li>
                </>
              )}
              
              {/* Phone Support Link */}
              <li style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {isEditingPhone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--white)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)' }}>
                    <input 
                      type="text" 
                      value={editPhoneValue} 
                      onChange={(e) => setEditPhoneValue(e.target.value)}
                      style={{ border: 'none', outline: 'none', padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                      autoFocus
                    />
                    <button onClick={saveSupportPhone} style={{ background: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setIsEditingPhone(false); setShowPhoneMenu(false); }} style={{ background: 'var(--neutral-200)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <a href={`tel:${supportPhone}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--neutral-600)',
                      fontWeight: '600',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      📞 <span className="d-none d-sm-inline">Support</span>
                    </a>
                    
                    {user?.role === 'Manager' && location.pathname !== '/' && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setShowPhoneMenu(!showPhoneMenu)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center' }}
                          title="Support Settings"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                        
                        {showPhoneMenu && (
                          <div style={{ 
                            position: 'absolute', top: '100%', right: 0, 
                            background: 'white', border: '1px solid var(--neutral-200)', 
                            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 100, minWidth: '120px', overflow: 'hidden', marginTop: '4px'
                          }}>
                            <button 
                              onClick={() => { setIsEditingPhone(true); setShowPhoneMenu(false); }}
                              style={{ 
                                width: '100%', textAlign: 'left', padding: '10px 16px', 
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: '0.85rem', color: 'var(--neutral-700)',
                                display: 'flex', alignItems: 'center', gap: '8px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              ✏️ Edit Number
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
              
              {/* Language Switcher */}
              <li style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                <select 
                  value={i18n.language} 
                  onChange={handleLanguageChange}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--neutral-300)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--white)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="kn">ಕನ್ನಡ</option>
                </select>
              </li>

              {/* Notification Bell */}
              <li style={{ marginRight: '8px', marginLeft: '4px' }}>
                <NotificationBell onUnreadChange={setUnreadCount} />
              </li>
            </>
          ) : (
            <li>
              <Link to="/login?role=Manager" style={{
                color: 'var(--neutral-400)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--neutral-200)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                🚪 Admin/Manager Access
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

// Reusable nav link component
function NavLink({ to, icon, label }) {
  return (
    <Link to={to} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: 'var(--neutral-600)',
      fontWeight: '600',
      padding: '6px 10px',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.9rem',
      textDecoration: 'none',
      transition: 'background-color 0.2s'
    }}
    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--neutral-100)'; }}
    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {icon} <span className="d-none d-sm-inline">{label}</span>
    </Link>
  );
}

export default Navbar;
