import React from 'react';

function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle, onBack }) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
        <p>No vehicles found in this category.</p>
        <button onClick={onBack} className="text-sm text-indigo-600 underline hover:text-indigo-800">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
          ← Back to Categories
        </button>
        <span className="text-xs text-gray-500">{vehicles.length} vehicle(s)</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {vehicles.map(v => {
          const isAvailable = v.status === 'available';
          const isSelected = selectedVehicleId === v._id;
          
          return (
            <div 
              key={v._id} 
              className={`p-3 rounded-xl border-2 transition flex justify-between items-center
                ${!isAvailable ? 'opacity-60 bg-gray-50 border-gray-100' : 'border-gray-200 bg-white'}`}
            >
              <div>
                <p className="font-bold text-gray-900 m-0 text-sm tracking-wide">{v.vehicle_number}</p>
                {v.assigned_driver && <p className="text-[10px] text-gray-500 m-0">Driver: {v.assigned_driver.name || v.assigned_driver}</p>}
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VehicleList;
