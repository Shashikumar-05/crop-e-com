import React, { useState, useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Search, Navigation, Clock } from 'lucide-react';

// NOTE: Add your API key to your environment variables
// Use environment variable: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const LIBRARIES = ['places'];

export default function LocationPicker({ onLocationSelect }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Add API Key here
    libraries: LIBRARIES
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const searchRef = useRef(null);

  // Mock saved addresses
  const savedAddresses = [
    { id: 1, type: 'Home', address: '123 Farm Road, Green Valley, Bengaluru', distance: '2.5 km', icon: '🏠' },
    { id: 2, type: 'Work', address: 'AgriTech Hub, Sector 4, Bengaluru', distance: '5.1 km', icon: '🏢' },
    { id: 3, type: 'Farm', address: 'Plot 42, Organic Fields, Ramanagara', distance: '12.4 km', icon: '🌾' },
  ];

  // Triggered when user selects an address from the autocomplete dropdown
  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        onLocationSelect({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        });
      }
    }
  };

  // Uses browser geolocation to get exact current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location"
          });
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Please enable location permissions in your browser.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  if (!isLoaded) return <div className="p-10 text-center font-bold text-gray-500">Loading Google Maps...</div>;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col font-sans">
      {/* Header & Search */}
      <div className="p-4 shadow-sm z-10 bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Select Delivery Location</h2>
        
        <Autocomplete
          onLoad={(autoC) => setAutocomplete(autoC)}
          onPlaceChanged={handlePlaceChanged}
        >
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for area, street name..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition text-gray-800"
              ref={searchRef}
            />
          </div>
        </Autocomplete>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Use Current Location Button */}
        <button 
          onClick={handleCurrentLocation}
          className="w-full bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4 hover:bg-green-50 transition border border-green-100"
        >
          <div className="bg-green-100 p-2 rounded-full text-green-600 flex-shrink-0">
            <Navigation size={24} />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-bold text-green-700 m-0">Use Current Location</h3>
            <p className="text-xs text-gray-500 m-0 mt-0.5">Enable GPS for accurate delivery</p>
          </div>
        </button>

        {/* Saved Addresses */}
        <h3 className="font-bold text-gray-800 mb-3 px-1 uppercase text-xs tracking-wider">Saved Addresses</h3>
        <div className="space-y-3">
          {savedAddresses.map(addr => (
            <div 
              key={addr.id} 
              onClick={() => alert(`Selected ${addr.type}: Mock feature. In real app, passes lat/lng.`)}
              className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4 cursor-pointer hover:shadow-md transition border border-gray-100"
            >
              <div className="text-2xl mt-1 flex-shrink-0">{addr.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-900 m-0">{addr.type}</h4>
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                    <Clock size={12} /> {addr.distance}
                  </span>
                </div>
                <p className="text-sm text-gray-500 m-0 line-clamp-2">{addr.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
