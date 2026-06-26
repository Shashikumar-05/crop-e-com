import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import WalletPanel from '../components/WalletPanel';

function RevenuePage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || user.role !== 'Farmer') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--neutral-900)', margin: '0 0 5px' }}>Store Revenue</h1>
          <p style={{ color: 'var(--neutral-500)', margin: 0 }}>Manage your earnings and request withdrawals.</p>
        </div>
        <Link to="/earnings" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          <span style={{ fontSize: '1.1rem' }}>💰</span>
          Revenue History
        </Link>
      </div>
      
      <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)' }}>
        <WalletPanel userRole={user.role} />
      </div>
    </div>
  );
}

export default RevenuePage;
