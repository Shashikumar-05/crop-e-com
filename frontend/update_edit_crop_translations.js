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
  edit_crop: {
    loading: "Loading crop details...",
    load_fail: "Failed to load crop details",
    login_required: "You must be logged in to edit a crop",
    success_msg: "Crop successfully updated!",
    fail_msg: "Failed to update crop",
    title: "Edit Listing",
    subtitle: "Update your agricultural product listing.",
    save: "Save Changes",
    cancel: "Cancel"
  }
});

updateDict(hiPath, {
  edit_crop: {
    loading: "फसल का विवरण लोड हो रहा है...",
    load_fail: "फसल विवरण लोड करने में विफल",
    login_required: "फसल संपादित करने के लिए आपको लॉग इन करना होगा",
    success_msg: "फसल सफलतापूर्वक अपडेट की गई!",
    fail_msg: "फसल अपडेट करने में विफल",
    title: "सूची संपादित करें",
    subtitle: "अपनी कृषि उत्पाद सूची को अपडेट करें।",
    save: "परिवर्तन सहेजें",
    cancel: "रद्द करें"
  }
});

updateDict(knPath, {
  edit_crop: {
    loading: "ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    load_fail: "ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ",
    login_required: "ಬೆಳೆಯನ್ನು ಸಂಪಾದಿಸಲು ನೀವು ಲಾಗ್ ಇನ್ ಆಗಿರಬೇಕು",
    success_msg: "ಬೆಳೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    fail_msg: "ಬೆಳೆಯನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ",
    title: "ಪಟ್ಟಿಯನ್ನು ಸಂಪಾದಿಸಿ",
    subtitle: "ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನ ಪಟ್ಟಿಯನ್ನು ನವೀಕರಿಸಿ.",
    save: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    cancel: "ರದ್ದುಗೊಳಿಸಿ"
  }
});

console.log("EditCrop translations updated!");
