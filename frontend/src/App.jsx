import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import AddCrop from './pages/AddCrop';
import EditCrop from './pages/EditCrop';
import Landing from './pages/Landing';
import AIAdvisor from './pages/AIAdvisor';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import ListingDetailPage from './pages/ListingDetailPage';
import DeliveryDashboard from './pages/DeliveryDashboard';
import SellerOrders from './pages/SellerOrders';
import RevenuePage from './pages/RevenuePage';
import EarningsPage from './pages/EarningsPage';
import ManagerDashboard from './pages/ManagerDashboard';
import CustomerOrderTracking from './pages/tracking/CustomerOrderTracking';
import DeliveryPartnerTracking from './pages/tracking/DeliveryPartnerTracking';
import ManagerTracking from './pages/tracking/ManagerTracking';
import ApprovalPage from './pages/ApprovalPage';
import Invoice from './pages/Invoice';
import ManagerSales from './pages/ManagerSales';
import ManagerOrderHistory from './pages/ManagerOrderHistory';
import ManagerVehicles from './pages/ManagerVehicles';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Chatbot from './components/Chatbot';
import Profile from './pages/Profile';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <div className='container mobile-padding-bottom' style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
              <Routes>
                {/* Public */}
                <Route path='/' element={<Landing />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                {/* Customer Routes */}
                <Route path='/marketplace' element={<Home />} />
                <Route path='/listings/:id' element={<ListingDetailPage />} />
                <Route path='/cart' element={<Cart />} />
                <Route path='/my-orders' element={<MyOrders />} />
                <Route path='/order-success' element={<OrderSuccess />} />
                <Route path='/advisor' element={<AIAdvisor />} />
                <Route path='/track/:id' element={<CustomerOrderTracking />} />

                {/* Seller/Farmer Routes */}
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/add-crop' element={<AddCrop />} />
                <Route path='/edit-crop/:id' element={<EditCrop />} />
                <Route path='/seller-orders' element={<SellerOrders />} />
                <Route path='/revenue' element={<RevenuePage />} />
                <Route path='/earnings' element={<EarningsPage />} />

                {/* Delivery Partner Routes */}
                <Route path='/delivery' element={<DeliveryDashboard />} />
                <Route path='/delivery/route/:id' element={<DeliveryPartnerTracking />} />
                
                {/* Manager Routes */}
                <Route path='/manager/dashboard' element={<ManagerDashboard />} />
                <Route path='/manager/tracking' element={<ManagerTracking />} />
                <Route path='/manager/vehicles' element={<ManagerVehicles />} />
                <Route path='/manager/history' element={<ManagerOrderHistory />} />
                <Route path='/manager/approvals' element={<ApprovalPage />} />
                <Route path='/manager/sales' element={<ManagerSales />} />

                {/* Common Routes */}
                <Route path='/profile' element={<Profile />} />
                <Route path='/invoice/:id' element={<Invoice />} />
              </Routes>
            </div>

            <BottomNav />

            {/* Floating Chatbot */}
            <Chatbot />

            {/* Toast Notifications */}
            <Toaster
              position="bottom-left"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                },
                success: {
                  iconTheme: { primary: '#16a34a', secondary: '#fff' }
                }
              }}
            />
          </CartProvider>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
