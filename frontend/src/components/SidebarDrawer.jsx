import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function SidebarDrawer({ isOpen, onClose, user, onLogout }) {
  const location = useLocation();
  const { t } = useTranslation();

  // Return null if not open and animation not needed for simplicity, 
  // but it's better to keep it rendered and toggle translate class for smooth animation.

  // Generic links mapping for different roles
  const getMenuLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'Delivery':
        return [
          { name: t('sidebar.my_shifts'), path: '/delivery', icon: '🚚', state: { tab: 'available' } },
          { name: t('sidebar.assigned_orders'), path: '/delivery', icon: '📦', state: { tab: 'active' } },
          { name: t('sidebar.order_history'), path: '/delivery', icon: '📜', state: { tab: 'history' } },
          { name: t('sidebar.earnings'), path: '/earnings', icon: '💸' },
          { name: t('sidebar.ai_advisor'), path: '/advisor', icon: '🤖' },
          { name: t('sidebar.profile'), path: '/profile', icon: '👤' },
        ];
      case 'Farmer': // Seller
        return [
          { name: t('sidebar.dashboard'), path: '/dashboard', icon: '📊' },
          { name: t('sidebar.add_product'), path: '/add-crop', icon: '➕' },
          { name: t('sidebar.new_orders'), path: '/seller-orders', icon: '🆕' },
          { name: t('sidebar.order_history'), path: '/seller-orders', icon: '📜' },
          { name: t('sidebar.revenue'), path: '/revenue', icon: '💰' },
          { name: t('sidebar.ai_advisor'), path: '/advisor', icon: '🤖' },
          { name: t('sidebar.profile'), path: '/profile', icon: '👤' },
        ];
      case 'Buyer': // Customer
        return [
          { name: t('sidebar.home'), path: '/marketplace', icon: '🏪' },
          { name: t('sidebar.my_orders'), path: '/my-orders', icon: '📦' },
          { name: t('sidebar.cart'), path: '/cart', icon: '🛒' },
          { name: t('sidebar.ai_advisor'), path: '/advisor', icon: '🤖' },
          { name: t('sidebar.profile'), path: '/profile', icon: '👤' },
        ];
      case 'Manager':
        return [
          { name: t('sidebar.control_desk'), path: '/manager/dashboard', icon: '👔' },
          { name: t('sidebar.live_fleet_tracking'), path: '/manager/tracking', icon: '🗺️' },
          { name: 'Vehicle Pricing', path: '/manager/vehicles', icon: '🚚' },
          { name: t('sidebar.order_history'), path: '/manager/history', icon: '📜' },
          { name: t('sidebar.sales_transactions'), path: '/manager/sales', icon: '💳' },
          { name: t('sidebar.approvals'), path: '/manager/approvals', icon: '✅' },
          { name: t('sidebar.ai_advisor'), path: '/advisor', icon: '🤖' },
          { name: t('sidebar.profile'), path: '/profile', icon: '👤' },
        ];
      default:
        return [
          { name: t('sidebar.home'), path: '/', icon: '🏠' }
        ];
    }
  };

  const getRoleBadge = () => {
    if (!user) return t('sidebar.guest');
    switch (user.role) {
      case 'Farmer': return `🌾 ${t('sidebar.seller')}`;
      case 'Delivery': return `🚚 ${t('sidebar.rider_partner')}`;
      case 'Buyer': return `⭐ ${t('sidebar.customer')}`;
      case 'Manager': return `👔 ${t('sidebar.hub_manager')}`;
      default: return t('sidebar.user');
    }
  };

  const getAvatarColor = () => {
    if (!user) return 'bg-gray-200 text-gray-500';
    switch (user.role) {
      case 'Farmer': return 'bg-green-100 text-green-700';
      case 'Delivery': return 'bg-blue-100 text-blue-700';
      case 'Manager': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-indigo-100 text-indigo-700';
    }
  };

  const links = getMenuLinks();

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 100, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* DRAWER PANEL */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ zIndex: 110 }}
      >
        {/* HEADER SECTION */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 text-gray-500 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {user ? (
            <div className="mt-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-md ${getAvatarColor()}`}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="font-bold text-gray-900 text-lg m-0">{user.name || t('sidebar.user')}</h3>
              <p className="text-gray-500 text-sm m-0 mt-0.5">{user.email || user.phone || t('sidebar.no_contact_info')}</p>
              <div className="mt-3 inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                {getRoleBadge()}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl font-bold mb-3 text-gray-500 shadow-sm">
                ?
              </div>
              <h3 className="font-bold text-gray-900 text-lg m-0">{t('sidebar.guest_user')}</h3>
              <p className="text-gray-500 text-sm m-0 mt-0.5">{t('sidebar.please_login')}</p>
            </div>
          )}
        </div>

        {/* MENU ITEMS SECTION */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <ul className="space-y-1 mx-3 list-none p-0">
            {links.map((link, idx) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={idx}>
                  <Link
                    to={link.path}
                    state={link.state}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* FOOTER SECTION: LOGOUT */}
        {user && (
          <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl transition shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              {t('sidebar.sign_out')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SidebarDrawer;
