import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, KeyRound, Eye, EyeOff } from 'lucide-react';

function Login() {
  const routerLocation = useLocation();
  const queryParams = new URLSearchParams(routerLocation.search);
  const initialRole = queryParams.get('role');

  const [selectedRole, setSelectedRole] = useState(initialRole || '');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;

  const redirectBasedOnRole = (role) => {
    if (role === 'Buyer') navigate('/marketplace', { replace: true });
    else if (role === 'Farmer') navigate('/dashboard', { replace: true });
    else if (role === 'Delivery') navigate('/delivery', { replace: true });
    else if (role === 'Manager') navigate('/manager/dashboard', { replace: true });
    else navigate('/', { replace: true });
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.role) {
          redirectBasedOnRole(userObj.role);
          return;
        }
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
    setCheckingAuth(false);
  }, []);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      if (!selectedRole) {
        setError('Please select a role to login.');
        setIsSubmitting(false);
        return;
      }
      
      const response = await api.post('/api/auth/login', { email, password, role: selectedRole });
      
      if (response.data) {
        const actualRole = response.data.role;

        if (selectedRole && selectedRole !== actualRole) {
          const roleErrorMap = {
            'Buyer': 'This is not a customer login',
            'Farmer': 'This is not a seller login',
            'Delivery': 'This is not a delivery partner login',
            'Manager': 'This is not a manager login',
          };
          setError(roleErrorMap[selectedRole] || 'Role mismatch occurred.');
          setIsSubmitting(false);
          return;
        }

        login(response.data, response.data.token);
        toast.success('Login successful!');
        setMessage('Redirecting...');
        
        setTimeout(() => {
          redirectBasedOnRole(actualRole);
        }, 800);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Prevent rendering the form initially if the user might be logged in
  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'var(--font-body)' }}>
        <p style={{ color: 'var(--neutral-600)', fontWeight: '500' }}>Verifying authentication...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Welcome Back</h2>
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>Sign in to access your dashboard</p>
          </div>
          
          {message && <div style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.9rem' }}>{message}</div>}
          {error && <div style={{ backgroundColor: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="name@company.com"
                  required
                  style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: 0, margin: 0, display: 'flex', boxShadow: 'none', minWidth: 'auto', minHeight: 'auto' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Login As (Role)</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)', backgroundColor: '#fff' }}
              >
                <option value="">-- Select your role --</option>
                <option value="Buyer">Customer</option>
                <option value="Farmer">Seller (Farmer)</option>
                <option value="Delivery">Delivery Partner</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full">
              Sign In
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
            Don't have an account?{' '}
            <Link 
              to={`/register${selectedRole ? `?role=${selectedRole}` : ''}`} 
              style={{ color: 'var(--primary-600)', fontWeight: '600', textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
