// Firebase Configuration Template
// INSTRUCTIONS:
// 1. Copy this file and rename it to 'firebase-config.js'
// 2. Replace the placeholder values with your actual Firebase credentials
// 3. Add 'firebase-config.js' to your .gitignore file
// 4. Import this config in firebase.js instead of hardcoded values

const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY_HERE",
    authDomain: "your-project-name.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-name.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
} else {
    window.firebaseConfig = firebaseConfig;
}
