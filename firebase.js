// Firebase Configuration
// SECURITY: Never commit real credentials to version control!
// This script safely loads configuration from secure sources

// Load configuration using the secure config loader
const firebaseConfig = ConfigLoader.loadFirebaseConfig();

// Validate configuration
const validation = ConfigLoader.validateConfig(firebaseConfig);
ConfigLoader.displayConfigStatus(validation);

// Initialize Firebase only if configuration is valid
if (validation.isValid) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
    }
} else {
    console.error('❌ Cannot initialize Firebase - configuration incomplete');
    console.log('📖 Please check README.md for setup instructions');
}

// Initialize Firebase services (with error handling)
let auth, firestore, googleProvider;

try {
    auth = firebase.auth();
    firestore = firebase.firestore();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    
    // Configure Google provider
    googleProvider.setCustomParameters({
        prompt: 'select_account'
    });
    
} catch (error) {
    console.error('❌ Failed to initialize Firebase services:', error.message);
}
