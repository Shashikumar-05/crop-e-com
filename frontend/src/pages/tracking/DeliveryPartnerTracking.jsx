import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MapTracking from '../../components/MapTracking';
import toast from 'react-hot-toast';

function DeliveryPartnerTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [liveLocation, setLiveLocation] = useState({ lat: 12.9716, lng: 77.5946 });

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get('/api/delivery/my-deliveries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundOrder = res.data.find(o => o._id === id);
      setOrder(foundOrder);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tracking data');
    }
  };

  const updateLiveLocationBackend = async () => {
    try {
      // Simulate slight movement
      const newLat = liveLocation.lat + (Math.random() - 0.5) * 0.001;
      const newLng = liveLocation.lng + (Math.random() - 0.5) * 0.001;
      setLiveLocation({ lat: newLat, lng: newLng });

      await axios.post('/api/delivery/update-location', 
        { lat: newLat, lng: newLng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update live location", err);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    // Simulate live movement or updating system location
    const int = setInterval(updateLiveLocationBackend, 15000); // 15 seconds
    return () => clearInterval(int);
  }, []);

  if (!order) return <div>Loading...</div>;

  const markers = [];
  
  if (order.pickupLocation) {
    markers.push({ id: 'pickup', lat: order.pickupLocation.lat, lng: order.pickupLocation.lng, type: 'pickup', title: 'Farm Pickup', desc: 'Where to collect' });
  }
  
  if (order.dropoffLocation) {
    markers.push({ id: 'drop', lat: order.dropoffLocation.lat, lng: order.dropoffLocation.lng, type: 'customer', title: 'Customer Dest', desc: order.deliveryAddress });
  }

  // Delivery Partner live marker
  markers.push({
    id: 'delivery', lat: liveLocation.lat, lng: liveLocation.lng, type: 'delivery', title: 'You', desc: 'Your current location'
  });

  return (
    <div>
      <h2>Route Tracking (Order #{id.slice(-6)})</h2>
      {order.vehicle && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 text-blue-800 text-sm inline-block">
          <strong>🚚 Assigned Vehicle:</strong> {order.vehicle.vehicle_type} ({order.vehicle.vehicle_number})
        </div>
      )}
      <p style={{marginBottom: '20px', marginTop: '10px'}}>Keep this page open to share your live location.</p>
      
      <MapTracking markers={markers} />
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
        <Link to="/delivery" className="btn btn-secondary">Back to Dashboard</Link>
        <a 
          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.items?.[0]?.farmer?.location || '')}&destination=${encodeURIComponent(order.deliveryAddress || order.buyer?.location || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          🗺️ Open Route in Google Maps
        </a>
      </div>
    </div>
  );
}

export default DeliveryPartnerTracking;
