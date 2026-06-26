import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MapTracking from '../../components/MapTracking';
import toast from 'react-hot-toast';

function CustomerOrderTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOrderDetails = async () => {
    try {
      // In a real app we'd fetch this specific order, reusing the standard get order API
      // Since there's no single GET /api/orders/:id, we fetch all and filter
      const res = await axios.get('/api/payment/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundOrder = res.data.find(o => o._id === id);
      setOrder(foundOrder);
      
      if (foundOrder && foundOrder.deliveryPartner) {
        // Mocking user profile fetch for delivery partner live location
        // Actually, since we populate from 'get my orders' it only populates items.farmer
        // BUT wait, let's just make the backend endpoint that fetches 1 order
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found.</div>;

  // Generate markers based on order data
  const markers = [];
  
  if (order.pickupLocation) {
    markers.push({
      id: 'pickup', lat: order.pickupLocation.lat, lng: order.pickupLocation.lng,
      type: 'pickup', title: 'Farm Pickup', desc: 'Where crops are collected'
    });
  }
  
  if (order.dropoffLocation) {
    markers.push({
      id: 'drop', lat: order.dropoffLocation.lat, lng: order.dropoffLocation.lng,
      type: 'customer', title: 'Your Location', desc: 'Delivery Destination'
    });
  }

  // Delivery Partner live marker
  if (order.deliveryPartner && order.deliveryPartner.liveLocation?.lat) {
    markers.push({
      id: 'delivery', 
      lat: order.deliveryPartner.liveLocation.lat, 
      lng: order.deliveryPartner.liveLocation.lng, 
      type: 'delivery', 
      title: order.deliveryPartner.name, 
      desc: 'Delivery Partner (Live)'
    });
  }

  // Fallback map coords roughly near Bangalore if none
  if (markers.length === 0) {
    markers.push({ id: 'drop', lat: 12.9716, lng: 77.5946, type: 'customer', title: 'Dest', desc: 'Dest' });
  }

  return (
    <div>
      <h2>Order Delivery Tracking</h2>
      <p className="mb-2"><strong>Status:</strong> {order.orderStatus}</p>
      {order.vehicle && (
        <p className="mb-4 text-sm bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 inline-block">
          🚚 Your order is being delivered by a <strong>{order.vehicle.vehicle_type}</strong>
        </p>
      )}
      <div style={{ marginTop: '10px' }}>
        <MapTracking markers={markers} />
      </div>
      <Link to="/my-orders" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to Orders</Link>
    </div>
  );
}

export default CustomerOrderTracking;
