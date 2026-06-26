import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth(); // or check localStorage

  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'Buyer') navigate('/marketplace', { replace: true });
      else if (user.role === 'Farmer') navigate('/dashboard', { replace: true });
      else if (user.role === 'Delivery') navigate('/delivery', { replace: true });
      else if (user.role === 'Manager') navigate('/manager/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Don't render if redirecting
  if (user) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '40px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary-500)', borderRadius: '50%', display: 'inline-block' }}></span>
          Farm Fresh, Delivered Fast
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', color: 'var(--neutral-900)', marginBottom: '16px', lineHeight: 1.1, letterSpacing: '-1px' }}>
          Agritech — Fresh Produce, <br />Direct to Your Door.
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'var(--neutral-500)', marginBottom: '32px', lineHeight: 1.6, maxWidth: '600px', marginInline: 'auto' }}>
          Order fresh fruits, vegetables, grains, and organic products directly from local farmers. Track your delivery in real-time.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ width: '100%', maxWidth: '1000px', marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '30px', color: 'var(--neutral-800)' }}>Choose Your Role to Get Started</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { id: 'Buyer', icon: '🛒', title: 'Customer', desc: 'Browse products, add to cart, place orders and track delivery in real-time.' },
            { id: 'Farmer', icon: '🌾', title: 'Seller', desc: 'List products, manage stock, confirm orders and track flow.' },
            { id: 'Delivery', icon: '🚚', title: 'Delivery', desc: 'Pick up orders, deliver to customers, earn per delivery and track history.' },
          ].map((item, i) => (
            <div key={i} className="card" 
              onClick={() => navigate(`/login?role=${item.id}`)}
              style={{ 
                padding: '30px', 
                textAlign: 'center', 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s', 
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--neutral-900)' }}>{item.title}</h3>
              <p style={{ color: 'var(--neutral-500)', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px' }}>
        {[
          { icon: '💰', title: 'Fair Pricing', desc: 'No middlemen. Farmers earn more, customers pay less.' },
          { icon: '📦', title: 'Order Tracking', desc: 'Track every order from confirmation to doorstep delivery.' },
          { icon: '✅', title: 'Verified Sellers', desc: 'All farmers and products verified for quality assurance.' },
          { icon: '🚀', title: 'Fast Delivery', desc: 'Dedicated delivery partners ensure quick fresh deliveries.' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '14px', padding: '20px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--neutral-900)' }}>{f.title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-500)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Landing;
