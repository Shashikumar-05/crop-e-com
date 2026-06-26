import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

function ManagerWalletPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('user'))?.token;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/api/wallet/all-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    const note = window.prompt(`Enter an optional note for why this is ${status}:`);
    if (note === null) return; // cancelled

    try {
      await axios.put(`/api/wallet/process-request/${id}`, { status, managerNotes: note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '40px' }}>Loading requests...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>💳 Withdrawal Requests</h2>
      
      {requests.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '1.1rem' }}>No withdrawal requests pending.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {requests.map(req => (
            <div key={req._id} className="card" style={{ padding: '20px', borderLeft: req.status === 'Pending' ? '4px solid #f59e0b' : req.status === 'Approved' ? '4px solid #10b981' : '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#111827' }}>{req.user?.name} <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>({req.user?.role})</span></h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#4b5563' }}>Current Wallet Balance: ₹{req.user?.walletBalance}</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>Requested: ₹{req.amount.toLocaleString('en-IN')}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>Requested At: {new Date(req.createdAt).toLocaleString('en-IN')}</p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  {req.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <button className="btn btn-primary" style={{ backgroundColor: '#10b981', padding: '8px 16px' }} onClick={() => handleProcess(req._id, 'Approved')}>
                        ✅ Approve Request
                      </button>
                      <button className="btn btn-danger" style={{ padding: '8px 16px' }} onClick={() => handleProcess(req._id, 'Rejected')}>
                        ❌ Reject Request
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px',
                        backgroundColor: req.status === 'Approved' ? '#dcfce7' : '#fee2e2',
                        color: req.status === 'Approved' ? '#15803d' : '#b91c1c'
                      }}>
                        {req.status}
                      </span>
                      {req.managerNotes && <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>Note: {req.managerNotes}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManagerWalletPanel;
