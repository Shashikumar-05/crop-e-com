import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

function WalletPanel({ userRole }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = JSON.parse(localStorage.getItem('user'))?.token;

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await axios.get('/api/wallet/my-wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(data);
    } catch (err) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (Number(withdrawAmount) > wallet.balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/wallet/request-withdrawal', { amount: Number(withdrawAmount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Wallet...</div>;
  if (!wallet) return null;

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>💳 My {userRole === 'Farmer' ? 'Revenue' : 'Earnings'} Wallet</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'Farmer' ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p style={{ margin: '0 0 5px', fontSize: '0.9rem', color: '#166534', fontWeight: '600' }}>Available Balance</p>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#15803d' }}>
            ₹{(wallet.balance || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default WalletPanel;
