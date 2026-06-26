import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function OrderSuccess() {
  const location = useLocation();
  const { orderId, totalAmount, method } = location.state || {};
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{
      maxWidth: '550px',
      margin: '60px auto',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ padding: '50px 40px' }}>
        {/* Animated Checkmark */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          backgroundColor: show ? 'var(--primary-100)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          transition: 'all 0.5s ease',
          transform: show ? 'scale(1)' : 'scale(0)'
        }}>
          <svg
            width="48" height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary-600)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: show ? 1 : 0,
              transition: 'opacity 0.4s ease 0.3s'
            }}
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style={{
          fontSize: '1.8rem',
          color: 'var(--neutral-900)',
          margin: '0 0 10px 0'
        }}>
          {method === 'COD' ? 'Order Placed Successfully! 🎉' : 'Payment Successful! 🎉'}
        </h1>

        <p style={{ color: 'var(--neutral-500)', marginBottom: '24px', fontSize: '1rem' }}>
          Your order has been placed. The farmer will contact you soon.
        </p>

        {orderId && (
          <div style={{
            backgroundColor: 'var(--neutral-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '16px',
            border: '1px solid var(--neutral-200)'
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</p>
            <p style={{ margin: 0, fontWeight: '600', color: 'var(--neutral-800)', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {orderId}
            </p>
          </div>
        )}

        {totalAmount && (
          <div style={{
            backgroundColor: 'var(--primary-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '30px',
            border: '1px solid var(--primary-100)'
          }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{method === 'COD' ? 'Amount to Pay (COD)' : 'Amount Paid'}</p>
            <p style={{ margin: 0, fontWeight: '700', color: 'var(--primary-700)', fontSize: '1.3rem' }}>
              ₹{Number(totalAmount).toLocaleString('en-IN')}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/my-orders" className="btn btn-primary btn-full" style={{ padding: '14px', fontSize: '1rem' }}>
            📦 View My Orders
          </Link>
          <Link to="/marketplace" className="btn btn-secondary btn-full" style={{ padding: '12px', fontSize: '0.95rem' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
