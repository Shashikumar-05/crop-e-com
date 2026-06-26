import fs from 'fs';
import path from 'path';

const enPath = path.join(process.cwd(), 'src/locales/en/translation.json');
const hiPath = path.join(process.cwd(), 'src/locales/hi/translation.json');
const knPath = path.join(process.cwd(), 'src/locales/kn/translation.json');

const updateDict = (filePath, updates) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const [key, value] of Object.entries(updates)) {
    data[key] = { ...data[key], ...value };
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

updateDict(enPath, {
  seller_orders: {
    title: "Order History",
    subtitle: "Track and manage your product orders",
    total_orders: "Total Orders",
    pending_stat: "Pending",
    delivered_stat: "Delivered",
    revenue: "Revenue",
    all: "All",
    loading: "Loading orders...",
    no_orders: "No orders found for this filter",
    customer: "Customer",
    your_total: "Your Total",
    assigned_to: "Assigned to:",
    accept_inquiry: "Accept Inquiry",
    reject_inquiry: "Reject Inquiry",
    pending_manager: "Pending Manager Assignment",
    cancel: "Cancel",
    cancel_confirm: "Cancel this order?",
    order_cancelled: "Order cancelled",
    failed_cancel: "Failed to cancel",
    order_status_update: "Order →",
    failed_update: "Failed to update",
    // status mapping
    status_inquiry: "Inquiry",
    status_accepted: "Accepted",
    status_rejected: "Rejected",
    status_pending: "Pending",
    status_confirmed: "Confirmed",
    status_packed: "Packed",
    status_waiting_for_manager_review: "Waiting for Manager Review",
    status_assigned_to_delivery_partner: "Assigned to Delivery Partner",
    status_picked_up: "Picked Up",
    status_out_for_delivery: "Out for Delivery",
    status_delivered: "Delivered",
    status_cancelled: "Cancelled"
  }
});

updateDict(hiPath, {
  seller_orders: {
    title: "ऑर्डर इतिहास",
    subtitle: "अपने उत्पाद ऑर्डर को ट्रैक और प्रबंधित करें",
    total_orders: "कुल ऑर्डर",
    pending_stat: "लंबित",
    delivered_stat: "वितरित",
    revenue: "राजस्व",
    all: "सभी",
    loading: "ऑर्डर लोड हो रहे हैं...",
    no_orders: "इस फ़िल्टर के लिए कोई ऑर्डर नहीं मिला",
    customer: "ग्राहक",
    your_total: "आपका कुल",
    assigned_to: "सौंपा गया:",
    accept_inquiry: "पूछताछ स्वीकार करें",
    reject_inquiry: "पूछताछ अस्वीकार करें",
    pending_manager: "प्रबंधक असाइनमेंट लंबित",
    cancel: "रद्द करें",
    cancel_confirm: "क्या आप इस ऑर्डर को रद्द करना चाहते हैं?",
    order_cancelled: "ऑर्डर रद्द किया गया",
    failed_cancel: "रद्द करने में विफल",
    order_status_update: "ऑर्डर →",
    failed_update: "अपडेट करने में विफल",
    status_inquiry: "पूछताछ",
    status_accepted: "स्वीकार किया गया",
    status_rejected: "अस्वीकार कर दिया गया",
    status_pending: "लंबित",
    status_confirmed: "पुष्टि की गई",
    status_packed: "पैक किया गया",
    status_waiting_for_manager_review: "प्रबंधक समीक्षा की प्रतीक्षा में",
    status_assigned_to_delivery_partner: "वितरण भागीदार को सौंपा गया",
    status_picked_up: "उठा लिया गया",
    status_out_for_delivery: "वितरण के लिए बाहर",
    status_delivered: "वितरित",
    status_cancelled: "रद्द किया गया"
  }
});

updateDict(knPath, {
  seller_orders: {
    title: "ಆದೇಶ ಇತಿಹಾಸ",
    subtitle: "ನಿಮ್ಮ ಉತ್ಪನ್ನ ಆದೇಶಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ",
    total_orders: "ಒಟ್ಟು ಆದೇಶಗಳು",
    pending_stat: "ಬಾಕಿ ಉಳಿದಿವೆ",
    delivered_stat: "ವಿತರಿಸಲಾಗಿದೆ",
    revenue: "ಆದಾಯ",
    all: "ಎಲ್ಲಾ",
    loading: "ಆದೇಶಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    no_orders: "ಈ ಫಿಲ್ಟರ್‌ಗಾಗಿ ಯಾವುದೇ ಆದೇಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    customer: "ಗ್ರಾಹಕ",
    your_total: "ನಿಮ್ಮ ಒಟ್ಟು",
    assigned_to: "ನಿಯೋಜಿಸಲಾಗಿದೆ:",
    accept_inquiry: "ವಿಚಾರಣೆಯನ್ನು ಸ್ವೀಕರಿಸಿ",
    reject_inquiry: "ವಿಚಾರಣೆಯನ್ನು ತಿರಸ್ಕರಿಸಿ",
    pending_manager: "ಮ್ಯಾನೇಜರ್ ನಿಯೋಜನೆ ಬಾಕಿ ಇದೆ",
    cancel: "ರದ್ದುಗೊಳಿಸಿ",
    cancel_confirm: "ಈ ಆದೇಶವನ್ನು ರದ್ದುಗೊಳಿಸಬೇಕೆ?",
    order_cancelled: "ಆದೇಶವನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ",
    failed_cancel: "ರದ್ದುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ",
    order_status_update: "ಆದೇಶ →",
    failed_update: "ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ",
    status_inquiry: "ವಿಚಾರಣೆ",
    status_accepted: "ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
    status_rejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    status_pending: "ಬಾಕಿ ಉಳಿದಿದೆ",
    status_confirmed: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    status_packed: "ಪ್ಯಾಕ್ ಮಾಡಲಾಗಿದೆ",
    status_waiting_for_manager_review: "ವ್ಯವಸ್ಥಾಪಕರ ವಿಮರ್ಶೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ",
    status_assigned_to_delivery_partner: "ವಿತರಣಾ ಪಾಲುದಾರರಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
    status_picked_up: "ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ",
    status_out_for_delivery: "ವಿತರಣೆಗೆ ಹೊರಗಿದೆ",
    status_delivered: "ವಿತರಿಸಲಾಗಿದೆ",
    status_cancelled: "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ"
  }
});

console.log("SellerOrders translations updated!");
