import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import useRazorpay from '../hooks/useRazorpay';
import { useTranslation } from 'react-i18next';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handlePayment } = useRazorpay(clearCart, navigate);
  const [supportPhone, setSupportPhone] = useState(localStorage.getItem('supportPhone') || '+919876543210');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/settings');
        if (data && data.supportPhone) {
          setSupportPhone(data.supportPhone);
          localStorage.setItem('supportPhone', data.supportPhone);
        }
      } catch (error) {
        console.error('Error fetching settings', error);
      }
    };
    fetchSettings();
  }, []);

  // === ROUTE PROTECTION ===
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role === 'Farmer') {
      toast.error(t('cart.farmer_no_order'));
      navigate('/dashboard');
    }
  }, [navigate]);

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const handlePlaceOrder = async () => {
    if (!currentUser) { navigate('/login'); return; }

    const address = prompt(t('cart.enter_address'));
    if (address === null) return;
    if (!address.trim()) {
      toast.error(t('cart.address_required'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        items: cartItems,
        totalAmount: cartTotal,
        deliveryAddress: address
      };
      await axios.post('/api/payment/cod', payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      toast.success(t('cart.order_success'));
      clearCart();
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || t('cart.order_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendEnquiry = async () => {
    if (!currentUser) { navigate('/login'); return; }

    try {
      setLoading(true);
      const enquiryItems = cartItems.map(item => ({
        listingId: item._id,
        quantity: item.cartQty
      }));
      
      const payload = {
        items: enquiryItems,
        deliveryAddress: 'Not provided'
      };
      
      await axios.post('/api/enquiry', payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      toast.success(t('cart.enquiry_success'));
      clearCart();
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || t('cart.enquiry_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    if (window.confirm(t('cart.confirm_clear'))) {
      clearCart();
      toast(t('cart.cart_cleared'));
    }
  };

  // === EMPTY STATE ===
  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🧺</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--neutral-900)' }}>{t('cart.empty_cart')}</h2>
        <p style={{ color: 'var(--neutral-500)', marginBottom: '30px', fontSize: '1.1rem' }}>
          {t('cart.browse_desc')}
        </p>
        <Link to="/marketplace" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
          {t('cart.browse_btn')}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '2rem' }}>🛒</div>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: 'var(--neutral-900)' }}>{t('cart.my_cart')}</h1>
            <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.95rem' }}>
              {cartItems.reduce((sum, i) => sum + i.cartQty, 0)} {t('cart.items_in_cart')}
            </p>
          </div>
        </div>
        <Link to="/marketplace" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
          ← {t('cart.continue_shopping')}
        </Link>
      </div>

      {/* Main Layout: Items + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>

        {/* Left: Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cartItems.map(item => (
            <div key={item._id} className="card" style={{ padding: '20px', display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* Crop Image */}
              <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--neutral-100)' }}>
                {item.photos && item.photos.length > 0 ? (
                  <img src={item.photos[0]} alt={item.cropName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🌾</div>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: '140px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.15rem', color: 'var(--neutral-900)', fontWeight: '700' }}>{item.cropName}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 2px 0' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                    🧑‍🌾 {item.farmerId?.name || t('cart.verified_farmer')}
                  </p>
                  <a 
                    href={`tel:${item.farmerId?.phone || '+919876543210'}`}
                    style={{
                      backgroundColor: '#16a34a',
                      color: 'white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s'
                    }}
                    title="Call Seller"
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                  </a>
                </div>
                {item.farmLocation && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--neutral-400)' }}>
                    📍 {item.farmLocation}
                  </p>
                )}
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary-700)', fontSize: '1rem' }}>
                  ₹{item.pricePerUnit} / {item.unit}
                </p>
              </div>

              {/* Quantity + Subtotal + Remove */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', minWidth: '140px' }}>
                {/* Quantity Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '4px 8px' }}>
                  <button
                    onClick={() => updateQuantity(item._id, item.cartQty - 1)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--neutral-600)', padding: '0 4px', lineHeight: 1 }}
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={item.availableStock}
                    value={item.cartQty}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text === '') {
                        updateQuantity(item._id, '');
                      } else {
                        const val = parseInt(text);
                        if (!isNaN(val)) updateQuantity(item._id, val);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) updateQuantity(item._id, 1);
                      else if (val > item.availableStock) updateQuantity(item._id, item.availableStock);
                    }}
                    style={{
                      width: '52px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '1rem',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      padding: '4px 2px',
                      backgroundColor: 'transparent',
                      color: 'var(--neutral-900)'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(item._id, item.cartQty + 1)}
                    disabled={item.cartQty >= item.availableStock}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: item.cartQty >= item.availableStock ? 'not-allowed' : 'pointer', color: item.cartQty >= item.availableStock ? 'var(--neutral-300)' : 'var(--neutral-600)', padding: '0 4px', lineHeight: 1 }}
                  >+</button>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--neutral-400)', textAlign: 'right' }}>
                  {t('cart.max')}: {item.availableStock} {item.unit}
                </p>

                {/* Subtotal */}
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: 'var(--neutral-900)' }}>
                  ₹{(item.pricePerUnit * (item.cartQty || 0)).toLocaleString('en-IN')}
                </p>

                {/* Remove Button */}
                <button
                  onClick={() => { removeFromCart(item._id); toast(t('cart.remove')); }}
                  style={{ background: 'none', border: '1px solid #fecaca', color: 'var(--danger)', fontSize: '0.85rem', cursor: 'pointer', padding: '5px 12px', borderRadius: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  🗑️ {t('cart.remove')}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right: Order Summary Sidebar (sticky) */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--neutral-900)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '15px' }}>
              {t('cart.order_summary')}
            </h3>

            {/* Item Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {cartItems.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--neutral-600)', flex: 1, marginRight: '8px' }}>
                    {item.cropName} × {item.cartQty || 0}
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--neutral-800)', whiteSpace: 'nowrap' }}>
                    ₹{(item.pricePerUnit * (item.cartQty || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px solid var(--neutral-100)', marginBottom: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--neutral-700)' }}>{t('cart.total_estimate')}</span>
              <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary-700)' }}>
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{ fontSize: '1rem', padding: '14px', marginBottom: '12px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }}></span>
                  {t('cart.processing')}
                </span>
              ) : `🛍️ ${t('cart.place_order')}`}
            </button>

            {/* Send Enquiry Button */}
            <button
              onClick={handleSendEnquiry}
              disabled={loading}
              className="btn btn-full hover:bg-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white', fontSize: '1rem', padding: '14px', marginBottom: '16px', border: 'none', transition: 'background-color 0.2s' }}
            >
              ✉️ {t('cart.enquiry')}
            </button>

            {/* Call Manager / WhatsApp Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <a 
                href={`tel:${supportPhone}`} 
                className="btn btn-full hover:bg-emerald-700"
                style={{ flex: 1, backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', padding: '10px', textDecoration: 'none', border: 'none' }}
              >
                📞 {t('cart.call_manager')}
              </a>
              <a 
                href={`https://wa.me/${supportPhone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-full hover:bg-green-700"
                style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', padding: '10px', textDecoration: 'none', border: 'none' }}
              >
                💬 {t('cart.whatsapp')}
              </a>
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={handleClearCart}
              className="btn btn-full"
              style={{ backgroundColor: 'transparent', border: '1px solid #fecaca', color: 'var(--danger)', fontSize: '0.9rem', padding: '11px' }}
            >
              🗑️ {t('cart.clear_cart')}
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Cart;
