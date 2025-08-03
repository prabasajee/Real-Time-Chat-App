// Firebase Configuration
// SECURITY: Never commit real credentials to version control!
// Use environment variables or a secure config file

const firebaseConfig = {
    // Option 1: Use environment variables (recommended for production)
    apiKey: process.env.FIREBASE_API_KEY || "demo-api-key-replace-with-real",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "demo-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "demo-app-id"
    
    // Option 2: For client-side apps, create a separate config.js file
    // and add it to .gitignore - see instructions in README.md
};

// Validate configuration before initializing
function validateFirebaseConfig() {
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter(field => 
        !firebaseConfig[field] || firebaseConfig[field].startsWith('demo-')
    );
    
    if (missingFields.length > 0) {
        console.warn('⚠️ Firebase configuration incomplete!');
        console.warn('Missing or demo values for:', missingFields);
        console.warn('Please check README.md for setup instructions');
        return false;
    }
    return true;
}

// Initialize Firebase only if configuration is valid
if (validateFirebaseConfig()) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} else {
    console.error('❌ Firebase initialization failed - check configuration');
}

// Initialize Firebase services
const auth = firebase.auth();
const firestore = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
