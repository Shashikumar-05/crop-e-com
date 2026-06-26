import React, { useState } from 'react';
import { Truck, X } from 'lucide-react';

const vehicleTypes = [
  {
    id: 1,
    name: "3-Wheeler Cargo",
    capacity: "Up to 500 kg",
    details: "Best for small, local, narrow-lane deliveries.",
    icon: "truck"
  },
  {
    id: 2,
    name: "Mini Truck",
    capacity: "700 - 1000 kg",
    details: "Ideal for short intra-city farm-to-market drops.",
    icon: "truck"
  },
  {
    id: 3,
    name: "Pickup Truck",
    capacity: "1500 kg",
    details: "Good for medium loads and rough village terrain.",
    icon: "truck"
  },
  {
    id: 4,
    name: "Light Commercial Truck",
    capacity: "3000 - 4000 kg",
    details: "Standard for bulk vegetable or fruit transport.",
    icon: "truck"
  },
  {
    id: 5,
    name: "Medium Commercial Truck",
    capacity: "5000+ kg",
    details: "Heavy-duty for large inter-city grain/crop shipments.",
    icon: "truck"
  }
];

export default function VehicleSelectionModal({ isOpen, onClose, onVehicleSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!isOpen) return null;

  const handleSelect = (vehicle) => {
    setSelectedId(vehicle.id);
    // Add a slight delay for visual feedback before closing/calling the callback
    setTimeout(() => {
      onVehicleSelect(vehicle);
    }, 200);
  };

  return (
    // Modal Overlay
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm modal-fade-in">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-xl font-bold text-gray-800 m-0">Select Suitable Vehicle</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Vehicle List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {vehicleTypes.map((vehicle) => {
            const isSelected = selectedId === vehicle.id;
            
            return (
              <div 
                key={vehicle.id}
                onClick={() => handleSelect(vehicle)}
                className={`flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-xl border-2 transition-all cursor-pointer group
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 bg-white'}`}
              >
                {/* Icon Section */}
                <div className={`p-3 rounded-xl mr-4 mb-3 sm:mb-0
                  ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors'}`}
                >
                  <Truck size={28} />
                </div>

                {/* Content Section */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-[15px] m-0">{vehicle.name}</h3>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                      {vehicle.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 m-0 leading-relaxed pr-2">
                    {vehicle.details}
                  </p>
                </div>

                {/* Action Section */}
                <div className="hidden sm:block ml-4">
                  <button 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white border border-gray-300 text-gray-700 group-hover:border-indigo-600 group-hover:text-indigo-600'}`}
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Inline styles for custom animations in Tailwind without modifying tailwind.config */}
      <style>{`
        .modal-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .modal-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
