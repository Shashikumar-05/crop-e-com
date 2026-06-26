import axios from 'axios';
import toast from 'react-hot-toast';

const useRazorpay = (clearCart, navigate) => {

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (cartItems, totalAmount, user) => {
    // Load Razorpay SDK dynamically
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load Razorpay. Check your internet connection.');
      return;
    }

    try {
      // Step 1: Create order on backend
      const { data } = await axios.post('/api/payment/create-order',
        { items: cartItems, totalAmount },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Step 2: Open Razorpay popup
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AgriMarket',
        description: 'Fresh Crops from Local Farmers',
        image: '🌿',
        order_id: data.orderId,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: cartItems,
              totalAmount
            }, { headers: { Authorization: `Bearer ${user.token}` } });

            if (verifyRes.data.success) {
              clearCart();
              toast.success('🎉 Payment successful! Order placed.');
              navigate('/order-success', {
                state: {
                  orderId: verifyRes.data.orderId,
                  totalAmount
                }
              });
            }
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. Your cart is still saved.', {
              icon: '🛒'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  const handleExistingPayment = async (orderId, totalAmount, user, onsuccess) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load Razorpay. Check your internet connection.');
      return;
    }

    try {
      const { data } = await axios.post('/api/payment/pay-existing',
        { orderId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AgriMarket',
        description: 'Final Bill Payment',
        image: '🌿',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/payment/verify-existing', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId
            }, { headers: { Authorization: `Bearer ${user.token}` } });

            if (verifyRes.data.success) {
              toast.success('🎉 Payment successful!');
              if(onsuccess) onsuccess();
            }
          } catch (err) {
            toast.error('Payment verification failed.');
          }
        },
        prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => toast('Payment cancelled.') }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => toast.error(`Payment failed: ${response.error.description}`));
      rzp.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  return { handlePayment, handleExistingPayment };
};

export default useRazorpay;
