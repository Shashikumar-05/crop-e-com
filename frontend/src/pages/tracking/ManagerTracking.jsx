import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import MapTracking from '../../components/MapTracking';
import { Link } from 'react-router-dom';

function ManagerTracking() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    const int = setInterval(fetchVehicles, 15000); // Poll every 15s
    return () => clearInterval(int);
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/delivery/live-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markers = vehicles.map((v, i) => {
    if (v.liveLocation && v.liveLocation.lat && v.liveLocation.lng) {
      return {
        id: v._id || i,
        lat: v.liveLocation.lat,
        lng: v.liveLocation.lng,
        type: 'delivery',
        title: v.name,
        desc: `Vehicle: ${v.vehicle} | Ph: ${v.phone}`
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div>
      <h2>Manager: Live Fleet Monitoring</h2>
      <p>Tracking {markers.length} active delivery vehicles</p>
      
      <div style={{ marginTop: '20px' }}>
        {loading && markers.length === 0 ? (
          <div>Loading fleet data...</div>
        ) : (
          <MapTracking markers={markers} />
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <Link to="/manager/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default ManagerTracking;
