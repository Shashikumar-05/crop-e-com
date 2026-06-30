import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get('/api/payment/my-orders', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const found = data.find(o => o._id === id);
      if (found) setOrder(found);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '60px' }}>Loading invoice...</p>;
  if (!order) return <p style={{ textAlign: 'center', padding: '60px' }}>Order not found</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '40px', backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
      
      {/* Print Button (hidden during print) */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }} className="print-hide">
        <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '8px 20px' }}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#16a34a', fontSize: '2.5rem' }}>INVOICE</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Farm2Home Agritech</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Order {order.order_id || '#' + order._id.slice(-8).toUpperCase()}</p>
          <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '0.9rem' }}>Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Status: {order.orderStatus}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '1rem', textTransform: 'uppercase' }}>Billed To:</h3>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{order.buyer?.name || user.name}</p>
          <p style={{ margin: '0 0 5px 0', color: '#4b5563' }}>{order.deliveryAddress || order.buyer?.location || 'Address not provided'}</p>
          <p style={{ margin: 0, color: '#4b5563' }}>{order.buyer?.phone}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '1rem', textTransform: 'uppercase' }}>Payment Details:</h3>
          <p style={{ margin: '0 0 5px 0' }}>Method: <strong>{order.paymentMethod}</strong></p>
          <p style={{ margin: 0 }}>Payment Status: <strong>{order.paymentStatus || 'Pending'}</strong></p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Item</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Rate (₹)</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px' }}>{item.cropName}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{item.pricePerUnit}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{item.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.billConfirmed ? (
        <div style={{ width: '300px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#4b5563' }}>Product Total</span>
            <span>₹{order.productTotal?.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#4b5563' }}>Platform Fee</span>
            <span style={{ fontWeight: '600' }}>₹{order.platformFee || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#4b5563' }}>Delivery Charges</span>
            <span style={{ fontWeight: '600' }}>₹{order.deliveryCharge || order.deliveryTotal || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Grand Total</span>
            <span style={{ color: '#16a34a' }}>₹{order.grandTotal?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      ) : (
        <div style={{ width: '300px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Total Amount</span>
            <span style={{ color: '#16a34a' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <p style={{ textAlign: 'right', fontSize: '0.8rem', color: '#ef4444' }}>* Bill pending final confirmation</p>
        </div>
      )}

      <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
        <p style={{ margin: '0 0 5px 0' }}>Thank you for doing business with Farm2Home Agritech!</p>
        <p style={{ margin: 0 }}>This is a computer generated invoice and does not require a signature.</p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-hide { display: none !important; }
          .container { padding: 0 !important; }
          div[style*="maxWidth: '800px'"] * { visibility: visible; }
          div[style*="maxWidth: '800px'"] { 
            position: absolute; 
            left: 0; 
            top: 0; 
            margin: 0 !important; 
            padding: 20px !important; 
            box-shadow: none !important; 
            border: none !important; 
            width: 100%; 
          }
        }
      `}</style>
    </div>
  );
}

export default Invoice;
