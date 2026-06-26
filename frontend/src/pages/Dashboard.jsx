import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [myCrops, setMyCrops] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const revenueRef = useRef(null);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    location: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndCrops = async () => {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        navigate('/login');
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditForm({
        name: parsedUser.name || '',
        phone: parsedUser.phone || '',
        location: parsedUser.location || ''
      });

      if (parsedUser.role === 'Farmer') {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${parsedUser.token}`
            }
          };
          const [cropsRes, ordersRes] = await Promise.all([
            axios.get('/api/crops/mine', config),
            axios.get('/api/orders/seller', config)
          ]);
          setMyCrops(cropsRes.data);
          setMyOrders(ordersRes.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    fetchUserAndCrops();
  }, [navigate]);

  useEffect(() => {
    if (!loading && location.state?.scrollTo === 'revenue' && revenueRef.current) {
      setTimeout(() => {
        revenueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [loading, location]);

  const onLogout = () => {
    logout();
    navigate('/');
  };

  const deleteCrop = async (id) => {
    if (window.confirm("Are you sure you want to delete this crop?")) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        await axios.delete(`/api/crops/${id}`, config);
        setMyCrops(myCrops.filter(crop => crop._id !== id));
      } catch (error) {
        console.error("Error deleting crop:", error);
        alert("Failed to delete crop!");
      }
    }
  };

  // Handle Edit Profile changes
  const onEditChange = (e) => {
    setEditForm((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit Profile Changes
  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      const { data } = await axios.put('/api/auth/me', editForm, config);
      
      // Update local storage and current state
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsEditing(false); // Close edit mode
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      alert(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      {/* Profile Banner */}
      <div style={{ 
        backgroundColor: 'var(--white)', 
        border: '1px solid var(--neutral-200)', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '30px',
        display: 'flex',
        alignItems: isEditing ? 'flex-start' : 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        {!isEditing && (
          <div style={{ 
            width: '64px', height: '64px', 
            backgroundColor: 'var(--primary-600)', color: 'var(--white)',
            borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '1.8rem', fontWeight: '700', flexShrink: 0
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <div style={{ flex: 1, minWidth: '250px' }}>
          {isEditing ? (
            <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{t('dashboard.edit_profile')}</h3>
              <input type="text" name="name" value={editForm.name} onChange={onEditChange} placeholder={t('dashboard.full_name')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              <input type="tel" name="phone" value={editForm.phone} onChange={onEditChange} placeholder={t('dashboard.phone')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              <input type="text" name="location" value={editForm.location} onChange={onEditChange} placeholder={t('dashboard.location')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>{t('dashboard.save')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px' }}>{t('dashboard.cancel')}</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--neutral-900)' }}>{user.name || t('dashboard.user_profile')}</h2>
                <span style={{ 
                  padding: '4px 10px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)',
                  borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {user.role}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✉️ {user.email}</span>
                {user.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📞 {user.phone}</span>}
                {user.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {user.location}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Dashboard Split Content */}
      {user.role === 'Farmer' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', alignItems: 'start' }}>
          
          {/* Inventory Section (Left/Top) */}
          <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--neutral-900)' }}>{t('dashboard.your_inventory')}</h3>
              <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.95rem' }}>{t('dashboard.manage_listings')}</p>
            </div>
            <Link to="/add-crop" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {t('dashboard.add_new_listing')}
            </Link>
          </div>

          {myCrops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--white)', border: '1px dashed var(--neutral-300)', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--neutral-700)', fontSize: '1.2rem' }}>{t('dashboard.no_active_listings')}</h4>
              <p style={{ margin: 0, color: 'var(--neutral-500)', maxWidth: '300px', marginInline: 'auto' }}>{t('dashboard.no_active_desc')}</p>
            </div>
          ) : (
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {myCrops.map(crop => (
                <div key={crop._id} style={{ border: '1px solid var(--neutral-200)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '100%', height: '140px', backgroundColor: 'var(--neutral-100)' }}>
                    {crop.photos && crop.photos.length > 0 ? (
                      <img src={crop.photos[0]} alt={crop.cropName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)' }}>No Image</div>
                    )}
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--neutral-900)' }}>{crop.cropName}</h4>
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === crop._id ? null : crop._id)}
                          style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 5px', color: 'var(--neutral-500)', lineHeight: '1' }}
                        >
                          ⋮
                        </button>
                        {openMenuId === crop._id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', background: 'white', border: '1px solid var(--neutral-200)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '100px', overflow: 'hidden' }}>
                            <button 
                              onClick={() => navigate(`/edit-crop/${crop._id}`)}
                              style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-100)' }}
                              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--neutral-50)'}
                              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {t('dashboard.edit')}
                            </button>
                            <button 
                              onClick={() => {
                                setOpenMenuId(null);
                                deleteCrop(crop._id);
                              }}
                              style={{ width: '100%', padding: '10px 15px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger)' }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {t('dashboard.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--neutral-500)' }}>{t('dashboard.price')}</span>
                      <span style={{ fontWeight: '600' }}>₹{crop.pricePerUnit} / {crop.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--neutral-500)' }}>{t('dashboard.total_sold')}</span>
                      <span style={{ fontWeight: '600' }}>{crop.totalStock || crop.availableStock} / {crop.soldQuantity || 0} {crop.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--neutral-500)' }}>{t('dashboard.remaining')}</span>
                      <span style={{ fontWeight: '700', color: crop.availableStock <= 0 ? 'var(--danger)' : 'var(--neutral-900)' }}>
                        {crop.availableStock} {crop.unit}
                      </span>
                    </div>
                    {crop.availableStock <= 0 && (
                      <div style={{ padding: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', borderRadius: '6px', marginBottom: '10px' }}>
                        ⚠️ {t('dashboard.out_of_stock')}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Inquiries / Orders Section (Right/Bottom) */}
          <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: 'var(--neutral-900)' }}>{t('dashboard.recent_inquiries')}</h3>
                <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.95rem' }}>{t('dashboard.customer_orders')}</p>
              </div>
              <Link to="/seller-orders" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                {t('dashboard.view_all_orders')} ➔
              </Link>
            </div>

            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--neutral-50)', border: '1px dashed var(--neutral-300)', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--neutral-700)', fontSize: '1.1rem' }}>{t('dashboard.no_inquiries')}</h4>
                <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.9rem' }}>{t('dashboard.no_inquiries_desc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myOrders.slice(0, 4).map(order => (
                  <div key={order._id} style={{ border: '1px solid var(--neutral-200)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: '600' }}>{order.order_id || '#' + order._id.slice(-6).toUpperCase()}</span>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase',
                        backgroundColor: order.orderStatus === 'Inquiry' ? '#e0e7ff' : '#f3f4f6',
                        color: order.orderStatus === 'Inquiry' ? '#4338ca' : '#374151'
                      }}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: 'var(--neutral-800)' }}>{order.buyer?.name || 'Customer'}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                        {order.items.map(i => `${i.cropName} (${i.quantity} ${i.unit})`).join(', ')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid var(--neutral-100)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-700)' }}>₹{order.totalAmount?.toLocaleString('en-IN') || 0}</span>
                      {order.orderStatus === 'Inquiry' ? (
                        <Link to="/seller-orders" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>{t('dashboard.review_inquiry')}</Link>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{t('dashboard.processed')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--white)', borderRadius: '16px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--neutral-900)' }}>{t('dashboard.buyer_dashboard')}</h3>
          <p style={{ margin: '0 auto 25px', color: 'var(--neutral-500)' }}>{t('dashboard.buyer_desc')}</p>
          <Link to="/marketplace" className="btn btn-primary">{t('dashboard.explore_marketplace')}</Link>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
