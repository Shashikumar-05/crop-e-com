import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ManagerVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get('/api/manager/vehicles', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setVehicles(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load vehicles');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const handleEditClick = (category) => {
    setEditingType(category.type);
    setEditPrice(category.price);
  };

  const handleSavePrice = async (type) => {
    try {
      if (!editPrice || isNaN(editPrice) || Number(editPrice) <= 0) {
        toast.error('Please enter a valid price greater than 0');
        return;
      }

      await axios.put(`/api/manager/vehicles/type/${type}/price`, { price_per_km: editPrice }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      toast.success('Category price updated successfully!');
      setEditingType(null);
      fetchVehicles(); // Refresh the list
    } catch (error) {
      console.error(error);
      toast.error('Failed to update vehicle price');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading vehicles...</div>;
  }

  const uniqueCategories = Object.values(
    vehicles.reduce((acc, vehicle) => {
      if (!acc[vehicle.vehicle_type]) {
        acc[vehicle.vehicle_type] = {
          type: vehicle.vehicle_type,
          capacity: vehicle.capacity_kg,
          price: vehicle.price_per_km
        };
      }
      return acc;
    }, {})
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            🚚 Vehicle Pricing Management
          </h1>
          <p className="text-gray-500 mt-2">Adjust the per-kilometer price for delivery vehicles. Changes apply instantly to new orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Vehicle Type</th>
                <th className="p-4 font-semibold">Capacity</th>
                <th className="p-4 font-semibold text-right">Price per km (₹)</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {uniqueCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No vehicle categories available.</td>
                </tr>
              ) : (
                uniqueCategories.map((category) => (
                  <tr key={category.type} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl">
                          {category.type?.toLowerCase().includes('3') ? '🛺' : '🚚'}
                        </div>
                        <span className="font-semibold text-gray-800">{category.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {category.capacity} kg
                    </td>
                    <td className="p-4 text-right">
                      {editingType === category.type ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-500 font-medium">₹</span>
                          <input 
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 border border-indigo-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900 text-lg">₹{category.price}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingType === category.type ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleSavePrice(category.type)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingType(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEditClick(category)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 px-4 py-2 rounded-xl transition"
                        >
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerVehicles;
