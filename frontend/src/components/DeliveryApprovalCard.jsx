import React from 'react';
import { User, Truck, CreditCard, Check, X, Eye } from 'lucide-react';

const DeliveryApprovalCard = ({ partner, onApprove, onReject, onViewDetails, isHistory }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xl">
              {partner.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg m-0">{partner.name}</h3>
              <p className="text-gray-500 text-sm m-0 flex items-center gap-1">
                 📍 {partner.location} {partner.area && `(${partner.area})`}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
            ${isHistory ? (partner.account_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-yellow-100 text-yellow-700'}
          `}>
            {isHistory ? partner.account_status : 'Pending Review'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Contact</p>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><User size={14}/> {partner.phone}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Vehicle</p>
            <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><Truck size={14}/> {partner.vehicleDetails?.vehicle_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Vehicle No.</p>
            <p className="text-sm font-bold text-gray-800 uppercase">{partner.vehicleDetails?.vehicle_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">License No.</p>
            <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><CreditCard size={14}/> {partner.vehicleDetails?.license_number || 'N/A'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isHistory && (
            <>
              <button 
                onClick={() => onApprove(partner._id)}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Check size={18} /> Approve
              </button>
              <button 
                onClick={() => onReject(partner._id)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <X size={18} /> Reject
              </button>
            </>
          )}
          <button 
            onClick={() => onViewDetails(partner)}
            className={`p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition ${isHistory ? 'flex-1 flex justify-center gap-2 font-bold' : ''}`}
            title="View Documents"
          >
            <Eye size={20} /> {isHistory && 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryApprovalCard;
