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
  sidebar: {
    my_shifts: "My Shifts",
    assigned_orders: "Assigned Orders",
    order_history: "Order History",
    earnings: "Earnings",
    ai_advisor: "AI Advisor",
    profile: "Profile",
    dashboard: "Dashboard",
    add_product: "Add Product",
    new_orders: "New Orders",
    revenue: "Revenue",
    home: "Home",
    my_orders: "My Orders",
    cart: "Cart",
    control_desk: "Control Desk",
    live_fleet_tracking: "Live Fleet Tracking",
    sales_transactions: "Sales / Transactions",
    approvals: "Approvals",
    guest: "Guest",
    seller: "Seller",
    rider_partner: "Rider Partner",
    customer: "Customer",
    hub_manager: "Hub Manager",
    user: "User",
    guest_user: "Guest User",
    please_login: "Please login to access features",
    sign_out: "Sign Out",
    no_contact_info: "No contact info"
  }
});

updateDict(hiPath, {
  sidebar: {
    my_shifts: "मेरी शिफ्ट",
    assigned_orders: "सौंपे गए आदेश",
    order_history: "आदेश इतिहास",
    earnings: "कमाई",
    ai_advisor: "AI सलाहकार",
    profile: "प्रोफ़ाइल",
    dashboard: "डैशबोर्ड",
    add_product: "उत्पाद जोड़ें",
    new_orders: "नए आदेश",
    revenue: "राजस्व",
    home: "होम",
    my_orders: "मेरे आदेश",
    cart: "कार्ट",
    control_desk: "नियंत्रण डेस्क",
    live_fleet_tracking: "लाइव फ्लीट ट्रैकिंग",
    sales_transactions: "बिक्री / लेनदेन",
    approvals: "स्वीकृतियां",
    guest: "अतिथि",
    seller: "विक्रेता",
    rider_partner: "राइडर पार्टनर",
    customer: "ग्राहक",
    hub_manager: "हब मैनेजर",
    user: "उपयोगकर्ता",
    guest_user: "अतिथि उपयोगकर्ता",
    please_login: "सुविधाओं तक पहुंचने के लिए कृपया लॉगिन करें",
    sign_out: "साइन आउट",
    no_contact_info: "संपर्क जानकारी नहीं है"
  }
});

updateDict(knPath, {
  sidebar: {
    my_shifts: "ನನ್ನ ಪಾಳಿಗಳು",
    assigned_orders: "ನಿಯೋಜಿಸಲಾದ ಆದೇಶಗಳು",
    order_history: "ಆದೇಶದ ಇತಿಹಾಸ",
    earnings: "ಗಳಿಕೆಗಳು",
    ai_advisor: "AI ಸಲಹೆಗಾರ",
    profile: "ಪ್ರೊಫೈಲ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    add_product: "ಉತ್ಪನ್ನ ಸೇರಿಸಿ",
    new_orders: "ಹೊಸ ಆದೇಶಗಳು",
    revenue: "ಆದಾಯ",
    home: "ಮನೆ",
    my_orders: "ನನ್ನ ಆದೇಶಗಳು",
    cart: "ಕಾರ್ಟ್",
    control_desk: "ನಿಯಂತ್ರಣ ಡೆಸ್ಕ್",
    live_fleet_tracking: "ಲೈವ್ ಫ್ಲೀಟ್ ಟ್ರ್ಯಾಕಿಂಗ್",
    sales_transactions: "ಮಾರಾಟ / ವಹಿವಾಟುಗಳು",
    approvals: "ಅನುಮೋದನೆಗಳು",
    guest: "ಅತಿಥಿ",
    seller: "ಮಾರಾಟಗಾರ",
    rider_partner: "ರೈಡರ್ ಪಾಲುದಾರ",
    customer: "ಗ್ರಾಹಕ",
    hub_manager: "ಹಬ್ ಮ್ಯಾನೇಜರ್",
    user: "ಬಳಕೆದಾರ",
    guest_user: "ಅತಿಥಿ ಬಳಕೆದಾರ",
    please_login: "ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಪ್ರವೇಶಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ",
    sign_out: "ಸೈನ್ ಔಟ್",
    no_contact_info: "ಯಾವುದೇ ಸಂಪರ್ಕ ಮಾಹಿತಿ ಇಲ್ಲ"
  }
});

console.log("Sidebar translations updated!");
