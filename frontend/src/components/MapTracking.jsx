import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing correctly in React
delete L.Icon.Default.prototype._getIconUrl;

// Custom icons
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  blue: createIcon('blue'), // Customer
  green: createIcon('green'), // Pickup / Seller
  red: createIcon('red'), // Delivery Partner
};

// Component to recenter map when positions change
function MapUpdater({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, map]);
  return null;
}

export default function MapTracking({ markers = [], routeLocations = [] }) {
  // markers expected: { id, lat, lng, type (customer|pickup|delivery), title, desc }
  
  if (!markers || markers.length === 0) {
    return <div style={{height: '400px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'}}>Loading Map...</div>;
  }

  // fallback center
  const center = [markers[0].lat, markers[0].lng];

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routeLocations && routeLocations.length === 2 && (
          <Polyline positions={routeLocations} color="#3b82f6" weight={3} dashArray="5, 10" />
        )}

        {markers.map((marker) => {
          let icon;
          if (marker.type === 'customer') icon = icons.blue;
          else if (marker.type === 'pickup') icon = icons.green;
          else icon = icons.red; // default to delivery

          return (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
              <Popup>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{marker.title}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{marker.desc}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater markers={markers} />
      </MapContainer>
    </div>
  );
}
