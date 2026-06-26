import React from 'react';

function VehicleCategoryCard({ category, isSelected, onClick, isRecommended }) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between 
        ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${category.count === 0 ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-900 m-0 text-sm">{category.name}</h3>
        {isRecommended && (
          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold border border-green-200">
            RECOMMENDED
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-xs text-gray-500 m-0 mb-1">Capacity: <span className="font-semibold text-gray-700">{category.capacity_kg} kg</span></p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${category.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
          {category.count} Available
        </span>
      </div>
    </div>
  );
}

export default VehicleCategoryCard;
