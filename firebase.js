// Firebase configuration
const firebaseConfig = {
  // Note: These are demo/example values for development
  // In production, use your actual Firebase project credentials
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
let app, auth, db;

try {
  // Initialize Firebase App
  app = firebase.initializeApp(firebaseConfig);
  
  // Initialize Firebase Auth
  auth = firebase.auth();
  
  // Initialize Firestore
  db = firebase.firestore();
  
  console.log('Firebase initialized successfully');
  
  // Configure Firestore settings
  db.settings({
    timestampsInSnapshots: true
  });
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // Create mock objects for development/demo purposes
  auth = {
    currentUser: null,
    signInWithPopup: () => Promise.reject(new Error('Firebase not properly configured')),
    signOut: () => Promise.resolve(), // Allow sign out to succeed in demo mode
    onAuthStateChanged: (callback) => {
      console.warn('Firebase Auth not configured - using demo mode');
      // Simulate logged out state
      callback(null);
    }
  };
  
  db = {
    collection: () => ({
      add: () => Promise.resolve({ id: 'demo-message-' + Date.now() }),
      orderBy: () => ({
        onSnapshot: (callback) => {
          console.warn('Firebase Firestore not configured - using demo mode');
          // Call callback with empty snapshot initially
          const mockSnapshot = {
            forEach: (fn) => {} // Empty snapshot
          };
          callback(mockSnapshot);
          return () => {}; // Return unsubscribe function
        }
      })
    })
  };
}

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;