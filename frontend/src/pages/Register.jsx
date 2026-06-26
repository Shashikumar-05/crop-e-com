import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Truck, CreditCard, Upload, User as UserIcon, MapPin, KeyRound, Phone, Mail, Eye, EyeOff } from 'lucide-react';

function Register() {
  const routerLocation = useLocation();
  const queryParams = new URLSearchParams(routerLocation.search);
  const initialRole = queryParams.get('role') || 'Farmer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    area: '',
    role: initialRole,
    vehicle: '3 Wheeler',
    vehicle_number: '',
    license_number: '',
    license_image: '',
    rc_book: '',
    capacity_kg: 500
  });

  const [dlFileName, setDlFileName] = useState('');
  const [rcFileName, setRcFileName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'Buyer') navigate('/marketplace', { replace: true });
      else if (user.role === 'Farmer') navigate('/dashboard', { replace: true });
      else if (user.role === 'Delivery') navigate('/delivery', { replace: true });
      else if (user.role === 'Manager') navigate('/manager/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const { name, email, password, phone, location, area, role, vehicle, vehicle_number, license_number, capacity_kg } = formData;

  const onChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    
    // Auto-fill capacity based on vehicle type
    if (name === 'vehicle') {
      if (value === '3 Wheeler') updates.capacity_kg = 500;
      else if (value === 'Mini Van') updates.capacity_kg = 1000;
      else if (value === '4 Wheeler Pick Up') updates.capacity_kg = 1500;
      else if (value === '4-Wheeler Pickup') updates.capacity_kg = 3000;
      else if (value === '6-Wheeler Truck') updates.capacity_kg = 8000;
    }
    
    setFormData((prevState) => ({ ...prevState, ...updates }));
  };

  const handleImageUpload = (e, type = 'license') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      if (type === 'license') setDlFileName(file.name);
      else setRcFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          [type === 'license' ? 'license_image' : 'rc_book']: reader.result 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (role === 'Delivery') {
      const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/i;
      if (!vehicleRegex.test(vehicle_number.replace(/\s/g, ''))) {
        return "Invalid Vehicle Number. Example format: KA01AB1234";
      }
      const dlRegex = /^[A-Z]{2}[0-9]{2} [0-9]{11}$/i;
      if (!dlRegex.test(license_number)) {
        return "Invalid Driving License. Format: 2 Letters (KA) + 2 Numbers (00) + 1 Space + 11 Numbers (12345678900).";
      }
    }
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/register', formData);
      if (response.data) {
        if (response.data.account_status === 'pending') {
          toast.success('Registration successful! Waiting for approval.');
          setMessage('Registration successful! Your account is under review. Please wait for manager approval.');
          setTimeout(() => {
            navigate('/login?role=Delivery', { replace: true });
          }, 4000);
        } else {
          login(response.data, response.data.token);
          toast.success('Welcome aboard!');
          setMessage('Registration successful! Redirecting...');
          setTimeout(() => {
            const r = response.data.role;
            if (r === 'Farmer') navigate('/dashboard', { replace: true });
            else if (r === 'Delivery') navigate('/delivery', { replace: true });
            else if (r === 'Manager') navigate('/manager/dashboard', { replace: true });
            else navigate('/marketplace', { replace: true });
          }, 1000);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to register';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center items-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold m-0">Create Account</h2>
          <p className="text-indigo-200 mt-1 text-sm">Join the premium agricultural marketplace</p>
        </div>

        <div className="p-6 md:p-8">
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-8">
            
            {/* Account Type */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">I want to register as:</label>
              <select
                name="role"
                value={role}
                onChange={onChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="Farmer">Seller / Farmer (Sell Products)</option>
                <option value="Buyer">Customer (Buy Products)</option>
                <option value="Delivery">Delivery Partner</option>
                <option value="Manager">Manager (Assign Orders)</option>
              </select>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-800 flex items-center gap-2">
                <UserIcon size={18} className="text-indigo-600"/> Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="name" value={name} onChange={onChange} required placeholder="John Doe"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="email" name="email" value={email} onChange={onChange} required placeholder="john@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} name="password" value={password} onChange={onChange} required placeholder="Create a strong password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center"
                      style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, boxShadow: 'none', minWidth: 'auto', minHeight: 'auto' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="tel" name="phone" value={phone} onChange={onChange} required placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-800 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600"/> Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">City / Region</label>
                  <input type="text" name="location" value={location} onChange={onChange} required placeholder="E.g. Bangalore"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                {(role === 'Delivery' || role === 'Manager') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Specific Area / Zone</label>
                    <input type="text" name="area" value={area} onChange={onChange} placeholder="E.g. Whitefield"
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details (Only for Delivery) */}
            {role === 'Delivery' && (
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                <h3 className="text-lg font-bold pb-2 mb-4 text-indigo-900 flex items-center gap-2">
                  <Truck size={18} className="text-indigo-600"/> Vehicle & License Details
                </h3>
                <p className="text-xs text-indigo-600 mb-4 font-medium">Your account will require manager approval before activation.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Vehicle Type</label>
                    <select name="vehicle" value={vehicle} onChange={onChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition">
                      <option value="3 Wheeler">3 Wheeler (500 kg)</option>
                      <option value="Mini Van">Mini Van (1000 kg)</option>
                      <option value="4 Wheeler Pick Up">4 wheeler pick up (1500 kg)</option>
                      <option value="4-Wheeler Pickup">4-Wheeler Pickup (3000 kg)</option>
                      <option value="6-Wheeler Truck">6-Wheeler Truck (8000 kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Capacity (Auto-filled)</label>
                    <input type="text" value={`Up to ${capacity_kg} kg`} disabled className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Vehicle Number</label>
                    <input type="text" name="vehicle_number" value={vehicle_number} onChange={onChange} required placeholder="KA01AB1234"
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Driving License Number</label>
                    <div className="relative">
                      <CreditCard size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" name="license_number" value={license_number} onChange={onChange} required placeholder="KA00 12345678900"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Upload License Image (Optional)</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer block">
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleImageUpload(e, 'license')} />
                      <Upload size={20} className={`mx-auto mb-2 ${dlFileName ? 'text-green-500' : 'text-gray-400'}`} />
                      <p className={`text-xs font-medium ${dlFileName ? 'text-green-600' : 'text-gray-500'}`}>
                        {dlFileName ? `Selected: ${dlFileName}` : 'License Image/PDF'}
                      </p>
                    </label>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Upload RC Book (Optional)</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer block">
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleImageUpload(e, 'rc_book')} />
                      <Upload size={20} className={`mx-auto mb-2 ${rcFileName ? 'text-green-500' : 'text-gray-400'}`} />
                      <p className={`text-xs font-medium ${rcFileName ? 'text-green-600' : 'text-gray-500'}`}>
                        {rcFileName ? `Selected: ${rcFileName}` : 'RC Book Image/PDF'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-md transition-all ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
            >
              {isSubmitting ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={`/login${role ? `?role=${role}` : ''}`} className="text-indigo-600 font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
