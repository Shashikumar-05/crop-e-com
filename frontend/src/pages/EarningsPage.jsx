import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import WalletPanel from '../components/WalletPanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const EarningsPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [reportType, setReportType] = useState('Monthly Report');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role === 'Farmer' ? 'seller' : 'delivery';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchHistory();
    setDefaultDates('Monthly Report');
  }, []);

  const fetchHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const endpoint = role === 'seller' ? '/api/orders/seller' : '/api/delivery/history';
      const { data } = await axios.get(endpoint, { headers });

      const completed = data.filter(o => o.orderStatus === 'Delivered');

      const formattedHistory = completed.map(order => {
        const pickupPlace = order.items?.[0]?.farmer?.location || 'Unknown location';
        const deliveryPlace = order.deliveryAddress || order.buyer?.location || 'Unknown location';

        let amount = 0;
        if (role === 'seller') {
          const farmerItems = order.items?.filter(item => item.farmer === user._id || item.farmer?._id === user._id) || [];
          amount = farmerItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
        } else {
          amount = order.deliveryTotal || 40;
        }

        const dateObj = new Date(order.deliveredAt || order.updatedAt || order.createdAt);

        return {
          id: order._id,
          displayId: order.order_id || order._id.slice(-8).toUpperCase(),
          rawDate: dateObj,
          date: dateObj.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          amount: amount,
          status: 'Completed',
          pickup: pickupPlace,
          delivery: deliveryPlace
        };
      });

      formattedHistory.sort((a, b) => b.rawDate - a.rawDate);
      setHistory(formattedHistory);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultDates = (type) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'Daily Report') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'Weekly Report') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'Monthly Report') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'Yearly Report') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
    }

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    if (type !== 'Custom') {
      setDefaultDates(type);
    }
  };

  const applyFilters = () => {
    if (reportType === 'All Orders') {
      setFilteredHistory(history);
      return;
    }

    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const filtered = history.filter(item => {
      const itemDate = new Date(item.rawDate);
      return itemDate >= start && itemDate <= end;
    });
    setFilteredHistory(filtered);
  };

  useEffect(() => {
    if (history.length > 0) {
      applyFilters();
    }
  }, [history]);

  const handleShow = () => {
    applyFilters();
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Amount (₹)', 'Pickup Place', 'Delivered Place', 'Status'];
    const rows = filteredHistory.map(item => [
      item.displayId,
      item.date,
      item.amount,
      `"${item.pickup}"`,
      `"${item.delivery}"`,
      item.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `earnings_history_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summaries
  const totalOrders = filteredHistory.length;
  const totalRevenue = filteredHistory.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)', border: '1px solid var(--neutral-200)', borderRadius: '8px' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--neutral-900)', margin: '0 0 4px' }}>Earnings History</h1>
          <p style={{ color: 'var(--neutral-500)', margin: 0, fontSize: '0.95rem' }}>
            {role === 'seller' ? 'View and track all your completed product sales.' : 'View and track all your completed delivery payouts.'}
          </p>
        </div>
      </div>

      {/* WALLET INTEGRATION */}
      <WalletPanel userRole={role === 'seller' ? 'Farmer' : 'Delivery'} />

      {/* FILTER SECTION */}
      <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '16px', border: '1px solid var(--neutral-200)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ flex: '1 1 auto', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '6px' }}>Report Type</label>
            <select
              value={reportType}
              onChange={handleReportTypeChange}
              style={{ border: '1px solid var(--neutral-300)', borderRadius: '8px', padding: '10px 16px', backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-700)', minWidth: '160px', outline: 'none' }}
            >
              <option value="Daily Report">Daily Report</option>
              <option value="Weekly Report">Weekly Report</option>
              <option value="Monthly Report">Monthly Report</option>
              <option value="Yearly Report">Yearly Report</option>
              <option value="All Orders">All Orders</option>
              <option value="Custom">Custom Date</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '6px' }}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setReportType('Custom'); }}
              style={{ border: '1px solid var(--neutral-300)', borderRadius: '8px', padding: '9px 16px', backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-700)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '6px' }}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setReportType('Custom'); }}
              style={{ border: '1px solid var(--neutral-300)', borderRadius: '8px', padding: '9px 16px', backgroundColor: 'var(--neutral-50)', color: 'var(--neutral-700)', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleShow}
            style={{ backgroundColor: '#4f46e5', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            Show
          </button>
          <button
            onClick={exportToCSV}
            style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: '1px solid #a7f3d0', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-500)', margin: '0 0 8px' }}>Total {role === 'seller' ? 'Orders' : 'Trips'}</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--neutral-900)', margin: '0 0 8px' }}>{totalOrders}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', margin: 0 }}>In selected period</p>
        </div>
        <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)', borderLeft: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-500)', margin: '0 0 8px' }}>Total Earnings</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--neutral-900)', margin: '0 0 8px' }}>₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '500', margin: 0 }}>Completed orders only</p>
        </div>
      </div>

      {/* CHART SECTION */}
      {filteredHistory.length > 0 && (
        <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '16px', border: '1px solid var(--neutral-200)', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: 'var(--neutral-800)' }}>Earnings Overview ({reportType})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(() => {
                  const dataMap = {};
                  if (reportType === 'Yearly Report') {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    months.forEach(m => dataMap[m] = { name: m, earnings: 0 });
                  } else if (reportType === 'Weekly Report') {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    days.forEach(d => dataMap[d] = { name: d, earnings: 0 });
                  }
                  
                  const chronoHistory = [...filteredHistory].sort((a, b) => a.rawDate - b.rawDate);
                  chronoHistory.forEach(item => {
                    const d = new Date(item.rawDate);
                    let key = '';
                    if (reportType === 'Yearly Report') {
                      key = d.toLocaleString('default', { month: 'short' });
                    } else if (reportType === 'Weekly Report') {
                      key = d.toLocaleString('default', { weekday: 'short' });
                    } else {
                      key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    }
                    if (!dataMap[key]) dataMap[key] = { name: key, earnings: 0 };
                    dataMap[key].earnings += item.amount;
                  });
                  return Object.values(dataMap);
                })()}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* HISTORY LIST */}
      <main>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--neutral-400)' }}>
            Loading earnings history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ backgroundColor: 'var(--white)', border: '1px dashed var(--neutral-300)', borderRadius: '16px', padding: '50px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>📉</span>
            <h3 style={{ margin: '0 0 5px', color: 'var(--neutral-700)' }}>No earnings yet</h3>
            <p style={{ margin: 0, color: 'var(--neutral-500)' }}>Completed orders will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--neutral-100)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                      Order #{item.displayId}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '4px' }}>
                      {item.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-700)' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-600)', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1rem' }}>🏪</span> Pickup Place
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--neutral-800)', fontWeight: '500' }}>
                      {item.pickup}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1rem' }}>📍</span> Delivered Place
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--neutral-800)', fontWeight: '500' }}>
                      {item.delivery}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EarningsPage;
