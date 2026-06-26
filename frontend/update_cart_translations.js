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
  cart: {
    farmer_no_order: "Farmers cannot place orders.",
    enter_address: "Please enter your delivery address:",
    address_required: "Delivery address is required to place an order",
    order_success: "Order placed successfully!",
    order_fail: "Failed to place order.",
    enquiry_success: "Enquiry sent successfully to Farmer and Manager!",
    enquiry_fail: "Failed to send enquiry.",
    confirm_clear: "Are you sure you want to clear your entire cart?",
    cart_cleared: "Cart cleared",
    empty_cart: "Your cart is empty!",
    browse_desc: "Browse fresh crops from local farmers and add them to your cart.",
    browse_btn: "Browse Fresh Crops",
    my_cart: "My Cart",
    items_in_cart: "items in your cart",
    continue_shopping: "Continue Shopping",
    verified_farmer: "Verified Farmer",
    max: "max",
    remove: "Remove",
    order_summary: "Order Summary",
    total_estimate: "Total Estimate",
    processing: "Processing...",
    place_order: "Place Order",
    enquiry: "Enquiry",
    call_manager: "Call Manager",
    whatsapp: "WhatsApp",
    clear_cart: "Clear Cart"
  }
});

updateDict(hiPath, {
  cart: {
    farmer_no_order: "किसान ऑर्डर नहीं दे सकते।",
    enter_address: "कृपया अपना वितरण पता दर्ज करें:",
    address_required: "ऑर्डर देने के लिए वितरण पता आवश्यक है",
    order_success: "ऑर्डर सफलतापूर्वक दिया गया!",
    order_fail: "ऑर्डर देने में विफल।",
    enquiry_success: "पूछताछ किसान और प्रबंधक को सफलतापूर्वक भेजी गई!",
    enquiry_fail: "पूछताछ भेजने में विफल।",
    confirm_clear: "क्या आप वाकई अपना पूरा कार्ट साफ़ करना चाहते हैं?",
    cart_cleared: "कार्ट साफ़ किया गया",
    empty_cart: "आपकी कार्ट खाली है!",
    browse_desc: "स्थानीय किसानों से ताजी फसलें ब्राउज़ करें और उन्हें अपनी कार्ट में जोड़ें।",
    browse_btn: "ताजी फसलें ब्राउज़ करें",
    my_cart: "मेरी कार्ट",
    items_in_cart: "आपकी कार्ट में आइटम",
    continue_shopping: "खरीदारी जारी रखें",
    verified_farmer: "सत्यापित किसान",
    max: "अधिकतम",
    remove: "निकालें",
    order_summary: "ऑर्डर सारांश",
    total_estimate: "कुल अनुमान",
    processing: "प्रसंस्करण...",
    place_order: "ऑर्डर दें",
    enquiry: "पूछताछ",
    call_manager: "मैनेजर को कॉल करें",
    whatsapp: "WhatsApp",
    clear_cart: "कार्ट साफ़ करें"
  }
});

updateDict(knPath, {
  cart: {
    farmer_no_order: "ರೈತರು ಆದೇಶಗಳನ್ನು ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    enter_address: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿತರಣಾ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ:",
    address_required: "ಆದೇಶವನ್ನು ನೀಡಲು ವಿತರಣಾ ವಿಳಾಸದ ಅಗತ್ಯವಿದೆ",
    order_success: "ಆದೇಶವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಇರಿಸಲಾಗಿದೆ!",
    order_fail: "ಆದೇಶವನ್ನು ನೀಡಲು ವಿಫಲವಾಗಿದೆ.",
    enquiry_success: "ವಿಚಾರಣೆಯನ್ನು ರೈತ ಮತ್ತು ವ್ಯವಸ್ಥಾಪಕರಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!",
    enquiry_fail: "ವಿಚಾರಣೆಯನ್ನು ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ.",
    confirm_clear: "ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಕಾರ್ಟ್ ಅನ್ನು ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
    cart_cleared: "ಕಾರ್ಟ್ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ",
    empty_cart: "ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ!",
    browse_desc: "ಸ್ಥಳೀಯ ರೈತರಿಂದ ತಾಜಾ ಬೆಳೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ ಮತ್ತು ಅವುಗಳನ್ನು ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ.",
    browse_btn: "ತಾಜಾ ಬೆಳೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ",
    my_cart: "ನನ್ನ ಕಾರ್ಟ್",
    items_in_cart: "ನಿಮ್ಮ ಕಾರ್ಟ್‌ನಲ್ಲಿರುವ ಐಟಂಗಳು",
    continue_shopping: "ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಿ",
    verified_farmer: "ಪರಿಶೀಲಿಸಿದ ರೈತ",
    max: "ಗರಿಷ್ಠ",
    remove: "ತೆಗೆದುಹಾಕಿ",
    order_summary: "ಆದೇಶದ ಸಾರಾಂಶ",
    total_estimate: "ಒಟ್ಟು ಅಂದಾಜು",
    processing: "ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...",
    place_order: "ಆದೇಶ ನೀಡಿ",
    enquiry: "ವಿಚಾರಣೆ",
    call_manager: "ಮ್ಯಾನೇಜರ್‌ಗೆ ಕರೆ ಮಾಡಿ",
    whatsapp: "WhatsApp",
    clear_cart: "ಕಾರ್ಟ್ ತೆರವುಗೊಳಿಸಿ"
  }
});

console.log("Cart translations updated!");
