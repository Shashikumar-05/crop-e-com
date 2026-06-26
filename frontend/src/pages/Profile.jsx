import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Profile() {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setEditForm({
      name: parsedUser.name || '',
      phone: parsedUser.phone || '',
      location: parsedUser.location || ''
    });
    setLoading(false);
  }, [navigate]);

  const onLogout = () => {
    logout();
    navigate('/');
  };

  const onEditChange = (e) => {
    setEditForm((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      const { data } = await axios.put('/api/auth/me', editForm, config);
      
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      toast.error(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  };

  const getAvatarColor = () => {
    if (!user) return 'bg-gray-200 text-gray-500';
    switch (user.role) {
      case 'Farmer': return { bg: 'var(--primary-600)', text: 'var(--white)' };
      case 'Delivery': return { bg: '#3b82f6', text: 'var(--white)' };
      case 'Manager': return { bg: '#f59e0b', text: 'var(--white)' };
      default: return { bg: '#6366f1', text: 'var(--white)' };
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '40px' }}>Loading Profile...</p>;
  if (!user) return null;

  const avatar = getAvatarColor();

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem' }}>My Profile</h1>
        <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '1.05rem' }}>Manage your personal details and account settings.</p>
      </div>

      <div className="card">
        <div style={{ 
          backgroundColor: 'var(--neutral-50)', 
          padding: '30px', 
          textAlign: 'center',
          borderBottom: '1px solid var(--neutral-100)'
        }}>
          <div style={{ 
            width: '90px', height: '90px', 
            backgroundColor: avatar.bg, color: avatar.text,
            borderRadius: '50%', margin: '0 auto 15px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '2.5rem', fontWeight: '700',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem', color: 'var(--neutral-900)' }}>{user.name || 'User Profile'}</h2>
          <span style={{ 
            display: 'inline-block', padding: '6px 16px', 
            backgroundColor: 'var(--white)', color: 'var(--neutral-700)',
            border: '1px solid var(--neutral-200)',
            borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700'
          }}>
            {user.role} Account
          </span>
        </div>

        <div className="card-body" style={{ padding: '30px' }}>
          {isEditing ? (
            <form onSubmit={onEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--neutral-900)' }}>Edit Information</h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Full Name</label>
                <input 
                  type="text" name="name" value={editForm.name} onChange={onEditChange} 
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Phone Number</label>
                <input 
                  type="tel" name="phone" value={editForm.phone} onChange={onEditChange} 
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Location Details</label>
                <input 
                  type="text" name="location" value={editForm.location} onChange={onEditChange} 
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '1.5rem' }}>📧</div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: '600', textTransform: 'uppercase' }}>Email Address</p>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--neutral-900)', fontSize: '1rem' }}>{user.email}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '1.5rem' }}>📱</div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: '600', textTransform: 'uppercase' }}>Phone Number</p>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--neutral-900)', fontSize: '1rem' }}>{user.phone || <em style={{ color: 'var(--neutral-400)' }}>Not provided</em>}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '1.5rem' }}>📍</div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: '600', textTransform: 'uppercase' }}>Location</p>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--neutral-900)', fontSize: '1rem' }}>{user.location || <em style={{ color: 'var(--neutral-400)' }}>Not provided</em>}</p>
                </div>
              </div>
              
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-full" style={{ padding: '14px', fontSize: '1rem' }}>✏️ Edit Profile</button>
                <button onClick={onLogout} className="btn" style={{ padding: '14px', fontSize: '1rem', backgroundColor: '#fef2f2', color: 'var(--danger)', border: '1px solid #fecaca' }}>🚪 Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
