import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function ManagerSales() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [reportType, setReportType] = useState('Monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/');
      return;
    }
    fetchSales();
    
    // Set default dates based on reportType
    setDefaultDates('Monthly');
  }, []);

  const fetchSales = async () => {
    try {
      const { data } = await axios.get('/api/manager/orders', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // We only care about completed or actual orders
      // Based on prompt: "Data must reflect actual completed orders"
      // But we also show Pending Amount, so we should show all orders but maybe filter by date.
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultDates = (type) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'Daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'Weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start = new Date(today.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'Monthly') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    setDefaultDates(type);
  };

  const applyFilters = () => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    if (orders.length > 0) {
      applyFilters();
    }
  }, [orders]); // Auto apply initially

  const handleShow = () => {
    applyFilters();
  };

  const exportToCSV = () => {
    const headers = [
      'Order Date', 'Order ID', 'Location', 'Customer Name', 'Seller Name', 
      'Delivery Partner Name', 'Vehicle Type', 'Total Amount', 'Product Amount', 
      'Delivery Charges', 'Platform Fee', 'Payment Mode', 'Pending Amount', 'Status'
    ];
    
    const rows = filteredOrders.map(order => {
      const productAmt = order.productTotal || (order.totalAmount - (order.deliveryTotal || 0) - (order.platformFee || 0));
      const pendingAmt = order.paymentMethod === 'COD' && order.orderStatus !== 'Delivered' ? order.totalAmount : 0;
      
      return [
        new Date(order.createdAt).toLocaleDateString(),
        order.order_id || order._id,
        `"${order.deliveryAddress || order.buyer?.location || '-'}"`,
        `"${order.buyer?.name || 'Guest'}"`,
        `"${order.items?.[0]?.farmer?.name || 'Unknown'}"`,
        `"${order.deliveryPartner?.name || '-'}"`,
        `"${order.vehicle?.vehicle_type || '-'}"`,
        order.totalAmount || 0,
        productAmt || 0,
        order.deliveryTotal || 0,
        order.platformFee || 0,
        order.paymentMethod || 'COD',
        pendingAmt,
        order.orderStatus
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${reportType}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summaries
  // We calculate summaries based on completed orders in the filtered list
  const completedOrders = filteredOrders.filter(o => o.orderStatus === 'Delivered');
  const totalOrders = filteredOrders.length;
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalDeliveryCharges = completedOrders.reduce((sum, o) => sum + (o.deliveryTotal || 0), 0);
  const totalPlatformFees = completedOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);

  // Group by delivery partner
  const deliveryPartnerStats = completedOrders.reduce((acc, order) => {
    if (order.deliveryPartner) {
      const id = order.deliveryPartner._id;
      if (!acc[id]) {
        acc[id] = {
          name: order.deliveryPartner.name,
          orders: 0,
          deliveryEarnings: 0
        };
      }
      acc[id].orders += 1;
      acc[id].deliveryEarnings += (order.deliveryTotal || 0);
    }
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center p-20 text-gray-500">Loading Transactions...</div>;

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 font-sans text-gray-800 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales & Transactions</h1>
        <p className="text-gray-500 mt-1">Detailed reporting and revenue distribution</p>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Report Type</label>
            <select 
              value={reportType} 
              onChange={handleReportTypeChange}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Daily">Daily Report</option>
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Custom">Custom Date Range</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => { setFromDate(e.target.value); setReportType('Custom'); }}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => { setToDate(e.target.value); setReportType('Custom'); }}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleShow}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition"
          >
            Show
          </button>
          <button 
            onClick={exportToCSV}
            className="flex-1 md:flex-none bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-6 py-2 rounded-lg font-semibold shadow-sm transition border border-emerald-200"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-2">In selected period</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center border-l-4 border-l-emerald-500">
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 font-medium mt-2">Completed orders only</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center border-l-4 border-l-blue-500">
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Delivery Charges</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalDeliveryCharges.toLocaleString('en-IN')}</p>
          <p className="text-xs text-blue-600 font-medium mt-2">Paid to riders</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center border-l-4 border-l-purple-500">
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Platform Fees</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalPlatformFees.toLocaleString('en-IN')}</p>
          <p className="text-xs text-purple-600 font-medium mt-2">Platform earnings</p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 m-0">Detailed Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold">Order Date</th>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Location / Area</th>
                <th className="px-6 py-4 font-bold">Customer Name</th>
                <th className="px-6 py-4 font-bold">Seller Name</th>
                <th className="px-6 py-4 font-bold">Delivery Partner</th>
                <th className="px-6 py-4 font-bold">Vehicle Type</th>
                <th className="px-6 py-4 font-bold text-right text-indigo-700 bg-indigo-50/50">Total Amt</th>
                <th className="px-6 py-4 font-bold text-right">Product Amt</th>
                <th className="px-6 py-4 font-bold text-right">Delivery Chg</th>
                <th className="px-6 py-4 font-bold text-right">Platform Fee</th>
                <th className="px-6 py-4 font-bold text-center">Payment</th>
                <th className="px-6 py-4 font-bold text-right text-red-600 bg-red-50/50">Pending Amt</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-6 py-10 text-center text-gray-500">No transactions found for the selected period.</td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const productAmt = order.productTotal || (order.totalAmount - (order.deliveryTotal || 0) - (order.platformFee || 0));
                  const pendingAmt = order.paymentMethod === 'COD' && order.orderStatus !== 'Delivered' ? order.totalAmount : 0;
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{order.order_id || '#' + order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]" title={order.deliveryAddress || order.buyer?.location}>
                        {order.deliveryAddress || order.buyer?.location || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{order.buyer?.name || 'Guest'}</td>
                      <td className="px-6 py-4 text-gray-600">{order.items?.[0]?.farmer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">{order.deliveryPartner?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{order.vehicle?.vehicle_type || '-'}</td>
                      <td className="px-6 py-4 font-bold text-indigo-700 text-right bg-indigo-50/30">₹{order.totalAmount?.toLocaleString('en-IN') || 0}</td>
                      <td className="px-6 py-4 text-gray-700 text-right">₹{productAmt?.toLocaleString('en-IN') || 0}</td>
                      <td className="px-6 py-4 text-gray-700 text-right">₹{order.deliveryTotal?.toLocaleString('en-IN') || 0}</td>
                      <td className="px-6 py-4 text-gray-700 text-right">₹{order.platformFee?.toLocaleString('en-IN') || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {order.paymentMethod || 'COD'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-red-600 text-right bg-red-50/30">
                        {pendingAmt > 0 ? `₹${pendingAmt.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 
                            order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                            ['Pending', 'Waiting for Manager Review'].includes(order.orderStatus) ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-blue-100 text-blue-700'}`}
                        >
                          {order.orderStatus === 'Assigned to Delivery Partner' ? 'Assigned' : order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELIVERY PARTNER BASED VIEW */}
      {Object.keys(deliveryPartnerStats).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 m-0">Delivery Partner Earnings (Completed)</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(deliveryPartnerStats).map((stat, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {stat.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{stat.name}</h3>
                    <p className="text-xs text-gray-500">{stat.orders} orders handled</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Earnings</p>
                  <p className="font-bold text-lg text-emerald-600">₹{stat.deliveryEarnings.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default ManagerSales;
