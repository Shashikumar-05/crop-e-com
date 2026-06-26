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
  add_crop: {
    login_required: "You must be logged in to add a crop",
    success_msg: "Crop successfully added!",
    fail_msg: "Failed to add crop",
    title: "Add New Listing",
    subtitle: "List your agricultural products on the marketplace.",
    crop_name: "Crop Name",
    crop_name_ph: "e.g. Organic Tomatoes",
    description: "Description",
    description_ph: "Provide details about quality, farming method, etc.",
    farm_location: "Farm Location",
    farm_location_ph: "City, Region",
    total_stock: "Total Stock Quantity",
    total_stock_ph: "e.g. 500",
    unit_label: "Measurement Unit",
    unit_kg: "Kilograms (kg)",
    unit_quintal: "Quintal",
    unit_ton: "Ton",
    price_label: "Price (₹)",
    per_unit: "per",
    crop_photo: "Crop Photograph",
    uploading: "Uploading image...",
    upload_success: "Image uploaded successfully",
    click_to_upload: "Click to upload",
    drag_and_drop: "or drag and drop",
    file_types: "PNG, JPG or WEBP (max. 5MB)",
    publish_btn: "Publish Listing"
  }
});

updateDict(hiPath, {
  add_crop: {
    login_required: "फसल जोड़ने के लिए आपको लॉग इन करना होगा",
    success_msg: "फसल सफलतापूर्वक जोड़ी गई!",
    fail_msg: "फसल जोड़ने में विफल",
    title: "नई सूची जोड़ें",
    subtitle: "अपने कृषि उत्पादों को बाज़ार में सूचीबद्ध करें।",
    crop_name: "फसल का नाम",
    crop_name_ph: "उदा. जैविक टमाटर",
    description: "विवरण",
    description_ph: "गुणवत्ता, खेती के तरीके आदि के बारे में जानकारी प्रदान करें।",
    farm_location: "खेत का स्थान",
    farm_location_ph: "शहर, क्षेत्र",
    total_stock: "कुल स्टॉक मात्रा",
    total_stock_ph: "उदा. 500",
    unit_label: "माप की इकाई",
    unit_kg: "किलोग्राम (kg)",
    unit_quintal: "क्विंटल",
    unit_ton: "टन",
    price_label: "कीमत (₹)",
    per_unit: "प्रति",
    crop_photo: "फसल की तस्वीर",
    uploading: "छवि अपलोड हो रही है...",
    upload_success: "छवि सफलतापूर्वक अपलोड की गई",
    click_to_upload: "अपलोड करने के लिए क्लिक करें",
    drag_and_drop: "या खींचें और छोड़ें",
    file_types: "PNG, JPG या WEBP (अधिकतम 5MB)",
    publish_btn: "सूची प्रकाशित करें"
  }
});

updateDict(knPath, {
  add_crop: {
    login_required: "ಬೆಳೆಯನ್ನು ಸೇರಿಸಲು ನೀವು ಲಾಗ್ ಇನ್ ಆಗಿರಬೇಕು",
    success_msg: "ಬೆಳೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!",
    fail_msg: "ಬೆಳೆಯನ್ನು ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ",
    title: "ಹೊಸ ಪಟ್ಟಿಯನ್ನು ಸೇರಿಸಿ",
    subtitle: "ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಿ.",
    crop_name: "ಬೆಳೆಯ ಹೆಸರು",
    crop_name_ph: "ಉದಾ. ಸಾವಯವ ಟೊಮ್ಯಾಟೊ",
    description: "ವಿವರಣೆ",
    description_ph: "ಗುಣಮಟ್ಟ, ಕೃಷಿ ವಿಧಾನ ಇತ್ಯಾದಿಗಳ ಬಗ್ಗೆ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.",
    farm_location: "ಕೃಷಿ ಸ್ಥಳ",
    farm_location_ph: "ನಗರ, ಪ್ರದೇಶ",
    total_stock: "ಒಟ್ಟು ಸ್ಟಾಕ್ ಪ್ರಮಾಣ",
    total_stock_ph: "ಉದಾ. 500",
    unit_label: "ಅಳತೆಯ ಘಟಕ",
    unit_kg: "ಕಿಲೋಗ್ರಾಂಗಳು (kg)",
    unit_quintal: "ಕ್ವಿಂಟಲ್",
    unit_ton: "ಟನ್",
    price_label: "ಬೆಲೆ (₹)",
    per_unit: "ಪ್ರತಿ",
    crop_photo: "ಬೆಳೆಯ ಛಾಯಾಚಿತ್ರ",
    uploading: "ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    upload_success: "ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ",
    click_to_upload: "ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    drag_and_drop: "ಅಥವಾ ಡ್ರ್ಯಾಗ್ ಮತ್ತು ಡ್ರಾಪ್ ಮಾಡಿ",
    file_types: "PNG, JPG ಅಥವಾ WEBP (ಗರಿಷ್ಠ 5MB)",
    publish_btn: "ಪಟ್ಟಿಯನ್ನು ಪ್ರಕಟಿಸಿ"
  }
});

console.log("AddCrop translations updated!");
