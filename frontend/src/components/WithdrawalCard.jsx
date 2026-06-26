import React from 'react';
import { IndianRupee, Clock, Check, X, Wallet } from 'lucide-react';

const WithdrawalCard = ({ request, onApprove, onReject }) => {
  const isPending = request.status === 'pending' || request.status === 'Pending';
  
  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden transition ${isPending ? 'bg-white border-gray-200 hover:shadow-md' : 'bg-gray-50 border-gray-100'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg m-0 flex items-center gap-2">
              {request.user?.name || 'Unknown User'}
            </h3>
            <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md">
              {request.role}
            </span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
            ${isPending ? 'bg-yellow-100 text-yellow-700' : (request.status === 'completed' || request.status === 'Approved') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
          `}>
            {request.status}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex-1 border-r border-gray-200">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Amount Requested</p>
            <p className="text-xl font-black text-green-600 flex items-center">
               <IndianRupee size={16} strokeWidth={3} /> {request.amount}
            </p>
          </div>
          <div className="flex-1 pl-2">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Available Balance</p>
            <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
               <Wallet size={14} /> ₹{request.user?.walletBalance || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-4 font-medium">
           <Clock size={12} /> {new Date(request.createdAt).toLocaleString()}
        </div>

        {isPending ? (
          <div className="flex gap-2">
            <button 
              onClick={() => onApprove(request._id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Check size={18} /> Approve
            </button>
            <button 
              onClick={() => onReject(request._id)}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <X size={18} /> Reject
            </button>
          </div>
        ) : (
           <div className="w-full text-center text-sm font-bold text-gray-500 py-2 bg-gray-100 rounded-lg">
             Processed
           </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalCard;