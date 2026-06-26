import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DeliveryApprovalCard from '../components/DeliveryApprovalCard';
import WithdrawalCard from '../components/WithdrawalCard';
import { X } from 'lucide-react';

function ApprovalPage() {
  const [activeTab, setActiveTab] = useState('delivery');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [historyUsers, setHistoryUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [usersRes, historyRes, withdrawalsRes] = await Promise.all([
        axios.get('/api/manager/approvals/pending-users', config),
        axios.get('/api/manager/approvals/history', config),
        axios.get('/api/manager/approvals/withdrawals', config)
      ]);
      setPendingUsers(usersRes.data);
      setHistoryUsers(historyRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      toast.error('Failed to load approval data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatus = async (userId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/manager/approvals/user/${userId}`, { status }, config);
      toast.success(`Delivery Partner ${status} successfully`);
      const userToMove = pendingUsers.find(u => u._id === userId);
      if (userToMove) {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
        setHistoryUsers(prev => [{ ...userToMove, account_status: status }, ...prev]);
      }
      if (isModalOpen) setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleWithdrawalStatus = async (reqId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/manager/approvals/withdrawal/${reqId}`, { status }, config);
      toast.success(`Withdrawal ${status}`);
      setWithdrawals(prev => prev.map(w => w._id === reqId ? { ...w, status } : w));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update withdrawal');
    }
  };

  const openDetailsModal = (partner) => {
    setSelectedUser(partner);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-2 md:px-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 m-0">Approval Center</h1>
        <p className="text-gray-500 mt-1">Review and manage pending registrations and payout requests.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('delivery')}
          className={`pb-2 px-2 font-bold text-lg transition-all border-b-4 ${activeTab === 'delivery' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Delivery Partners
          {pendingUsers.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-2 px-2 font-bold text-lg transition-all border-b-4 ${activeTab === 'withdrawals' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Withdrawals
          {withdrawals.filter(w => w.status === 'Pending' || w.status === 'pending').length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{withdrawals.filter(w => w.status === 'Pending' || w.status === 'pending').length}</span>}
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'delivery' && (
        <div>
          {[...pendingUsers, ...historyUsers].length === 0 ? (
             <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
               <span className="text-4xl">🎉</span>
               <h3 className="text-xl font-bold text-gray-700 mt-4">All caught up!</h3>
               <p className="text-gray-500">No delivery partner applications or history found.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...pendingUsers, ...historyUsers].map(partner => (
                <DeliveryApprovalCard 
                  key={partner._id} 
                  partner={partner} 
                  isHistory={partner.account_status !== 'pending'}
                  onApprove={(id) => handleUserStatus(id, 'approved')}
                  onReject={(id) => handleUserStatus(id, 'rejected')}
                  onViewDetails={openDetailsModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div>
          {withdrawals.length === 0 ? (
             <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
               <span className="text-4xl">💰</span>
               <h3 className="text-xl font-bold text-gray-700 mt-4">No Withdrawal Requests</h3>
               <p className="text-gray-500">There are no pending payouts at this moment.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {withdrawals.map(request => (
                <WithdrawalCard 
                  key={request._id} 
                  request={request}
                  onApprove={(id) => handleWithdrawalStatus(id, 'Approved')}
                  onReject={(id) => handleWithdrawalStatus(id, 'Rejected')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR USER DETAILS */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 m-0">Applicant Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">
                <X size={20} className="text-gray-600"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-sm uppercase font-bold text-gray-400 mb-3 tracking-wider">Personal Info</h4>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div><span className="text-xs text-gray-500 block">Full Name</span> <span className="font-bold text-gray-800">{selectedUser.name}</span></div>
                      <div><span className="text-xs text-gray-500 block">Email Address</span> <span className="font-bold text-gray-800">{selectedUser.email}</span></div>
                      <div><span className="text-xs text-gray-500 block">Phone Number</span> <span className="font-bold text-gray-800">{selectedUser.phone}</span></div>
                      <div><span className="text-xs text-gray-500 block">Location / Area</span> <span className="font-bold text-gray-800">{selectedUser.location} ({selectedUser.area || 'N/A'})</span></div>
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="text-sm uppercase font-bold text-gray-400 mb-3 tracking-wider">Vehicle & License</h4>
                    <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <div><span className="text-xs text-indigo-400 block">Vehicle Type</span> <span className="font-bold text-indigo-900">{selectedUser.vehicleDetails?.vehicle_type || 'N/A'}</span></div>
                      <div><span className="text-xs text-indigo-400 block">Capacity</span> <span className="font-bold text-indigo-900">{selectedUser.vehicleDetails?.capacity_kg || '0'} kg</span></div>
                      <div><span className="text-xs text-indigo-400 block">Vehicle Number</span> <span className="font-bold text-indigo-900 uppercase">{selectedUser.vehicleDetails?.vehicle_number || 'N/A'}</span></div>
                      <div><span className="text-xs text-indigo-400 block">Driving License No.</span> <span className="font-bold text-indigo-900">{selectedUser.vehicleDetails?.license_number || 'N/A'}</span></div>
                    </div>
                 </div>
               </div>

               <div className="mt-8">
                  <h4 className="text-sm uppercase font-bold text-gray-400 mb-3 tracking-wider">Uploaded Document (License)</h4>
                  {selectedUser.vehicleDetails?.license_image ? (
                     selectedUser.vehicleDetails.license_image.startsWith('data:image') ? (
                       <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                         <img src={selectedUser.vehicleDetails.license_image} alt="License Document" className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm" />
                       </div>
                     ) : (
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                         <span className="text-2xl">📄</span> 
                         <a href={selectedUser.vehicleDetails.license_image} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">View Document</a>
                       </div>
                     )
                  ) : (
                     <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 font-medium">
                        No document uploaded by applicant.
                     </div>
                  )}
               </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
              {selectedUser.account_status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleUserStatus(selectedUser._id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-sm transition"
                  >
                    Approve Applicant
                  </button>
                  <button 
                    onClick={() => handleUserStatus(selectedUser._id, 'rejected')}
                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 font-bold py-3 rounded-xl transition"
                  >
                    Reject Applicant
                  </button>
                </>
              ) : (
                <div className={`w-full text-center py-3 rounded-xl font-bold uppercase tracking-wider ${selectedUser.account_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  STATUS: {selectedUser.account_status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ApprovalPage;
