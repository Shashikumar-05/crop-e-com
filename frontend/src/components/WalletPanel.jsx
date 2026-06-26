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
        {userRole !== 'Farmer' && (
          <div className="card" style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 5px', fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Total Withdrawn</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#334155' }}>
              ₹{(wallet.totalWithdrawn || 0).toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {userRole !== 'Farmer' && (
        <>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px', fontSize: '1.2rem' }}>Request Withdrawal</h3>
            <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="number" 
                placeholder="Enter amount (₹)" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                max={wallet.balance || 0}
                min="1"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || (wallet.balance || 0) <= 0}>
                {isSubmitting ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px', fontSize: '1.1rem' }}>Withdrawal History</h3>
            {wallet.withdrawals.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.9rem' }}>No withdrawal requests yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {wallet.withdrawals.map((req) => (
                  <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600' }}>₹{req.amount.toLocaleString('en-IN')}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        {new Date(req.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: req.status === 'Pending' ? '#fef3c7' : req.status === 'Approved' ? '#dcfce7' : '#fee2e2',
                        color: req.status === 'Pending' ? '#b45309' : req.status === 'Approved' ? '#15803d' : '#b91c1c'
                      }}>
                        {req.status}
                      </span>
                      {req.managerNotes && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>Note: {req.managerNotes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default WalletPanel;
