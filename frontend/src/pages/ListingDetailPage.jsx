import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

// ─── Helper: format date ────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

// ─── Sub-component: Image Carousel ──────────────────────────────────────────
function ImageCarousel({ photos, cropName }) {
  const [current, setCurrent] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9', backgroundColor: '#f0fdf4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '16px', flexDirection: 'column', gap: '12px',
        border: '2px dashed #bbf7d0',
      }}>
        <span style={{ fontSize: '4rem' }}>🌾</span>
        <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>No photos available</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', backgroundColor: '#000' }}>
      <img
        src={photos[current]}
        alt={`${cropName} - photo ${current + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
      />

      {photos.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button onClick={prev} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)',
          }}>
            ‹
          </button>
          <button onClick={next} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)',
          }}>
            ›
          </button>

          {/* Dot Indicators */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px',
          }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '24px' : '8px', height: '8px',
                  borderRadius: '4px', border: 'none', cursor: 'pointer',
                  backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Photo count badge */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
        backdropFilter: 'blur(4px)',
      }}>
        {current + 1} / {photos.length}
      </div>
    </div>
  );
}

// ─── Sub-component: Contact Farmer Modal ────────────────────────────────────
function ContactFarmerModal({ crop, onClose }) {
  const [message, setMessage] = useState(
    `Hi, I'm interested in buying your ${crop?.cropName}. Can we discuss the details?`
  );
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Please write a message');

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.post('/api/enquiry', {
        items: [{ listingId: crop._id, quantity }],
      });
      toast.success('Message sent to farmer! 📩');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)',
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px',
        padding: '32px', width: '100%', maxWidth: '480px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease',
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }`}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#111827' }}>
              Contact Farmer
            </h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              About: <strong>{crop?.cropName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
              Quantity Interested
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  min="1"
                  max={crop?.availableStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{
                  width: '100px', padding: '10px 14px', borderRadius: '10px',
                  border: '2px solid #e5e7eb', fontSize: '1rem',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              <span style={{ color: '#6b7280', fontWeight: '600' }}>{crop?.unit}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder="Write your message to the farmer..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '2px solid #e5e7eb', fontSize: '0.95rem',
                resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              border: '2px solid #e5e7eb', backgroundColor: '#fff',
              cursor: 'pointer', fontWeight: '600', color: '#374151',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{
              flex: 2, padding: '12px', borderRadius: '10px',
              border: 'none', backgroundColor: submitting ? '#86efac' : '#16a34a',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s',
            }}>
              {submitting ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  Sending...
                </>
              ) : '📩 Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-component: Related Listings ────────────────────────────────────────
function RelatedListings({ category, currentId }) {
  const [related, setRelated] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!category) return;
    api.get('/api/crops')
      .then(({ data }) => {
        const filtered = data
          .filter(c => c._id !== currentId && c.availableStock > 0)
          .slice(0, 4);
        setRelated(filtered);
      })
      .catch(() => {});
  }, [category, currentId]);

  if (related.length === 0) return null;

  return (
    <section style={{ marginTop: '48px' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🌿</span> You Might Also Like
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {related.map(crop => (
          <div
            key={crop._id}
            onClick={() => navigate(`/listings/${crop._id}`)}
            style={{
              backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden',
              border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ aspectRatio: '16/10', backgroundColor: '#f0fdf4', position: 'relative' }}>
              {crop.photos?.[0] ? (
                <img src={crop.photos[0]} alt={crop.cropName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🌾</div>
              )}
            </div>
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111827' }}>{crop.cropName}</h4>
              <p style={{ margin: 0, fontWeight: '700', color: '#16a34a' }}>₹{crop.pricePerUnit} / {crop.unit}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>📍 {crop.farmLocation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Component: ListingDetailPage ──────────────────────────────────────
function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [addQty, setAddQty] = useState(1);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  })();

  const isBuyer = currentUser?.role === 'Buyer';
  const isFarmer = currentUser?.role === 'Farmer';
  const inCart = cartItems.find(i => i._id === id);

  // Protect route — must be logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return; // Don't fetch if not logged in
    const fetchCrop = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/crops/${id}`);
        setCrop(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('404');
        } else {
          setError(err.response?.data?.message || 'Failed to load listing. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCrop();
  }, [id]);

  const handleAddToCart = useCallback(() => {
    if (!currentUser) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    if (isFarmer) {
      toast.error('Farmers cannot buy. Switch to a Buyer account.');
      return;
    }
    const finalQty = addQty === '' || isNaN(addQty) || addQty < 1 ? 1 : addQty;
    const maxAllowed = crop.availableStock - (inCart ? inCart.cartQty : 0);
    if (finalQty > maxAllowed && maxAllowed > 0) {
      addToCart({ ...crop, addQty: maxAllowed });
      toast.success(`${maxAllowed} ${crop.unit} of ${crop.cropName} added to cart (Max limit reached)! 🛒`);
    } else if (maxAllowed <= 0) {
      toast.error(`You already have all available stock in your cart!`);
    } else {
      addToCart({ ...crop, addQty: finalQty });
      toast.success(`${finalQty} ${crop.unit} of ${crop.cropName} added to cart! 🛒`);
    }
  }, [crop, currentUser, isFarmer, inCart, addToCart, navigate, addQty]);

  const handleContactFarmer = () => {
    if (!currentUser) {
      toast.error('Please log in to contact farmers');
      navigate('/login');
      return;
    }
    if (isFarmer) {
      toast.error('You are a farmer — you cannot message yourself.');
      return;
    }
    setShowModal(true);
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px', color: '#6b7280' }}>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '48px', height: '48px', border: '4px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '1.1rem' }}>Loading listing details...</p>
      </div>
    );
  }

  // ── 404 State ──
  if (error === '404' || (!loading && !crop)) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '12px' }}>Listing Not Found</h1>
        <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '1.05rem' }}>
          This crop listing doesn't exist or may have been removed by the farmer.
        </p>
        <button
          onClick={() => navigate('/marketplace')}
          style={{
            backgroundColor: '#16a34a', color: '#fff', border: 'none',
            padding: '14px 32px', borderRadius: '12px', cursor: 'pointer',
            fontWeight: '600', fontSize: '1rem',
          }}
        >
          ← Browse Marketplace
        </button>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '32px' }}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h3 style={{ color: '#dc2626', margin: '12px 0 8px 0' }}>Something went wrong</h3>
          <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const farmer = crop.farmerId;
  const farmerInitial = farmer?.name?.charAt(0)?.toUpperCase() || 'F';

  return (
    <>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .listing-detail-page { animation: fadeIn 0.4s ease; }
        .action-btn { transition: all 0.2s; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); }
      `}</style>

      <div className="listing-detail-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>

        {/* ── Breadcrumb ── */}
        <nav style={{ marginBottom: '24px', fontSize: '0.9rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/marketplace" style={{ color: '#6b7280', textDecoration: 'none' }}>Marketplace</Link>
          <span>›</span>
          <span style={{ color: '#111827', fontWeight: '500' }}>{crop.cropName}</span>
        </nav>

        {/* ── Main Content Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 1fr)',
          gap: '36px',
          alignItems: 'start',
        }}>

          {/* ── Left: Image Gallery ── */}
          <div>
            <ImageCarousel photos={crop.photos} cropName={crop.cropName} />

            {/* Description Card */}
            {crop.description && (
              <div style={{ marginTop: '20px', backgroundColor: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '1.05rem', fontWeight: '700' }}>📝 Description</h3>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.7' }}>{crop.description}</p>
              </div>
            )}

            {/* Farmer Card */}
            <div style={{ marginTop: '20px', backgroundColor: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '1.05rem', fontWeight: '700' }}>👨‍🌾 About the Farmer</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: '800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0, border: '2px solid #bbf7d0',
                  }}>
                    {farmerInitial}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '1.1rem', color: '#111827' }}>
                      {farmer?.name || 'Verified Farmer'}
                    </p>
                    {farmer?.location && (
                      <p style={{ margin: '0 0 2px 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        📍 {farmer.location}
                      </p>
                    )}
                    {farmer?.phone && (
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                        📞 {farmer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {farmer?.phone && (
                  <a
                    href={`tel:${farmer.phone}`}
                    style={{
                      backgroundColor: '#16a34a', color: 'white', borderRadius: '50%',
                      width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s', flexShrink: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Call Farmer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                  </a>
                )}
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                Listed on {formatDate(crop.createdAt)}
              </p>
            </div>
          </div>

          {/* ── Right: Details & Actions ── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

              {/* Availability Badge */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                  backgroundColor: crop.availableStock > 0 ? '#dcfce7' : '#fee2e2',
                  color: crop.availableStock > 0 ? '#16a34a' : '#dc2626',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  {crop.availableStock > 0 ? 'Available' : 'Out of Stock'}
                </span>
                
                {crop.availableStock > 0 && crop.availableStock <= 20 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '10px',
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                    backgroundColor: '#fef3c7', color: '#b45309',
                  }}>
                    ⚠️ Low Stock ({crop.availableStock} {crop.unit} left)
                  </span>
                )}
              </div>

              {/* Crop Name */}
              <h1 style={{ margin: '0 0 6px 0', fontSize: '2rem', color: '#111827', lineHeight: '1.2' }}>
                {crop.cropName}
              </h1>

              {/* Location */}
              <p style={{ margin: '0 0 20px 0', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📍</span> {crop.farmLocation}
              </p>

              {/* Price */}
              <div style={{ backgroundColor: '#f0fdf4', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</p>
                <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', color: '#16a34a' }}>
                  ₹{crop.pricePerUnit?.toLocaleString('en-IN')}
                  <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#4b5563' }}>
                    {' '}/ {crop.unit}
                  </span>
                </p>
              </div>

              {/* Stock Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '14px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.78rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>Remaining Stock</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: crop.availableStock <= 0 ? '#dc2626' : '#111827' }}>
                    {crop.availableStock} {crop.unit}
                  </p>
                </div>
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '14px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.78rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>Unit</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#111827', textTransform: 'capitalize' }}>
                    {crop.unit}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isFarmer ? (
                <div style={{ padding: '14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'center', color: '#92400e', fontSize: '0.9rem' }}>
                  🌾 You are viewing as a <strong>Farmer</strong>. Only Buyers can purchase.
                </div>
              ) : crop.availableStock <= 0 ? (
                <div style={{ padding: '14px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', textAlign: 'center', color: '#991b1b', fontSize: '0.9rem', marginBottom: '12px' }}>
                  ❌ This item is currently <strong>Out of Stock</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Quantity Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.95rem' }}>Quantity:</label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, crop.availableStock - (inCart ? inCart.cartQty : 0))}
                      value={addQty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setAddQty('');
                        else {
                          const num = parseInt(val);
                          if (!isNaN(num)) setAddQty(num);
                        }
                      }}
                      onBlur={() => {
                        const maxAllowed = crop.availableStock - (inCart ? inCart.cartQty : 0);
                        if (addQty === '' || addQty < 1) setAddQty(1);
                        else if (maxAllowed > 0 && addQty > maxAllowed) setAddQty(maxAllowed);
                      }}
                      style={{
                        width: '80px', padding: '10px', borderRadius: '10px',
                        border: '2px solid #e5e7eb', fontSize: '1rem', textAlign: 'center',
                        outline: 'none', transition: 'border-color 0.2s'
                      }}
                    />
                    <span style={{ color: '#6b7280', fontWeight: '600' }}>{crop.unit}</span>
                  </div>

                  {/* Add to Cart */}
                    <button
                      className="action-btn"
                      onClick={handleAddToCart}
                      disabled={crop.availableStock === 0 || (inCart && inCart.cartQty >= crop.availableStock)}
                      style={{
                        width: '100%', padding: '15px', borderRadius: '14px',
                        backgroundColor: inCart ? '#f0fdf4' : '#16a34a',
                        color: inCart ? '#16a34a' : '#fff',
                        fontWeight: '700', fontSize: '1rem', cursor: (crop.availableStock === 0 || (inCart && inCart.cartQty >= crop.availableStock)) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        border: inCart ? '2px solid #16a34a' : '2px solid transparent',
                        opacity: (crop.availableStock === 0 || (inCart && inCart.cartQty >= crop.availableStock)) ? 0.6 : 1
                      }}
                    >
                      {inCart ? `✓ In Cart (${inCart.cartQty}) — Add More` : '🛒 Add to Cart'}
                    </button>

                  {/* Contact Farmer */}
                  <button
                    className="action-btn"
                    onClick={handleContactFarmer}
                    disabled={crop.availableStock <= 0}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '14px',
                      border: '2px solid #16a34a', backgroundColor: '#fff',
                      color: '#16a34a', fontWeight: '700', fontSize: '1rem', cursor: crop.availableStock <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      opacity: crop.availableStock <= 0 ? 0.5 : 1
                    }}
                  >
                    💬 Contact Farmer
                  </button>
                </div>
              )}

              {/* Cart link hint */}
              {inCart && (
                <p style={{ textAlign: 'center', margin: '12px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                  <Link to="/cart" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                    View Cart →
                  </Link>
                </p>
              )}

              {/* Posted date */}
              <p style={{ textAlign: 'center', margin: '16px 0 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                🕒 Listed {formatDate(crop.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Related Listings ── */}
        <RelatedListings category={crop.category} currentId={id} />
      </div>

      {/* ── Contact Farmer Modal ── */}
      {showModal && (
        <ContactFarmerModal crop={crop} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default ListingDetailPage;
