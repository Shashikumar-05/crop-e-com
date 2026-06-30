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

  // UI state
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'revenue', 'farmers', 'delivery', 'platform'
  const [searchQuery, setSearchQuery] = useState('');

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

    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setFromDate(formatDate(start));
    setToDate(formatDate(end));
  };

  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    if (type === 'All Orders') {
      setFromDate('');
      setToDate('');
    } else if (type !== 'Custom') {
      setDefaultDates(type);
    }
  };

  const applyFilters = () => {
    if (!fromDate || !toDate) {
      setFilteredOrders(orders);
      return;
    }
    
    const [startYear, startMonth, startDay] = fromDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    
    const [endYear, endMonth, endDay] = toDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

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

  const handleShow = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get('/api/manager/orders', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(data);
      
      // Apply filters on the newly fetched data
      if (!fromDate || !toDate) {
        setFilteredOrders(data);
        return;
      }
      const [startYear, startMonth, startDay] = fromDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const [endYear, endMonth, endDay] = toDate.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
  
      const filtered = data.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
      setFilteredOrders(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handlePayFarmer = async (farmerId) => {
    if (!window.confirm('Mark all pending completed orders for this farmer as paid?')) return;
    try {
      await axios.put(`/api/manager/pay-farmer/${farmerId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchSales(); // Refresh
    } catch (err) {
      console.error(err);
      alert('Error marking as paid');
    }
  };

  const handlePayDeliveryPartner = async (partnerId) => {
    if (!window.confirm('Mark all pending completed orders for this delivery partner as paid?')) return;
    try {
      await axios.put(`/api/manager/pay-delivery/${partnerId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchSales(); // Refresh
    } catch (err) {
      console.error(err);
      alert('Error marking as paid');
    }
  };

  // Summaries
  // We calculate summaries based on completed orders in the filtered list
  const completedOrders = filteredOrders.filter(o => o.orderStatus === 'Delivered');
  const totalOrders = filteredOrders.length;
  const totalDeliveryCharges = completedOrders.reduce((sum, o) => sum + (o.deliveryTotal || o.deliveryCharge || 0), 0);
  const totalPlatformFees = completedOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
  const totalFarmerAmount = completedOrders.reduce((sum, o) => sum + (o.productTotal || o.totalAmount || 0), 0);
  const totalRevenue = totalFarmerAmount + totalDeliveryCharges + totalPlatformFees;

  // Group by delivery partner
  const deliveryPartnerStats = completedOrders.reduce((acc, order) => {
    if (order.deliveryPartner) {
      const id = order.deliveryPartner._id;
      if (!acc[id]) {
        acc[id] = {
          id: id,
          name: order.deliveryPartner.name,
          orders: 0,
          deliveryEarnings: 0,
          pendingAmount: 0
        };
      }
      acc[id].orders += 1;
      const amount = (order.deliveryTotal || order.deliveryCharge || 0);
      acc[id].deliveryEarnings += amount;
      if (!order.deliveryPartnerPaid) {
        acc[id].pendingAmount += amount;
      }
    }
    return acc;
  }, {});

  // Group by farmer
  const farmerStats = completedOrders.reduce((acc, order) => {
    if (order.items && order.items.length > 0 && order.items[0].farmer) {
      const farmer = order.items[0].farmer;
      const id = farmer._id;
      if (!acc[id]) {
        acc[id] = {
          id: id,
          name: farmer.name,
          orders: 0,
          productEarnings: 0,
          pendingAmount: 0
        };
      }
      acc[id].orders += 1;
      const amount = (order.productTotal || order.totalAmount || 0);
      acc[id].productEarnings += amount;
      if (!order.farmerPaid) {
        acc[id].pendingAmount += amount;
      }
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
              <option value="All Orders">All Orders</option>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div 
          onClick={() => setActiveTab('orders')}
          className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col justify-center cursor-pointer transition ${activeTab === 'orders' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-2">In selected period</p>
        </div>
        <div 
          onClick={() => setActiveTab('revenue')}
          className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-center cursor-pointer transition ${activeTab === 'revenue' ? 'border-emerald-500 ring-2 ring-emerald-200 border-r border-t border-b' : 'border-gray-200 border-r border-t border-b hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 font-medium mt-2">Completed orders only</p>
        </div>
        <div 
          onClick={() => setActiveTab('farmers')}
          className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-center cursor-pointer transition ${activeTab === 'farmers' ? 'border-amber-500 ring-2 ring-amber-200 border-r border-t border-b' : 'border-gray-200 border-r border-t border-b hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-gray-500 mb-1">Farmer Earnings</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalFarmerAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-600 font-medium mt-2">Product sales</p>
        </div>
        <div 
          onClick={() => setActiveTab('delivery')}
          className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-center cursor-pointer transition ${activeTab === 'delivery' ? 'border-blue-500 ring-2 ring-blue-200 border-r border-t border-b' : 'border-gray-200 border-r border-t border-b hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Delivery Charges</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalDeliveryCharges.toLocaleString('en-IN')}</p>
          <p className="text-xs text-blue-600 font-medium mt-2">Paid to riders</p>
        </div>
        <div 
          onClick={() => setActiveTab('platform')}
          className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-purple-500 flex flex-col justify-center cursor-pointer transition ${activeTab === 'platform' ? 'border-purple-500 ring-2 ring-purple-200 border-r border-t border-b' : 'border-gray-200 border-r border-t border-b hover:bg-gray-50'}`}
        >
          <p className="text-sm font-semibold text-gray-500 mb-1">Total Platform Fees</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalPlatformFees.toLocaleString('en-IN')}</p>
          <p className="text-xs text-purple-600 font-medium mt-2">Platform earnings</p>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        
        {/* TOTAL ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 m-0">Detailed Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Order Date</th>
                    <th className="px-6 py-4 font-bold">Order ID</th>
                    <th className="px-6 py-4 font-bold">Customer</th>
                    <th className="px-6 py-4 font-bold">Seller</th>
                    <th className="px-6 py-4 font-bold">Delivery Partner</th>
                    <th className="px-6 py-4 font-bold text-right text-indigo-700 bg-indigo-50/50">Total Amt</th>
                    <th className="px-6 py-4 font-bold text-right">Product Amt</th>
                    <th className="px-6 py-4 font-bold text-right">Delivery Chg</th>
                    <th className="px-6 py-4 font-bold text-right">Platform Fee</th>
                    <th className="px-6 py-4 font-bold text-center">Payment</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-10 text-center text-gray-500">No transactions found for the selected period.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const productAmt = order.productTotal || (order.totalAmount - (order.deliveryTotal || 0) - (order.platformFee || 0));
                      
                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                          <td className="px-6 py-4 font-semibold text-gray-800">{order.order_id || '#' + order._id.slice(-6).toUpperCase()}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{order.buyer?.name || 'Guest'}</td>
                          <td className="px-6 py-4 text-gray-600">{order.items?.[0]?.farmer?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-gray-600">{order.deliveryPartner?.name || '-'}</td>
                          <td className="px-6 py-4 font-bold text-indigo-700 text-right bg-indigo-50/30">₹{(order.grandTotal || order.totalAmount)?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-6 py-4 text-gray-700 text-right">₹{productAmt?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-6 py-4 text-gray-700 text-right">₹{(order.deliveryTotal || order.deliveryCharge)?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-6 py-4 text-gray-700 text-right">₹{order.platformFee?.toLocaleString('en-IN') || 0}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                              {order.paymentMethod || 'COD'}
                            </span>
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
          </>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div className="p-10 text-center">
            <h3 className="text-xl font-bold text-emerald-600 mb-2">Revenue Breakdown</h3>
            <p className="text-gray-500 mb-6">Where our platform generated income in this period</p>
            <div className="flex justify-center gap-8">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl min-w-[200px]">
                <p className="text-sm font-semibold text-emerald-800 mb-2">Platform Fees Collected</p>
                <p className="text-4xl font-bold text-emerald-600">₹{totalPlatformFees.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}

        {/* FARMER EARNINGS TAB */}
        {activeTab === 'farmers' && (
          <>
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 m-0">Farmer Ledgers & Payouts</h2>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">Total Pending Balance:</span>
                  <span className="text-lg font-bold text-red-700">
                    ₹{Object.values(farmerStats).reduce((sum, f) => sum + f.pendingAmount, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search farmers..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Farmer Name</th>
                    <th className="px-6 py-4 font-bold text-center">Completed Orders</th>
                    <th className="px-6 py-4 font-bold text-right text-amber-700 bg-amber-50/50">Total Earnings</th>
                    <th className="px-6 py-4 font-bold text-right text-red-600 bg-red-50/50">Pending Balance</th>
                    <th className="px-6 py-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(farmerStats)
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((stat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{stat.name}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{stat.orders}</td>
                      <td className="px-6 py-4 font-bold text-amber-700 text-right bg-amber-50/30">₹{stat.productEarnings.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-red-600 text-right bg-red-50/30">₹{stat.pendingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handlePayFarmer(stat.id)}
                          disabled={stat.pendingAmount === 0}
                          className={`px-4 py-2 rounded-lg font-bold text-xs transition ${stat.pendingAmount > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          {stat.pendingAmount > 0 ? 'Mark as Paid' : 'Settled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Object.values(farmerStats).length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No farmer data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* DELIVERY TAB */}
        {activeTab === 'delivery' && (
          <>
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 m-0">Delivery Partner Ledgers & Payouts</h2>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">Total Pending Balance:</span>
                  <span className="text-lg font-bold text-red-700">
                    ₹{Object.values(deliveryPartnerStats).reduce((sum, d) => sum + d.pendingAmount, 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search delivery partners..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Partner Name</th>
                    <th className="px-6 py-4 font-bold text-center">Completed Deliveries</th>
                    <th className="px-6 py-4 font-bold text-right text-blue-700 bg-blue-50/50">Total Earnings</th>
                    <th className="px-6 py-4 font-bold text-right text-red-600 bg-red-50/50">Pending Balance</th>
                    <th className="px-6 py-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(deliveryPartnerStats)
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((stat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{stat.name}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{stat.orders}</td>
                      <td className="px-6 py-4 font-bold text-blue-700 text-right bg-blue-50/30">₹{stat.deliveryEarnings.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold text-red-600 text-right bg-red-50/30">₹{stat.pendingAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handlePayDeliveryPartner(stat.id)}
                          disabled={stat.pendingAmount === 0}
                          className={`px-4 py-2 rounded-lg font-bold text-xs transition ${stat.pendingAmount > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          {stat.pendingAmount > 0 ? 'Mark as Paid' : 'Settled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Object.values(deliveryPartnerStats).length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No delivery partner data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PLATFORM TAB */}
        {activeTab === 'platform' && (
          <div className="p-10 text-center">
            <h3 className="text-xl font-bold text-purple-600 mb-2">Platform Fees</h3>
            <p className="text-gray-500 mb-6">Total earnings from platform service fees</p>
            <div className="flex justify-center gap-8">
              <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl min-w-[200px]">
                <p className="text-4xl font-bold text-purple-600">₹{totalPlatformFees.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default ManagerSales;
