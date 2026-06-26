import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { Navigation, CheckCircle, Store, Home } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// NOTE: Add your API key to your environment variables
// Use environment variable: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const LIBRARIES = ['places'];

// Mock Locations for Demonstration
const MOCK_LOCATIONS = {
  deliveryPartner: { lat: 12.9352, lng: 77.6245 }, // E.g. Koramangala
  seller: { lat: 12.9716, lng: 77.5946 },          // E.g. MG Road
  customer: { lat: 13.0279, lng: 77.5409 }         // E.g. Yeshwanthpur
};

export default function DeliveryNavigation() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Add API Key here
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  
  // Navigation Steps: 'pickup' -> 'delivery' -> 'completed'
  const [step, setStep] = useState('pickup');
  const [isNavigating, setIsNavigating] = useState(false);

  // Uses Google Directions API to plot route from Origin to Destination
  const calculateRoute = useCallback(async (origin, destination) => {
    if (!window.google) return;
    
    // eslint-disable-next-line no-undef
    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        // eslint-disable-next-line no-undef
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      
      setDirectionsResponse(results);
      setDistance(results.routes[0].legs[0].distance.text);
      setDuration(results.routes[0].legs[0].duration.text);
      
      // Auto-fit map to route bounds
      if (map) {
        map.fitBounds(results.routes[0].bounds);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  }, [map]);

  // Effect to recalculate route automatically when step changes
  useEffect(() => {
    if (!isLoaded) return;
    
    if (step === 'pickup') {
      // Step 1: Delivery Partner Location -> Seller Location
      calculateRoute(MOCK_LOCATIONS.deliveryPartner, MOCK_LOCATIONS.seller);
    } else if (step === 'delivery') {
      // Step 2: Seller Location -> Customer Location
      calculateRoute(MOCK_LOCATIONS.seller, MOCK_LOCATIONS.customer);
    }
  }, [step, isLoaded, calculateRoute]);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    alert("Live Navigation Started! (Simulated)");
  };

  const handleActionClick = () => {
    if (step === 'pickup') {
      setStep('delivery');
      setIsNavigating(false); // Reset to allow them to "Start" the next leg
    } else if (step === 'delivery') {
      setStep('completed');
      setIsNavigating(false);
    }
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Navigation System...</div>;

  // Completion Screen (Optional Step 3)
  if (step === 'completed') {
    return (
      <div className="max-w-md mx-auto h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 text-white shadow-[0_10px_30px_rgba(34,197,94,0.4)] animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 m-0">Delivery Complete!</h2>
        <p className="text-gray-600 mb-8 font-medium">Great job! The order has been successfully delivered to the customer.</p>
        <button onClick={() => setStep('pickup')} className="px-8 py-3.5 bg-white text-green-700 font-bold rounded-xl shadow-sm border border-green-200 hover:bg-green-100 transition">
          Take Next Order
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-gray-100 relative overflow-hidden font-sans shadow-2xl">
      
      {/* Top Status Banner */}
      <div className="absolute top-0 w-full z-10 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${step === 'pickup' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
            {step === 'pickup' ? 'Step 1: Pickup' : 'Step 2: Dropoff'}
          </span>
          <h2 className="text-lg font-bold text-gray-900 mt-1.5 m-0">
            {step === 'pickup' ? 'Heading to Seller' : 'Heading to Customer'}
          </h2>
        </div>
        
        {distance && duration && (
          <div className="text-right bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <div className="text-xl font-black text-gray-800 m-0">{duration}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5 m-0">{distance}</div>
          </div>
        )}
      </div>

      {/* Full Map Area */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={MOCK_LOCATIONS.deliveryPartner}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true, // Clean UI for mobile
            zoomControl: false,
          }}
        >
          {directionsResponse && (
            <DirectionsRenderer 
              directions={directionsResponse}
              options={{
                polylineOptions: {
                  strokeColor: step === 'pickup' ? '#4f46e5' : '#16a34a', // Indigo for pickup, Green for dropoff
                  strokeWeight: 6,
                  strokeOpacity: 0.8
                },
                suppressMarkers: true // We use our own markers below for custom styling
              }}
            />
          )}

          {/* Render custom colored markers based on current step */}
          {step === 'pickup' && (
            <>
              {/* Delivery Partner location */}
              <Marker position={MOCK_LOCATIONS.deliveryPartner} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
              {/* Seller location */}
              <Marker position={MOCK_LOCATIONS.seller} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />
            </>
          )}
          {step === 'delivery' && (
            <>
              {/* Seller location */}
              <Marker position={MOCK_LOCATIONS.seller} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />
              {/* Customer location */}
              <Marker position={MOCK_LOCATIONS.customer} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
            </>
          )}
        </GoogleMap>
      </div>

      {/* BOTTOM ACTION SHEET */}
      <div className="bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.15)] p-6 z-20 relative">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${step === 'pickup' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
            {step === 'pickup' ? <Store size={28} /> : <Home size={28} />}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 m-0">Destination</h3>
            <h4 className="font-bold text-gray-900 text-lg m-0">
              {step === 'pickup' ? 'Fresh Farms Hub (Seller)' : 'Customer Location'}
            </h4>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 m-0">
              {step === 'pickup' ? 'MG Road, Bangalore' : 'Yeshwanthpur, Bangalore'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!isNavigating ? (
            <button 
              onClick={handleStartNavigation}
              className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-gray-200"
            >
              <Navigation size={20} />
              Start Navigation
            </button>
          ) : (
            <button 
              onClick={handleActionClick}
              className={`flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl text-white
                ${step === 'pickup' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
            >
              <CheckCircle size={20} />
              {step === 'pickup' ? 'Pickup Confirmed' : 'Mark Delivered'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
