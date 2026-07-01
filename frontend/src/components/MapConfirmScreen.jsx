import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// NOTE: Add your API key to your environment variables
// Use environment variable: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const LIBRARIES = ['places'];

export default function MapConfirmScreen({ initialLat, initialLng, onConfirm }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Add API Key here
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: initialLat || 12.9716, lng: initialLng || 77.5946 });
  const [formattedAddress, setFormattedAddress] = useState('Fetching address...');
  const [isDragging, setIsDragging] = useState(false);
  
  const geocoder = useRef(null);

  // Reverse Geocoding: Converts lat/lng into a readable street address
  const fetchAddress = (lat, lng) => {
    if (!geocoder.current) return;
    
    setFormattedAddress('Locating...');
    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setFormattedAddress(results[0].formatted_address);
      } else {
        setFormattedAddress('Could not determine exact address. Please adjust pin.');
      }
    });
  };

  // Initialize geocoder once the Google API is fully loaded
  useEffect(() => {
    if (isLoaded && !geocoder.current && window.google) {
      geocoder.current = new window.google.maps.Geocoder();
      fetchAddress(center.lat, center.lng);
    }
  }, [isLoaded, center.lat, center.lng]);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Map moves, trigger bouncing pin effect
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Map stops moving, snap pin and reverse geocode new center
  const handleDragEnd = () => {
    setIsDragging(false);
    if (map) {
      const newCenter = map.getCenter();
      const lat = newCenter.lat();
      const lng = newCenter.lng();
      setCenter({ lat, lng });
      fetchAddress(lat, lng);
    }
  };

  // Recenter map on user's live GPS location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCenter({ lat, lng });
          map?.panTo({ lat, lng });
          fetchAddress(lat, lng);
        }
      );
    }
  };

  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center font-bold text-gray-500">Loading Map...</div>;

  return (
    <div className="relative w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden bg-gray-100 font-sans shadow-2xl">
      
      {/* Top Bar Overlay Tooltip */}
      <div className="absolute top-0 w-full z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg mx-auto w-max flex items-center gap-3 border border-white/20">
          <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          <span className="text-sm font-bold text-gray-800 m-0">Order will be delivered here</span>
        </div>
      </div>

      {/* Full Map Area */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={17}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          options={{
            disableDefaultUI: true, // Hides default google controls for cleaner UI
            zoomControl: false,
          }}
        />

        {/* FIXED CENTER PIN (Map moves under it) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center">
          <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-1.5 shadow-xl whitespace-nowrap opacity-90">
            Place pin accurately
          </div>
          <MapPin 
            size={46} 
            color="#ef4444" 
            fill="#ef4444" 
            className={`transition-transform duration-300 ease-out ${isDragging ? '-translate-y-6 drop-shadow-2xl scale-110' : 'drop-shadow-xl scale-100'}`} 
          />
          {/* Shadow dot directly under the pin */}
          <div className="w-3 h-1 bg-black/30 rounded-full blur-[2px] mt-1"></div>
        </div>

        {/* GPS Current Location Button */}
        <button 
          onClick={handleCurrentLocation}
          className="absolute bottom-6 right-4 bg-white p-3.5 rounded-full shadow-xl border border-gray-100 text-blue-600 hover:bg-gray-50 transition z-10"
        >
          <Navigation size={22} fill="currentColor" />
        </button>
      </div>

      {/* BOTTOM SHEET UI */}
      <div className="bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.15)] p-6 z-20 relative">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 m-0">Delivery Location</h3>
          <div className="flex items-start gap-4">
            <div className="mt-0.5 text-red-500 bg-red-50 p-2 rounded-full"><MapPin size={22} /></div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg line-clamp-1 m-0">{formattedAddress.split(',')[0]}</h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 m-0 leading-relaxed">{formattedAddress}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onConfirm && onConfirm({ lat: center.lat, lng: center.lng, address: formattedAddress })}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200/50"
        >
          <CheckCircle size={20} />
          Confirm Location
        </button>
      </div>
    </div>
  );
}
