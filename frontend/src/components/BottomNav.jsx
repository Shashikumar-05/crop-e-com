import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (!user) return null;

  const isActive = (route) => {
    if (route === '/' && path === '/') return true;
    if (route !== '/' && path.startsWith(route)) return true;
    return false;
  };

  const renderNavItems = () => {
    if (user.role === 'Buyer') {
      return (
        <>
          <Link to="/marketplace" className={`bottom-nav-item ${isActive('/marketplace') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">🏪</span>
            <span>Shop</span>
          </Link>
          <Link to="/cart" className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">🛒</span>
            <span>Cart</span>
          </Link>
          <Link to="/my-orders" className={`bottom-nav-item ${isActive('/my-orders') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">📦</span>
            <span>Orders</span>
          </Link>
        </>
      );
    } else if (user.role === 'Farmer') {
      return (
        <>
          <Link to="/dashboard" className={`bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">📊</span>
            <span>Inventory</span>
          </Link>
          <Link to="/add-crop" className={`bottom-nav-item ${isActive('/add-crop') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">➕</span>
            <span>Add List</span>
          </Link>
          <Link to="/seller-orders" className={`bottom-nav-item ${isActive('/seller-orders') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">📋</span>
            <span>Orders</span>
          </Link>
        </>
      );
    } else if (user.role === 'Delivery') {
      return (
        <>
          <Link to="/delivery" className={`bottom-nav-item ${isActive('/delivery') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">🚚</span>
            <span>Dashboard</span>
          </Link>
        </>
      );
    } else if (user.role === 'Manager') {
      return (
        <>
          <Link to="/manager/dashboard" className={`bottom-nav-item ${isActive('/manager/dashboard') ? 'active' : ''}`}>
            <span className="bottom-nav-icon">📉</span>
            <span>Dashboard</span>
          </Link>
        </>
      );
    }
  };

  return (
    <div className="bottom-nav hide-on-desktop">
      {renderNavItems()}
      
      {/* Profile Icon for Mobile */}
      <Link to="/profile" className={`bottom-nav-item ${path === '/profile' ? 'active' : ''}`}>
        <span className="bottom-nav-icon">👤</span>
        <span>Profile</span>
      </Link>
    </div>
  );
}

export default BottomNav;
