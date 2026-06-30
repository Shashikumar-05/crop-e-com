import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function GenerateBillModal({ order, onClose, onConfirm, userToken }) {
  const [vehicles, setVehicles] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [distance, setDistance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedVehicle(order.vehicle || '');
      setSelectedPartner(order.deliveryPartner || '');
      setDistance(order.deliveryDistance || '');
    }
    fetchVehicles();
    fetchPartners();
  }, [order]);

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get('/api/manager/vehicles', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setVehicles(data.filter(v => v.status === 'available'));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data } = await axios.get('/api/manager/delivery-partners', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedPartner || distance === '') {
      toast.error('Please select vehicle, partner, and enter distance.');
      return;
    }
    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userToken}` } };
      const selectedVehicleData = vehicles.find(v => v._id === selectedVehicle);
      const ratePerKm = selectedVehicleData ? selectedVehicleData.price_per_km : 150;
      const calculatedDeliveryCharge = Number(distance) * ratePerKm;

      const payload = {
        vehicleId: selectedVehicle,
        deliveryPartnerId: selectedPartner,
        distance: Number(distance),
        deliveryCharge: calculatedDeliveryCharge
      };
      await axios.put(`/api/manager/assign-order/${order._id}`, payload, config);
      toast.success('Vehicle and Partner assigned successfully!');
      onConfirm();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to assign delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold m-0">Assign Delivery Vehicle</h2>
          <button onClick={onClose} className="text-white hover:text-indigo-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Fleet Summary Info */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                <span className="text-2xl">🚛</span>
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Vehicles</div>
                  <div className="text-lg font-black text-blue-900">{vehicles.length} Available</div>
                </div>
              </div>
              <div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-3">
                <span className="text-2xl">🏃</span>
                <div>
                  <div className="text-[10px] text-green-600 font-bold uppercase">Partners</div>
                  <div className="text-lg font-black text-green-900">{partners.length} Online</div>
                </div>
              </div>
            </div>

            {/* Delivery & Assignment Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Vehicle & Driver Assignment</h3>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <span>🚛</span> Select Available Vehicle
                  </label>
                  <select 
                    value={selectedVehicle} 
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.vehicle_type} ({v.vehicle_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <span>👤</span> Select Delivery Partner
                  </label>
                  <select 
                    value={selectedPartner} 
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  >
                    <option value="">-- Choose Partner --</option>
                    {partners.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} - {p.area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <span>📍</span> Distance {selectedVehicle ? `(₹${vehicles.find(v => v._id === selectedVehicle)?.price_per_km || 150}/KM)` : '(in KM)'}
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                    required
                  />
                  
                  {distance !== '' && selectedVehicle && (
                    <div className="mt-3 text-xs font-bold text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-indigo-600">
                        <span>Product Price:</span>
                        <span>₹{order.productTotal || order.totalAmount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-indigo-600">
                        <span>Calculated Delivery Charge:</span>
                        <span>₹{Number(distance) * (vehicles.find(v => v._id === selectedVehicle)?.price_per_km || 150)}</span>
                      </div>
                      <div className="flex justify-between items-center text-indigo-900 border-t border-indigo-200 pt-1 mt-1 font-black">
                        <span>Grand Total:</span>
                        <span>₹{(order.productTotal || order.totalAmount || 0) + Number(distance) * (vehicles.find(v => v._id === selectedVehicle)?.price_per_km || 150)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition font-bold">
              Cancel
            </button>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Delivery Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GenerateBillModal;
