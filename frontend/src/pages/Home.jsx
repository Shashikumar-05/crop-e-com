import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

function Home() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // Protect route — must be logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, []);

  const handleAddToCart = (crop) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role === 'Farmer') return; // Should not reach here but guard anyway
    const alreadyInCart = cartItems.find(i => i._id === crop._id);
    addToCart(crop);
    if (alreadyInCart) {
      toast.success(`+1 ${crop.cropName} added to cart!`);
    } else {
      toast.success(`${crop.cropName} added to cart! 🛒`);
    }
  };

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const { data } = await axios.get('/api/crops');
        setCrops(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load marketplace data');
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const filteredCrops = crops.filter(crop => 
    crop.cropName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    crop.farmLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto' }}>
      
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem' }}>{t('home.welcome')}</h1>
          <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '1.05rem' }}>{t('home.subtitle')}</p>
        </div>
        
        {/* Modern Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input 
            type="text" 
            placeholder={t('navbar.search_placeholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 40px', 
              borderRadius: '40px',
              border: '1px solid var(--neutral-200)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              backgroundColor: 'var(--white)'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-500)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          Loading marketplace inventory...
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ System Error</h3>
          {error}
        </div>
      ) : filteredCrops.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--neutral-200)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🌾</div>
          <h3 style={{ color: 'var(--neutral-800)', margin: '0 0 10px 0' }}>No crops found</h3>
          <p style={{ color: 'var(--neutral-500)', margin: 0 }}>Try adjusting your search terms or check back later for new inventory.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredCrops.map(crop => (
            <div key={crop._id} className="card" style={{ display: 'flex', flexDirection: 'column', opacity: crop.availableStock <= 0 ? 0.6 : 1, filter: crop.availableStock <= 0 ? 'grayscale(0.5)' : 'none', transition: 'all 0.3s' }}>
              
              {/* Image Container (Fixed Aspect Ratio) */}
              <Link to={`/listings/${crop._id}`} onClick={(e) => { if (crop.availableStock <= 0) e.preventDefault(); }} style={{ textDecoration: 'none', cursor: crop.availableStock <= 0 ? 'not-allowed' : 'pointer' }}>
                <div style={{ width: '100%', paddingTop: '66.66%', position: 'relative', backgroundColor: 'var(--neutral-100)', overflow: 'hidden' }}>
                
                {/* Out of stock overlay */}
                {crop.availableStock <= 0 && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>Product<br/>Unavailable</span>
                  </div>
                )}
                {crop.photos && crop.photos.length > 0 ? (
                  <img 
                    src={crop.photos[0]} 
                    alt={crop.cropName} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>No Image</span>
                  </div>
                )}
                
                {/* Price Badge Overlay */}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', color: 'var(--primary-700)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}>
                  ₹{crop.pricePerUnit} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--neutral-500)' }}>/ {crop.unit}</span>
                </div>
              </div>
              </Link>
              
              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.25rem', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {crop.cropName}
                  {crop.availableStock <= 0 && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', border: '1px solid #fca5a5' }}>
                      Unavailable
                    </span>
                  )}
                </h3>
                
                {/* Low Stock Warning */}
                {crop.availableStock > 0 && crop.availableStock <= 20 && (
                  <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                    Low Stock: {crop.availableStock} {crop.unit}
                  </span>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    Stock: <span style={{ fontWeight: '600', color: crop.availableStock <= 0 ? '#dc2626' : 'var(--neutral-800)' }}>{crop.availableStock} {crop.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {crop.farmLocation}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {crop.farmerId?.name || 'Verified Farmer'}
                  </div>
                </div>
                
                {/* Add to Cart / Role-aware Button */}
                {currentUser?.role === 'Farmer' ? (
                  <div title="You are a seller. Switch to a Buyer account to add items." style={{ position: 'relative' }}>
                    <button
                      disabled
                      className="btn btn-full"
                      style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-400)', cursor: 'not-allowed', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                      You are a Seller
                    </button>
                  </div>
                ) : (() => {
                  const inCart = cartItems.find(i => i._id === crop._id);
                  return (
                    <button
                      className={`btn btn-full ${crop.availableStock <= 0 ? 'btn-secondary' : inCart ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleAddToCart(crop)}
                      disabled={crop.availableStock <= 0}
                      style={{ gap: '8px', opacity: crop.availableStock <= 0 ? 0.7 : 1, cursor: crop.availableStock <= 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {crop.availableStock <= 0 ? (
                        'Currently Unavailable'
                      ) : inCart ? (
                        <>✓ In Cart ({inCart.cartQty})</>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                          {t('home.add_to_cart')}
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
