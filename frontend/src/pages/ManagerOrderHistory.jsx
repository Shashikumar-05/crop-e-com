import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function ManagerOrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user || user.role !== 'Manager') {
      navigate('/');
      return;
    }
    fetchOrderHistory(user.token);
  }, [navigate]);

  const fetchOrderHistory = async (token) => {
    try {
      const { data } = await axios.get('/api/manager/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort orders by newest first
      const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchString = searchTerm.toLowerCase();
    const orderIdStr = (order.order_id || order._id).toLowerCase();
    const productName = order.items?.[0]?.cropName?.toLowerCase() || '';
    const buyerName = order.buyer?.name?.toLowerCase() || '';
    
    return orderIdStr.includes(searchString) || 
           productName.includes(searchString) || 
           buyerName.includes(searchString);
  });

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-500 font-semibold text-lg">Loading Order History...</div>;

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 font-sans text-gray-800 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            📜 Order History
          </h1>
          <p className="text-gray-500 mt-1">View the complete history of all orders</p>
        </div>
        <div className="w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search by Order ID, Product, or Buyer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Product Details</th>
                <th className="px-6 py-4 font-bold text-right">Product Price</th>
                <th className="px-6 py-4 font-bold text-right">Delivery Charges</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const productAmt = order.productTotal || (order.totalAmount - (order.deliveryTotal || 0) - (order.platformFee || 0));
                  const deliveryChg = order.deliveryTotal || 0;
                  const grandTotal = order.grandTotal || order.totalAmount || 0;
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN');
                  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{dateStr}</div>
                        <div className="text-xs text-gray-500">{timeStr}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        #{order.order_id || order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="mb-1 last:mb-0 flex items-center gap-2">
                            <span className="font-bold text-gray-800">{item.cropName}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-right font-medium">₹{productAmt.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-700 text-right font-medium">₹{deliveryChg.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 
                            order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                            ['Pending', 'Waiting for Manager Review'].includes(order.orderStatus) ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-blue-100 text-blue-700'}`}
                        >
                          {order.orderStatus}
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
    </div>
  );
}

export default ManagerOrderHistory;
