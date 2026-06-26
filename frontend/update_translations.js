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
  delivery: {
    title: "Delivery Dashboard",
    welcome_back: "Welcome back,",
    assigned: "Assigned",
    active: "Active",
    completed: "Completed",
    earnings: "Earnings",
    present_orders: "Present Orders",
    completed_orders: "Completed Orders",
    loading: "Loading your deliveries...",
    all_caught_up: "All caught up!",
    no_active: "No active or assigned deliveries.",
    no_completed: "No completed deliveries yet.",
    order_id: "Order ID",
    pickup_from: "Pickup From",
    call: "Call",
    deliver_to: "Deliver To",
    product_value: "Product Value",
    delivery_charge: "Delivery Charge to Collect",
    pick_up_order: "Pick Up Order",
    start_delivery: "Start Delivery",
    collect_payment: "Collect Payment & Deliver",
    google_maps: "Google Maps Route"
  }
});

updateDict(hiPath, {
  delivery: {
    title: "वितरण डैशबोर्ड",
    welcome_back: "वापसी पर स्वागत है,",
    assigned: "सौंपा गया",
    active: "सक्रिय",
    completed: "पूरा हुआ",
    earnings: "कमाई",
    present_orders: "वर्तमान आदेश",
    completed_orders: "पूर्ण आदेश",
    loading: "आपकी डिलीवरी लोड हो रही है...",
    all_caught_up: "सब पूरा हो गया!",
    no_active: "कोई सक्रिय या सौंपी गई डिलीवरी नहीं।",
    no_completed: "अभी तक कोई पूर्ण डिलीवरी नहीं।",
    order_id: "ऑर्डर आईडी",
    pickup_from: "यहाँ से उठाएँ",
    call: "कॉल करें",
    deliver_to: "यहाँ पहुँचाएँ",
    product_value: "उत्पाद मूल्य",
    delivery_charge: "एकत्र करने के लिए डिलीवरी शुल्क",
    pick_up_order: "ऑर्डर लें",
    start_delivery: "डिलीवरी शुरू करें",
    collect_payment: "भुगतान प्राप्त करें और वितरित करें",
    google_maps: "Google Maps मार्ग"
  }
});

updateDict(knPath, {
  delivery: {
    title: "ವಿತರಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    welcome_back: "ಮರಳಿ ಸ್ವಾಗತ,",
    assigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
    active: "ಸಕ್ರಿಯ",
    completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    earnings: "ಗಳಿಕೆಗಳು",
    present_orders: "ಪ್ರಸ್ತುತ ಆದೇಶಗಳು",
    completed_orders: "ಪೂರ್ಣಗೊಂಡ ಆದೇಶಗಳು",
    loading: "ನಿಮ್ಮ ವಿತರಣೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    all_caught_up: "ಎಲ್ಲವೂ ಮುಗಿದಿದೆ!",
    no_active: "ಯಾವುದೇ ಸಕ್ರಿಯ ಅಥವಾ ನಿಯೋಜಿಸಲಾದ ವಿತರಣೆಗಳಿಲ್ಲ.",
    no_completed: "ಇನ್ನೂ ಯಾವುದೇ ವಿತರಣೆಗಳು ಪೂರ್ಣಗೊಂಡಿಲ್ಲ.",
    order_id: "ಆದೇಶದ ಐಡಿ",
    pickup_from: "ಇಲ್ಲಿಂದ ತೆಗೆದುಕೊಳ್ಳಿ",
    call: "ಕರೆ ಮಾಡಿ",
    deliver_to: "ಇಲ್ಲಿಗೆ ತಲುಪಿಸಿ",
    product_value: "ಉತ್ಪನ್ನದ ಮೌಲ್ಯ",
    delivery_charge: "ಸಂಗ್ರಹಿಸಲು ವಿತರಣಾ ಶುಲ್ಕ",
    pick_up_order: "ಆದೇಶವನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ",
    start_delivery: "ವಿತರಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ",
    collect_payment: "ಪಾವತಿಯನ್ನು ಸಂಗ್ರಹಿಸಿ ಮತ್ತು ತಲುಪಿಸಿ",
    google_maps: "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಮಾರ್ಗ"
  }
});

console.log("Translation files updated successfully!");
