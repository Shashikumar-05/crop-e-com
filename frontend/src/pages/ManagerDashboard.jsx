import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import VehicleCategoryCard from '../components/VehicleCategoryCard';
import VehicleList from '../components/VehicleList';
import GenerateBillModal from '../components/GenerateBillModal';

function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs for layout
  const [orderTab, setOrderTab] = useState('All');
  const [partnerTab, setPartnerTab] = useState('Available');

  // Selections
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [activeView, setActiveView] = useState('orders');
  const [historyModalOrder, setHistoryModalOrder] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'Manager') {
      navigate('/');
      return;
    }
    setUser(parsedUser);
    fetchData(parsedUser.token);
  }, [navigate]);

  const fetchData = async (token) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [ordersRes, partnersRes, vehiclesRes] = await Promise.all([
        axios.get('/api/manager/orders', config),
        axios.get('/api/manager/delivery-partners', config),
        axios.get('/api/manager/vehicles', config)
      ]);
      setOrders(ordersRes.data);
      setPartners(partnersRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedPartnerId || !selectedVehicleId) return;
    setIsAssigning(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/manager/assign-order/${selectedOrderId}`, { deliveryPartnerId: selectedPartnerId, vehicleId: selectedVehicleId }, config);
      toast.success('Order successfully assigned to delivery partner & vehicle!');
      setSelectedOrderId(null);
      setSelectedPartnerId(null);
      setSelectedVehicleId(null);
      await fetchData(user.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign order');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleApproveCancellation = async (orderId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/manager/approve-cancellation/${orderId}`, { status }, config);
      toast.success(`Cancellation ${status} successfully`);
      fetchData(user.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process cancellation');
    }
  };

  const handleManagerCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/manager/manager-cancel/${orderToCancel}`, { reason: cancelReason }, config);
      toast.success('Order cancelled successfully');
      setIsCancelModalOpen(false);
      setCancelReason('');
      setOrderToCancel(null);
      fetchData(user.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Derived logic for partner status based on orders they are handling
  const getPartnerStatus = (partnerId) => {
    const partnerOrders = orders.filter(o => o.deliveryPartner?._id === partnerId);

    const assignedOrder = partnerOrders.find(o => ['Assigned to Delivery Partner'].includes(o.orderStatus));
    const onTripOrder = partnerOrders.find(o => ['Picked Up', 'Out for Delivery'].includes(o.orderStatus));
    // Since we don't have a strict 'Returning' state in backend, we simplify it matching standard flows

    if (onTripOrder) return 'On Trip';
    if (assignedOrder) return 'Assigned';

    const partner = partners.find(p => p._id === partnerId);
    if (partner?.availability_status === false) return 'Offline';
    return 'Available';
  };

  // Filter orders based on Tabs
  const unassignedStatuses = ['Accepted', 'Pending', 'Waiting for Manager Review', 'Bill Confirmed'];
  const ongoingStatuses = ['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'];

  const filteredOrders = orders.filter(o => {
    if (orderTab === 'All') return o.orderStatus !== 'Inquiry';
    if (orderTab === 'Enquiries') return o.orderStatus === 'Inquiry';
    if (orderTab === 'Unassigned') return unassignedStatuses.includes(o.orderStatus);
    if (orderTab === 'Ongoing') return ongoingStatuses.includes(o.orderStatus);
    if (orderTab === 'Completed') return o.orderStatus === 'Delivered';
    if (orderTab === 'Cancellations') return o.orderStatus === 'Cancellation Pending' || o.orderStatus === 'Cancelled';
    return true;
  });

  // Filter partners based on Tabs
  const filteredPartners = partners.filter(p => {
    const status = getPartnerStatus(p._id);
    if (partnerTab === 'Available') return status === 'Available';
    if (partnerTab === 'Assigned') return status === 'Assigned';
    if (partnerTab === 'On Trip') return status === 'On Trip';
    if (partnerTab === 'Returning') return status === 'Returning'; // Mocked tab for future expansion
    return true;
  });

  // Compute order counts dynamically for tab counters
  const orderCounts = {
    All: orders.filter(o => o.orderStatus !== 'Inquiry').length,
    Enquiries: orders.filter(o => o.orderStatus === 'Inquiry').length,
    Unassigned: orders.filter(o => unassignedStatuses.includes(o.orderStatus)).length,
    Ongoing: orders.filter(o => ongoingStatuses.includes(o.orderStatus)).length,
    Completed: orders.filter(o => o.orderStatus === 'Delivered').length,
    Cancellations: orders.filter(o => ['Cancelled', 'Cancellation Pending'].includes(o.orderStatus)).length,
  };

  // Smart matching: finding if the partner is in the same area as the currently selected order
  const selectedOrderObj = orders.find(o => o._id === selectedOrderId);
  const orderAreaString = selectedOrderObj
    ? (selectedOrderObj.deliveryAddress + ' ' + (selectedOrderObj.items?.[0]?.farmer?.area || '')).toLowerCase()
    : '';
  const orderTotalQty = selectedOrderObj?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Manager Control Desk...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8 font-sans pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0 leading-tight">Control Desk Dashboard</h1>
          <p className="text-gray-500 text-sm m-0 mt-1">Smart split-screen layout for rapid delivery assignments</p>
        </div>
        <Link to="/manager/tracking" className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition shadow-sm border border-blue-100 flex items-center gap-2">
          <span>🗺️</span> Monitor Live Fleet
        </Link>
      </div>



      {/* MAIN CONTENT AREA WITH SIDEBAR */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full">
        {/* ICON SIDEBAR */}
        <div className="w-full md:w-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex md:flex-col items-center justify-around md:justify-start py-3 md:py-6 gap-2 md:gap-6 h-auto md:h-[75vh] flex-shrink-0">
          <button
            onClick={() => setActiveView('orders')}
            title="Orders Queue"
            className={`text-2xl p-3 rounded-xl transition relative ${activeView === 'orders' ? 'bg-indigo-100 shadow-inner' : 'hover:bg-gray-50'}`}
          >
            📦
            {orderCounts.Unassigned > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          <button
            onClick={() => setActiveView('vehicles')}
            title="Vehicle Categories"
            className={`text-2xl p-3 rounded-xl transition ${activeView === 'vehicles' ? 'bg-indigo-100 shadow-inner' : 'hover:bg-gray-50'}`}
          >
            🚛
          </button>
          <button
            onClick={() => setActiveView('fleet')}
            title="Delivery Fleet"
            className={`text-2xl p-3 rounded-xl transition ${activeView === 'fleet' ? 'bg-indigo-100 shadow-inner' : 'hover:bg-gray-50'}`}
          >
            🏃
          </button>
          <button
            onClick={() => setActiveView('contacts')}
            title="Recent Contacts"
            className={`text-2xl p-3 rounded-xl transition relative ${activeView === 'contacts' ? 'bg-indigo-100 shadow-inner' : 'hover:bg-gray-50'}`}
          >
            👥
          </button>
        </div>

        {/* FULL SCREEN DYNAMIC CONTENT */}
        <div className="flex-1 min-w-0">

          {/* ================= VIEW: ORDERS ================= */}
          {activeView === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[75vh]">
              {/* Panel Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
                  📦 Orders Queue
                  {orderCounts.Unassigned > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{orderCounts.Unassigned} unassigned</span>}
                </h2>
              </div>

              {/* Tabs */}
              <div className="px-5 pt-4 border-b border-gray-100 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {['All', 'Enquiries', 'Unassigned', 'Ongoing', 'Completed', 'Cancellations'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setOrderTab(tab); setSelectedOrderId(null); setSelectedVehicleId(null); setSelectedVehicleCategory(null); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2
                      ${orderTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {tab}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${orderTab === tab ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                      {orderCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                {filteredOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                    <span className="text-4xl mb-3">📭</span>
                    <p>No orders found in {orderTab} queue</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b font-semibold">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Order Info</th>
                          <th className="px-4 py-3 whitespace-nowrap">Product Details</th>
                          <th className="px-4 py-3 whitespace-nowrap">Pickup (Farmer)</th>
                          <th className="px-4 py-3 whitespace-nowrap">Delivery (Buyer)</th>
                          <th className="px-4 py-3 whitespace-nowrap">Rider</th>
                          <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => {
                          const isSelected = selectedOrderId === order._id;

                          let badgeClass = 'bg-gray-100 text-gray-600';
                          if (['Pending', 'Waiting for Manager Review'].includes(order.orderStatus)) badgeClass = 'bg-yellow-100 text-yellow-700';
                          else if (['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'].includes(order.orderStatus)) badgeClass = 'bg-blue-500 text-white shadow-md';
                          else if (order.orderStatus === 'Delivered') badgeClass = 'bg-green-100 text-green-700';
                          else if (order.orderStatus === 'Cancelled') badgeClass = 'bg-red-100 text-red-700';

                          return (
                            <tr
                              key={order._id}
                              onClick={() => {
                                setSelectedOrderId(order._id);
                                setSelectedVehicleId(null);
                                setSelectedVehicleCategory(null);
                              }}
                              className={`border-b hover:bg-gray-50 transition cursor-pointer ${isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="font-semibold text-gray-800 text-xs">
                                  #{order.order_id || order._id.slice(-6).toUpperCase()}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </td>

                              <td className="px-4 py-4 min-w-[120px]">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="mb-1 last:mb-0">
                                    <div className="text-xs font-bold text-indigo-700">{item.cropName}</div>
                                    <div className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                      {item.quantity} {item.unit}
                                    </div>
                                  </div>
                                ))}
                              </td>

                              <td className="px-4 py-4 min-w-[150px]">
                                <div className="text-xs font-bold text-gray-800">{order.items?.[0]?.farmer?.name || 'Unknown'}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[150px]" title={order.items?.[0]?.farmer?.location}>
                                  📍 {order.items?.[0]?.farmer?.location || 'N/A'}
                                </div>
                              </td>

                              <td className="px-4 py-4 min-w-[150px]">
                                <div className="text-xs font-bold text-gray-800">{order.buyer?.name || 'Guest'}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[150px]" title={order.deliveryAddress || order.buyer?.location}>
                                  📍 {order.deliveryAddress || order.buyer?.location || 'N/A'}
                                </div>
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap">
                                {order.deliveryPartner ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                      {order.deliveryPartner.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-800 text-[10px]">{order.deliveryPartner.name}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <span className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                                  {order.orderStatus}
                                </span>
                                {order.orderStatus === 'Cancellation Pending' && order.cancellationDetails?.reason && (
                                  <div className="text-[9px] text-red-500 italic mt-1 max-w-[150px] mx-auto leading-tight">
                                    "{order.cancellationDetails.reason}"
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <div className="flex gap-2 justify-center items-center">
                                  {order.buyer?.phone && (
                                    <>
                                      <a
                                        href={`tel:${order.buyer.phone}`}
                                        onClick={e => e.stopPropagation()}
                                        className="px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded shadow transition flex items-center justify-center"
                                        title="Call Customer"
                                      >
                                        📞
                                      </a>
                                      <a
                                        href={`https://wa.me/${String(order.buyer.phone).replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded shadow transition flex items-center justify-center"
                                        title="WhatsApp Customer"
                                      >
                                        💬
                                      </a>
                                    </>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setHistoryModalOrder(order); }}
                                    className="text-gray-500 hover:text-gray-800 ml-1 text-lg font-bold px-2 py-0.5 rounded hover:bg-gray-100 transition"
                                    title="View Order Details & Actions"
                                  >
                                    ⋮
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW: VEHICLES ================= */}
          {activeView === 'vehicles' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[75vh]">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 m-0">
                  🚛 {selectedVehicleCategory ? 'Select Vehicle' : 'Vehicle Categories'}
                  {orderTotalQty > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2">Load: {orderTotalQty} kg</span>}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                {selectedVehicleCategory ? (
                  <VehicleList
                    vehicles={vehicles.filter(v => v.vehicle_type === selectedVehicleCategory)}
                    selectedVehicleId={selectedVehicleId}
                    onSelectVehicle={(id) => {
                      if (!selectedOrderId) {
                        toast.error('Please select an order first to assign a vehicle');
                        return;
                      }
                      setSelectedVehicleId(id);
                      const selectedVehicle = vehicles.find(v => v._id === id);
                      if (selectedVehicle && selectedVehicle.assigned_driver) {
                        const driverId = typeof selectedVehicle.assigned_driver === 'object' ? selectedVehicle.assigned_driver._id : selectedVehicle.assigned_driver;
                        setSelectedPartnerId(driverId);
                      }
                    }}
                    onBack={() => { setSelectedVehicleCategory(null); setSelectedVehicleId(null); }}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b font-semibold">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Category</th>
                          <th className="px-4 py-3 whitespace-nowrap text-center">Capacity</th>
                          <th className="px-4 py-3 text-center whitespace-nowrap">Available</th>
                          <th className="px-4 py-3 text-center">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...new Set(vehicles.map(v => v.vehicle_type))].map(type => {
                          const categoryVehicles = vehicles.filter(v => v.vehicle_type === type);
                          const capacity = categoryVehicles[0]?.capacity_kg || 0;
                          const availableCount = categoryVehicles.filter(v => v.status === 'available').length;
                          const isRecommended = selectedOrderId && capacity >= orderTotalQty && capacity < orderTotalQty + 1000;

                          return (
                            <tr
                              key={type}
                              onClick={() => availableCount > 0 ? setSelectedVehicleCategory(type) : toast.error('No available vehicles in this category')}
                              className={`border-b hover:bg-gray-50 transition ${availableCount > 0 ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                            >
                              <td className="px-4 py-4 font-semibold text-gray-800 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">🚛</span>
                                  {type}
                                  {isRecommended && <span className="ml-2 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase font-bold">Recommended</span>}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center font-medium">
                                {capacity} kg
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${availableCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {availableCount} Available
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">View ➔</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW: PARTNERS ================= */}
          {activeView === 'fleet' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[75vh]">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
                  🏃 Delivery Fleet
                </h2>
              </div>

              <div className="px-5 pt-4 border-b border-gray-100 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {['Available', 'Assigned', 'On Trip'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setPartnerTab(tab); setSelectedPartnerId(null); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition
                      ${partnerTab === tab ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                {filteredPartners.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                    <p className="text-lg">No partners in '{partnerTab}' queue</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b font-semibold">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Partner</th>
                          <th className="px-4 py-3 whitespace-nowrap">Contact</th>
                          <th className="px-4 py-3">Area</th>
                          <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPartners.map(partner => {
                          const status = getPartnerStatus(partner._id);
                          const isSameArea = selectedOrderObj && partner.area && orderAreaString.includes(partner.area.toLowerCase());

                          return (
                            <tr
                              key={partner._id}
                              className="border-b hover:bg-gray-50 transition"
                            >
                              <td className="px-4 py-4 font-semibold text-gray-800 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                                    {partner.name ? partner.name.charAt(0) : 'P'}
                                  </div>
                                  <div>
                                    <div>{partner.name}</div>
                                    {isSameArea && selectedOrderId && status === 'Available' && (
                                      <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">⭐ Match</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-xs">{partner.phone}</div>
                              </td>
                              <td className="px-4 py-4 min-w-[150px]">
                                <div className="text-xs text-gray-700">{partner.area || 'Not Specified'}</div>
                              </td>
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                                     ${status === 'Available' ? 'bg-green-100 text-green-700' :
                                    status === 'Assigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW: CONTACTS ================= */}
          {activeView === 'contacts' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[75vh]">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
                  👥 Recent Customer & Seller Details
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30 space-y-4">
                {orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                    <p className="text-lg">No recent orders found</p>
                  </div>
                ) : (
                  [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => (
                    <div key={order._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                        <span className="font-bold text-gray-700">Order #{order.order_id || order._id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <h4 className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1"><span>📍</span> CUSTOMER (DELIVER TO)</h4>
                          <p className="font-semibold text-gray-800 m-0 text-sm">{order.buyer?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-600 m-0 mt-1">{order.deliveryAddress || order.buyer?.location}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {order.buyer?.phone ? (
                              <>
                                <a href={`tel:${order.buyer.phone}`} className="flex-1 flex items-center justify-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1.5 rounded-lg text-xs font-bold transition">
                                  📞 Call
                                </a>
                                <a href={`https://wa.me/${String(order.buyer.phone).replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 py-1.5 rounded-lg text-xs font-bold transition">
                                  💬 WhatsApp
                                </a>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No phone provided</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <h4 className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1"><span>🏪</span> SELLER (PICKUP FROM)</h4>
                          <p className="font-semibold text-gray-800 m-0 text-sm">{order.items?.[0]?.farmer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-600 m-0 mt-1">{order.items?.[0]?.farmer?.location || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {order.items?.[0]?.farmer?.phone ? (
                              <>
                                <a href={`tel:${order.items[0].farmer.phone}`} className="flex-1 flex items-center justify-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1.5 rounded-lg text-xs font-bold transition">
                                  📞 Call
                                </a>
                                <a href={`https://wa.me/${String(order.items[0].farmer.phone).replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 py-1.5 rounded-lg text-xs font-bold transition">
                                  💬 WhatsApp
                                </a>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No phone provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {isBillModalOpen && (
        <GenerateBillModal
          order={orders.find(o => o._id === selectedOrderId)}
          userToken={user.token}
          onClose={() => setIsBillModalOpen(false)}
          onConfirm={() => {
            setIsBillModalOpen(false);
            fetchData(user.token);
          }}
        />
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-red-50 p-4 border-b border-red-100">
              <h3 className="text-lg font-bold text-red-800 m-0">Cancel Order</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4">Please provide a reason for cancelling this order. This action cannot be undone and will release any assigned vehicle.</p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                rows="4"
                placeholder="E.g., Stock unavailable, User requested, Delivery partner not found..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setIsCancelModalOpen(false); setCancelReason(''); setOrderToCancel(null); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleManagerCancel}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-800 m-0">Order Details & History</h3>
              <button onClick={() => setHistoryModalOrder(null)} className="text-gray-500 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Order ID</span>
                <span className="font-bold text-gray-800">#{historyModalOrder.order_id || historyModalOrder._id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Date & Time</span>
                <span className="font-semibold text-gray-800">{new Date(historyModalOrder.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status</span>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">{historyModalOrder.orderStatus}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Product Information</h4>
                {historyModalOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-1 last:mb-0">
                    <span className="font-semibold text-gray-800 text-sm">{item.cropName} ({item.quantity} {item.unit})</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{item.pricePerUnit}/{item.unit}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pricing Breakdown</h4>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-gray-600">Product Total</span>
                  <span className="font-semibold text-gray-800">₹{historyModalOrder.productTotal || historyModalOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-semibold text-gray-800">₹{historyModalOrder.platformFee || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span className="font-semibold text-gray-800">₹{historyModalOrder.deliveryTotal || historyModalOrder.deliveryCharge || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="font-bold text-indigo-700 text-lg">₹{historyModalOrder.grandTotal || historyModalOrder.totalAmount || 0}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              {historyModalOrder.orderStatus === 'Cancellation Pending' ? (
                <>
                  <button
                    onClick={() => { setHistoryModalOrder(null); handleApproveCancellation(historyModalOrder._id, 'approved'); }}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
                  >
                    APPROVE CANCEL
                  </button>
                  <button
                    onClick={() => { setHistoryModalOrder(null); handleApproveCancellation(historyModalOrder._id, 'rejected'); }}
                    className="px-4 py-2 text-sm font-bold text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition shadow-sm"
                  >
                    REJECT
                  </button>
                </>
              ) : !['Delivered', 'Cancelled'].includes(historyModalOrder.orderStatus) && (
                <>
                  {!['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'].includes(historyModalOrder.orderStatus) && (
                    <button
                      onClick={() => {
                        setHistoryModalOrder(null);
                        setSelectedOrderId(historyModalOrder._id);
                        setIsBillModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                    >
                      ASSIGN
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setHistoryModalOrder(null);
                      setOrderToCancel(historyModalOrder._id);
                      setIsCancelModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
                  >
                    CANCEL
                  </button>
                </>
              )}
              <button
                onClick={() => setHistoryModalOrder(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
