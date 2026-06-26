import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function SellerOrders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pending: 0, delivered: 0 });
  const [filter, setFilter] = useState('all'); // all, Pending, Confirmed, Packed, etc.
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null); // which order is being assigned
  const [selectedPartner, setSelectedPartner] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || user.role !== 'Farmer') { navigate('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const [ordersRes, partnersRes, statsRes] = await Promise.all([
        axios.get('/api/orders/seller', { headers }),
        axios.get('/api/orders/delivery-partners', { headers }),
        axios.get('/api/orders/seller-stats', { headers })
      ]);
      setOrders(ordersRes.data);
      setPartners(partnersRes.data);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`${t('seller_orders.order_status_update')} ${t(`seller_orders.status_${newStatus.replace(/ /g, '_').toLowerCase()}`)}`);
      fetchAll();
    } catch (err) { toast.error(t('seller_orders.failed_update')); }
  };

  const handleAssign = async (orderId) => {
    if (!selectedPartner) { toast.error('Select a delivery partner'); return; }
    try {
      await axios.put(`/api/orders/${orderId}/assign`,
        { deliveryPartnerId: selectedPartner },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Delivery partner assigned!');
      setAssigningId(null);
      setSelectedPartner('');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign'); }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm(t('seller_orders.cancel_confirm'))) return;
    try {
      await axios.put(`/api/orders/${orderId}/cancel`,
        { reason: 'Cancelled by seller' },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(t('seller_orders.order_cancelled'));
      fetchAll();
    } catch (err) { toast.error(t('seller_orders.failed_cancel')); }
  };

  const statusBadge = (status) => {
    const map = {
      'Inquiry': { bg: '#e0e7ff', text: '#4338ca' },
      'Accepted': { bg: '#dbeafe', text: '#1d4ed8' },
      'Rejected': { bg: '#fee2e2', text: '#b91c1c' },
      'Pending': { bg: '#fef3c7', text: '#92400e' },
      'Confirmed': { bg: '#dbeafe', text: '#1d4ed8' },
      'Packed': { bg: '#e0e7ff', text: '#4338ca' },
      'Waiting for Manager Review': { bg: '#fef3c7', text: '#92400e' },
      'Assigned to Delivery Partner': { bg: '#cffafe', text: '#0e7490' },
      'Picked Up': { bg: '#fef9c3', text: '#854d0e' },
      'Out for Delivery': { bg: '#fef9c3', text: '#854d0e' },
      'Delivered': { bg: '#dcfce7', text: '#15803d' },
      'Cancelled': { bg: '#fee2e2', text: '#b91c1c' },
    };
    const c = map[status] || { bg: '#f3f4f6', text: '#374151' };
    return { backgroundColor: c.bg, color: c.text, padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' };
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

  // Farmer is now a passive observer of order fulfillment until assigned/picked up
  const nextAction = (status) => null;

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📋 {t('seller_orders.title')}</h1>
      <p style={{ color: 'var(--neutral-500)', marginBottom: '25px' }}>{t('seller_orders.subtitle')}</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '25px' }}>
        {[
          { label: t('seller_orders.total_orders'), value: stats.totalOrders, icon: '📦', color: '#3b82f6' },
          { label: t('seller_orders.pending_stat'), value: stats.pending, icon: '⏳', color: '#f59e0b' },
          { label: t('seller_orders.delivered_stat'), value: stats.delivered, icon: '✅', color: '#22c55e' },
          { label: t('seller_orders.revenue'), value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', margin: '4px 0 2px', color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['all', 'Inquiry', 'Accepted', 'Rejected', 'Pending', 'Waiting for Manager Review', 'Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'].map(f => {
          const count = f === 'all' ? orders.length : orders.filter(o => o.orderStatus === f).length;
          
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 14px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {f === 'all' ? t('seller_orders.all') : t(`seller_orders.status_${f.replace(/ /g, '_').toLowerCase()}`)}
              
              {count > 0 && f !== 'all' && ['Pending', 'Waiting for Manager Review'].includes(f) && (
                <span style={{
                  backgroundColor: filter === f ? '#fff' : '#ef4444', 
                  color: filter === f ? 'var(--primary-600)' : 'white', 
                  borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', 
                  fontWeight: 'bold', minWidth: '18px', textAlign: 'center'
                }}>
                  {count}
                </span>
              )}
              {f === 'all' && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--neutral-400)' }}>{t('seller_orders.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '50px', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '10px' }}>📋</p>
          <p style={{ color: 'var(--neutral-500)' }}>{t('seller_orders.no_orders')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(order => (
            <div key={order._id} className="card" style={{ padding: '20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{order.order_id || '#' + order._id.slice(-8).toUpperCase()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginLeft: '12px' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <span style={statusBadge(order.orderStatus)}>{t(`seller_orders.status_${order.orderStatus.replace(/ /g, '_').toLowerCase()}`)}</span>
              </div>

              {/* Customer */}
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: 'var(--neutral-50)', 
                borderRadius: '10px', 
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--neutral-100)'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: 'var(--neutral-800)' }}>👤 {order.buyer?.name || t('seller_orders.customer')}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                    📞 {order.buyer?.phone} &nbsp;|&nbsp; 📍 {order.deliveryAddress || order.buyer?.location || 'N/A'}
                  </p>
                </div>
                
                {order.buyer?.phone && (
                  <a href={`tel:${order.buyer.phone}`} 
                     className="call-btn"
                     style={{ 
                       width: '38px', 
                       height: '38px', 
                       borderRadius: '50%', 
                       backgroundColor: '#15803d', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       color: 'white',
                       textDecoration: 'none',
                       boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                       cursor: 'pointer'
                     }}
                     title="Call Customer"
                  >
                    <Phone size={18} fill="white" />
                  </a>
                )}
              </div>

              {/* Items */}
              <div style={{ marginBottom: '12px' }}>
                {(() => {
                  const farmerItems = order.items?.filter(item => item.farmer === user._id || item.farmer?._id === user._id) || [];
                  const farmerTotal = farmerItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
                  
                  return (
                    <>
                      {farmerItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                          <span>{item.cropName} × {item.quantity} {item.unit}</span>
                          <span style={{ fontWeight: '600' }}>₹{item.subtotal}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid var(--neutral-200)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700' }}>{t('seller_orders.your_total')}</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-700)', fontSize: '1.05rem' }}>₹{farmerTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Delivery partner info */}
              {order.deliveryPartner && (
                <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: '10px' }}>
                  🚚 {t('seller_orders.assigned_to')} <strong>{order.deliveryPartner.name}</strong> (📞 {order.deliveryPartner.phone})
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {order.orderStatus === 'Inquiry' && (
                  <>
                    <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px', backgroundColor: '#15803d', borderColor: '#15803d' }}
                      onClick={() => updateStatus(order._id, 'Accepted')}>
                      ✅ {t('seller_orders.accept_inquiry')}
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 16px', color: '#b91c1c', borderColor: '#fca5a5' }}
                      onClick={() => updateStatus(order._id, 'Rejected')}>
                      ❌ {t('seller_orders.reject_inquiry')}
                    </button>
                  </>
                )}

                {/* Next status action */}
                {nextAction(order.orderStatus) && (
                  <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                    onClick={() => updateStatus(order._id, nextAction(order.orderStatus).next)}>
                    {nextAction(order.orderStatus).label}
                  </button>
                )}

                {/* Notice for Manager assignment */}
                {(order.orderStatus === 'Accepted' || order.orderStatus === 'Packed' || order.orderStatus === 'Waiting for Manager Assignment') && (
                  <span style={{ fontSize: '0.82rem', color: '#854d0e', padding: '7px 0', fontWeight: '600', backgroundColor: '#fef9c3', borderRadius: '6px', paddingInline: '10px' }}>
                     ⏳ {t('seller_orders.pending_manager')}
                  </span>
                )}

                {/* Cancel */}
                {!['Delivered', 'Cancelled', 'Rejected'].includes(order.orderStatus) && (
                  <button style={{ background: 'none', border: '1px solid #fecaca', color: 'var(--danger)', padding: '7px 14px', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
                    onClick={() => cancelOrder(order._id)}>
                    ✕ {t('seller_orders.cancel')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerOrders;
