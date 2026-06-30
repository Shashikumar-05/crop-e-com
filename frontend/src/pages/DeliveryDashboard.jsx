import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
function DeliveryDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalDeliveries: 0, completedDeliveries: 0, activeDeliveries: 0, totalEarnings: 0 });
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('present'); // present | completed
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null, method: '', isConfirmed: false, showReceipt: false, timestamp: null, paymentScreenshot: '', isUploadingScreenshot: false });

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.35);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.error('Web Audio API not fully supported or blocked:', err);
    }
  };

  const uploadScreenshotHandler = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPaymentModal(prev => ({ ...prev, isUploadingScreenshot: true }));
    const reader = new FileReader();

    reader.onloadend = () => {
      setPaymentModal(prev => ({ ...prev, paymentScreenshot: reader.result, isUploadingScreenshot: false }));
    };

    reader.onerror = () => {
      console.error('Failed to read file');
      toast.error('Image upload failed');
      setPaymentModal(prev => ({ ...prev, isUploadingScreenshot: false }));
    };

    reader.readAsDataURL(file);
  };

  const completeDelivery = async (orderId, paymentMethod) => {
    try {
      await axios.put(`/api/delivery/${orderId}/update-status`,
        { status: 'Delivered', paymentMethod, paymentScreenshot: paymentModal.paymentScreenshot },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Delivery completed! Paid via ${paymentMethod}`);
      fetchData();
      setPaymentModal({ isOpen: false, order: null, method: '', isConfirmed: false, showReceipt: false, timestamp: null, paymentScreenshot: '', isUploadingScreenshot: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete delivery');
    }
  };

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user || user.role !== 'Delivery') { navigate('/login'); return; }
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/api/delivery/stats', { headers }),
        tab === 'completed'
          ? axios.get('/api/delivery/history', { headers })
          : axios.get('/api/delivery/my-deliveries', { headers })
      ]);
      setStats(statsRes.data);
      setOrders(tab === 'present'
        ? ordersRes.data.filter(o => ['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'].includes(o.orderStatus))
        : ordersRes.data
      );
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/delivery/${orderId}/update-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Order marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      'Assigned to Delivery Partner': { bg: '#dbeafe', text: '#1d4ed8' },
      'Picked Up': { bg: '#e0e7ff', text: '#4338ca' },
      'Out for Delivery': { bg: '#fef3c7', text: '#92400e' },
      'Delivered': { bg: '#dcfce7', text: '#15803d' },
    };
    const c = colors[status] || { bg: '#f3f4f6', text: '#374151' };
    return { backgroundColor: c.bg, color: c.text, padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', display: 'inline-block' };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">🚚 {t('delivery.title')}</h1>
          <p className="text-gray-500 mt-1">{t('delivery.welcome_back')} {user?.name}</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('delivery.assigned'), value: stats.totalDeliveries, icon: '📦', color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: t('delivery.active'), value: stats.activeDeliveries, icon: '🏃', color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: t('delivery.completed'), value: stats.completedDeliveries, icon: '✅', color: 'text-green-600', bg: 'bg-green-100' },
            { label: t('delivery.earnings'), value: `₹${stats.totalEarnings}`, icon: '💰', color: 'text-purple-600', bg: 'bg-purple-100', link: '/earnings' },
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => s.link && navigate(s.link)}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 ${s.link ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl mb-3 ${s.bg}`}>{s.icon}</div>
              <p className={`text-2xl font-bold m-0 ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {[
            { key: 'present', label: `🚀 ${t('delivery.present_orders')}`, count: (stats.availableDeliveries || 0) + (stats.activeDeliveries || 0) },
            { key: 'completed', label: `✅ ${t('delivery.completed_orders')}`, count: stats.completedDeliveries || 0 }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                ${tab === t.key ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${tab === t.key ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">{t('delivery.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <div className="text-5xl mb-4 opacity-50">
              {tab === 'present' ? '📭' : '📦'}
            </div>
            <h3 className="text-lg font-bold text-gray-700 m-0">{t('delivery.all_caught_up')}</h3>
            <p className="text-gray-500 text-sm mt-2">
              {tab === 'present' ? t('delivery.no_active') : t('delivery.no_completed')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('delivery.order_id')}</span>
                    <p className="font-bold text-gray-800 m-0 text-sm">#{order.order_id || order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {order.orderStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏪</span>
                      <h4 className="text-xs font-bold text-gray-500 uppercase m-0">{t('delivery.pickup_from')}</h4>
                    </div>
                    <p className="font-bold text-gray-800 text-sm m-0">{order.items?.[0]?.farmer?.name || 'Farmer'}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.items?.[0]?.farmer?.location || '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 block mt-1 truncate">
                      {order.items?.[0]?.farmer?.location || 'N/A'}
                    </a>
                    {order.items?.[0]?.farmer?.phone && (
                      <div className="flex gap-2 mt-3">
                        <a href={`tel:${order.items[0].farmer.phone}`} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition">
                          📞 {t('delivery.call')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📍</span>
                      <h4 className="text-xs font-bold text-indigo-600 uppercase m-0">{t('delivery.deliver_to')}</h4>
                    </div>
                    <p className="font-bold text-gray-800 text-sm m-0">{order.buyer?.name}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || order.buyer?.location || '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 block mt-1 truncate">
                      {order.deliveryAddress || order.buyer?.location}
                    </a>
                    {order.buyer?.phone && (
                      <div className="flex gap-2 mt-3">
                        <a href={`tel:${order.buyer.phone}`} className="flex-1 bg-white border border-indigo-100 hover:bg-indigo-50 text-indigo-700 py-1.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition">
                          📞 {t('delivery.call')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {order.items?.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                      {item.cropName} <span className="text-gray-400">×</span> {item.quantity}{item.unit}
                    </span>
                  ))}
                  <div className="flex flex-col items-end justify-center ml-auto">
                    <div className="text-xs font-bold text-gray-500 uppercase">{t('delivery.product_value')}</div>
                    <div className="font-black text-lg text-gray-900">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-5 flex justify-between items-center">
                   <div className="text-sm font-bold text-indigo-900">{t('delivery.delivery_charge')}</div>
                   <div className="text-xl font-black text-indigo-700">₹{(order.deliveryTotal || 0).toLocaleString('en-IN')}</div>
                </div>

                {tab !== 'completed' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {order.orderStatus === 'Assigned to Delivery Partner' && (
                      <button className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
                        onClick={() => updateStatus(order._id, 'Picked Up')}>
                        📦 {t('delivery.pick_up_order')}
                      </button>
                    )}
                    {order.orderStatus === 'Picked Up' && (
                      <button className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
                        onClick={() => updateStatus(order._id, 'Out for Delivery')}>
                        🚚 {t('delivery.start_delivery')}
                      </button>
                    )}
                    {order.orderStatus === 'Out for Delivery' && (
                      <button className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm"
                        onClick={() => setPaymentModal({ isOpen: true, order: order, method: '', isConfirmed: false, showReceipt: false, timestamp: null, paymentScreenshot: '', isUploadingScreenshot: false })}>
                        ✅ {t('delivery.collect_payment')}
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.items?.[0]?.farmer?.location || '')}&destination=${encodeURIComponent(order.deliveryAddress || order.buyer?.location || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold py-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1 transition ${!['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'].includes(order.orderStatus) ? 'col-span-2 sm:col-span-4' : 'col-span-2 sm:col-span-2'}`}
                    >
                      🗺️ {t('delivery.google_maps')}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgraded COD + UPI QR Payment Options Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white p-5 text-center relative">
              <h3 className="text-xl font-extrabold tracking-wide m-0">🔒 Secure Payment Collection</h3>
              <p className="text-gray-400 text-xs mt-1 font-semibold">Collect payment to complete delivery</p>
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null, method: '', isConfirmed: false, showReceipt: false, timestamp: null, paymentScreenshot: '', isUploadingScreenshot: false })}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Order Info Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Order Details</span>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">
                    #{paymentModal.order?.order_id || paymentModal.order?._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Customer:</span>
                    <span className="font-bold text-gray-800">{paymentModal.order?.buyer?.name || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Address:</span>
                    <span className="font-bold text-gray-800 text-right truncate max-w-[200px]" title={paymentModal.order?.deliveryAddress}>
                      {paymentModal.order?.deliveryAddress || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/60 mt-1">
                    <span className="text-gray-900 font-extrabold text-sm">Amount To Collect:</span>
                    <span className="text-2xl font-black text-indigo-700">
                      ₹{(paymentModal.order?.grandTotal || paymentModal.order?.totalAmount || 0)?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Payment Method</label>
                <div className="relative">
                  <select 
                    value={paymentModal.method}
                    onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value, isConfirmed: false, showReceipt: false })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none shadow-sm"
                  >
                    <option value="" disabled>-- Select Payment Mode --</option>
                    <option value="Cash">💵 Cash on Delivery (COD)</option>
                    <option value="UPI">📱 Scan PhonePe UPI QR</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold text-sm">▼</div>
                </div>
              </div>

              {/* Dynamic Interactive Payment Sections */}
              {paymentModal.method === 'Cash' && (
                <div className="animate-fade-in space-y-4">
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 text-center">
                    <span className="text-5xl block animate-bounce mb-3">💵</span>
                    <h4 className="font-black text-emerald-800 text-lg m-0 mb-1">Cash Collection Mode</h4>
                    <p className="text-sm text-emerald-600 m-0 leading-relaxed">
                      Please collect <strong className="text-emerald-900 font-black">₹{(paymentModal.order?.grandTotal || paymentModal.order?.totalAmount || 0)?.toLocaleString('en-IN')}</strong> in cash from the customer.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      playSuccessSound();
                      completeDelivery(paymentModal.order._id, 'Cash');
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black rounded-2xl transition shadow-lg flex items-center justify-center gap-2 border-0 cursor-pointer text-base"
                  >
                    ✅ Complete Order & Confirm Cash
                  </button>
                </div>
              )}

              {paymentModal.method === 'UPI' && (
                <div className="animate-fade-in flex flex-col items-center">
                  
                  {/* QR Code Only */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <img 
                      src="/custom_qr.png"
                      alt="UPI QR Code" 
                      className="w-[280px] h-[280px] object-cover rounded-2xl shadow-xl"
                    />
                  </div>

                  {/* Complete Delivery Action */}
                  <button 
                    onClick={() => {
                      playSuccessSound();
                      completeDelivery(paymentModal.order._id, 'UPI');
                    }}
                    className="w-full py-4 bg-[#4e3cc9] hover:bg-[#4030a8] active:scale-[0.98] text-white font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2 border-0 cursor-pointer text-base"
                  >
                    🔔 Confirm Payment Received
                  </button>
                </div>
              )}

              {/* Default View - Please select method */}
              {!paymentModal.method && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center text-amber-700">
                  <span className="text-3xl block animate-pulse mb-2">ℹ️</span>
                  <p className="font-bold m-0 text-sm">Select payment option above to proceed.</p>
                  <p className="text-xs text-amber-600 mt-1 m-0">You must record cash or verify UPI QR payment to complete the order delivery.</p>
                </div>
              )}
            </div>

            {/* Cancel/Go Back */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null, method: '', isConfirmed: false, showReceipt: false, timestamp: null, paymentScreenshot: '', isUploadingScreenshot: false })}
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition shadow-sm border-0 cursor-pointer text-sm"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryDashboard;
