import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import useRazorpay from '../hooks/useRazorpay';

function OrderTracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const { handleExistingPayment } = useRazorpay(null, navigate);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/payment/my-orders', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Order status flow for progress tracker
  const statusSteps = ['Order Placed', 'Waiting for Manager', 'Delivery Assigned', 'Out For Delivery', 'Delivered'];

  const getStepIndex = (order) => {
    const { orderStatus } = order;
    if (orderStatus === 'Cancelled' || orderStatus === 'Rejected' || orderStatus === 'Cancellation Pending') return -1;
    if (orderStatus === 'Delivered') return 4;
    if (orderStatus === 'Out for Delivery' || orderStatus === 'Picked Up') return 3;
    if (orderStatus === 'Assigned to Delivery Partner' || orderStatus === 'Assigned') return 2;
    if (orderStatus === 'Waiting for Manager Review' || orderStatus === 'Pending') return 1;
    return 0;
  };

  const statusColor = (status) => {
    const map = {
      'Inquiry': '#6b7280',
      'Accepted': '#3b82f6',
      'Pending': '#f59e0b',
      'Waiting for Manager Review': '#eab308',
      'Bill Confirmed': '#8b5cf6',
      'Assigned to Delivery Partner': '#3b82f6',
      'Picked Up': '#6366f1',
      'Out for Delivery': '#f97316',
      'Delivered': '#22c55e',
      'Cancelled': '#ef4444'
    };
    return map[status] || '#6b7280';
  };

  const handleCOD = async (orderId) => {
    setPayLoading(true);
    try {
      const { data } = await axios.post('/api/payment/cod-existing', { orderId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(data.message);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to confirm COD');
    } finally {
      setPayLoading(false);
    }
  };

  const [filter, setFilter] = useState('Active'); // Active, History

  const filteredOrders = orders.filter(o => {
    if (filter === 'Active') return !['Delivered', 'Cancelled', 'Inquiry'].includes(o.orderStatus);
    if (filter === 'History') return ['Delivered', 'Cancelled'].includes(o.orderStatus);
    if (filter === 'Enquiries') return o.orderStatus === 'Inquiry';
    return true;
  });

  const activeCount = orders.filter(o => !['Delivered', 'Cancelled', 'Inquiry'].includes(o.orderStatus)).length;
  const enquiryCount = orders.filter(o => o.orderStatus === 'Inquiry').length;

  if (loading) return <p style={{ textAlign: 'center', padding: '60px', color: 'var(--neutral-400)' }}>Loading orders...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.8rem' }}>📦 My Orders</h1>
        <p style={{ margin: 0, color: 'var(--neutral-500)' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      {/* Tabs */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', overflowX: 'auto' }}>
          {[
            { key: 'Active', count: activeCount },
            { key: 'Enquiries', count: enquiryCount },
            { key: 'History', count: 0 }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', border: 'none',
                backgroundColor: filter === tab.key ? '#1d4ed8' : 'transparent',
                color: filter === tab.key ? '#fff' : '#4b5563',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {tab.key}
              {tab.count > 0 && (
                <span style={{
                  backgroundColor: filter === tab.key ? '#fff' : '#ef4444', 
                  color: filter === tab.key ? '#1d4ed8' : '#fff', 
                  borderRadius: '50%',
                  padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold',
                  minWidth: '20px', textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
          <h3 style={{ color: 'var(--neutral-700)', marginBottom: '10px' }}>No orders yet</h3>
          <p style={{ color: 'var(--neutral-500)', marginBottom: '24px' }}>Start shopping fresh products!</p>
          <Link to="/marketplace" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map(order => {
            const currentStep = getStepIndex(order);
            const isCancelled = order.orderStatus === 'Cancelled';

            return (
              <div key={order._id} className="card" style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Order ID</p>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem', color: 'var(--neutral-700)' }}>{order.order_id || '#' + order._id.slice(-8).toUpperCase()}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--neutral-400)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <span style={{
                      padding: '5px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: statusColor(order.orderStatus) + '20',
                      color: statusColor(order.orderStatus)
                    }}>
                      {order.orderStatus === 'Inquiry' ? 'Waiting For Confirmation' : order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker */}
                {!isCancelled && (
                  <div style={{ marginBottom: '22px', padding: '0 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      {/* Background line */}
                      <div style={{
                        position: 'absolute', top: '14px', left: '20px', right: '20px', height: '3px',
                        backgroundColor: 'var(--neutral-200)', zIndex: 0
                      }}></div>
                      {/* Progress line */}
                      <div style={{
                        position: 'absolute', top: '14px', left: '20px', height: '3px',
                        width: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%`,
                        maxWidth: 'calc(100% - 40px)',
                        backgroundColor: '#22c55e', zIndex: 1,
                        transition: 'width 0.5s ease'
                      }}></div>

                      {statusSteps.map((step, i) => (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            backgroundColor: i <= currentStep ? '#22c55e' : 'var(--neutral-200)',
                            color: i <= currentStep ? 'white' : 'var(--neutral-400)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: '700',
                            transition: 'all 0.3s',
                            border: i === currentStep ? '3px solid #bbf7d0' : 'none'
                          }}>
                            {i <= currentStep ? '✓' : i + 1}
                          </div>
                          <p style={{
                            margin: '6px 0 0', fontSize: '0.65rem', textAlign: 'center',
                            color: i <= currentStep ? '#15803d' : 'var(--neutral-400)',
                            fontWeight: i === currentStep ? '700' : '400',
                            maxWidth: '70px', lineHeight: 1.2
                          }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Banner */}
                {isCancelled && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, color: '#b91c1c', fontWeight: '600', fontSize: '0.9rem' }}>❌ This order was cancelled</p>
                    {order.cancelReason && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#991b1b' }}>{order.cancelReason}</p>}
                  </div>
                )}

                {/* Items */}
                <div style={{ marginBottom: '14px' }}>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.88rem', borderBottom: '1px solid var(--neutral-50)' }}>
                      <span style={{ color: 'var(--neutral-700)' }}>{item.cropName} × {item.quantity} {item.unit}</span>
                      <span style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>₹{item.subtotal?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Manual Bill Breakdown removed */}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--neutral-100)', paddingTop: '14px' }}>
                  <div>
                    {order.deliveryPartner && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                        🚚 Delivery by: <strong>{order.deliveryPartner.name}</strong>
                      </p>
                    )}
                    {order.razorpay_payment_id && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--neutral-400)' }}>Payment: {order.razorpay_payment_id}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary-700)' }}>
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </p>
                    {order.orderStatus === 'Delivered' && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: '600' }}>Final Amount Paid</p>
                    )}
                  </div>
                </div>

                {/* Delivered timestamp */}
                {order.orderStatus === 'Delivered' && order.deliveredAt && (
                  <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '6px' }}>
                    ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {/* Track Map Button */}
                {!isCancelled && order.orderStatus !== 'Pending' && order.orderStatus !== 'Waiting for Manager Review' && (
                  <div style={{ marginTop: '15px' }}>
                    <Link to={`/track/${order._id}`} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      📍 Track on Map
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
