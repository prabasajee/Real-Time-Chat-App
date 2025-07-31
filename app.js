// Real-Time Chat App Main Logic
class ChatApp {
  constructor() {
    this.currentUser = null;
    this.unsubscribeMessages = null;
    
    // Get DOM elements
    this.authSection = document.getElementById('auth-section');
    this.chatSection = document.getElementById('chat-section');
    this.loginBtn = document.getElementById('loginBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.chatBox = document.getElementById('chat-box');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message-input');
    
    this.initializeEventListeners();
    this.initializeAuth();
  }
  
  initializeEventListeners() {
    // Login button
    this.loginBtn.addEventListener('click', () => this.signIn());
    
    // Logout button
    this.logoutBtn.addEventListener('click', () => this.signOut());
    
    // Message form
    this.messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });
    
    // Enter key shortcut for sending messages
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
  
  initializeAuth() {
    // Listen for authentication state changes
    if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
      window.firebaseAuth.onAuthStateChanged((user) => {
        this.handleAuthStateChange(user);
      });
    } else {
      // Fallback for demo mode
      console.log('Running in demo mode - Firebase not configured');
      this.showDemoMode();
    }
  }
  
  handleAuthStateChange(user) {
    this.currentUser = user;
    
    if (user) {
      // User is signed in
      this.showChatInterface();
      this.loadMessages();
    } else {
      // User is signed out
      this.showAuthInterface();
      this.stopListeningToMessages();
    }
  }
  
  async signIn() {
    try {
      if (window.firebaseAuth && window.firebaseAuth.signInWithPopup && typeof firebase !== 'undefined') {
        const provider = new firebase.auth.GoogleAuthProvider();
        await window.firebaseAuth.signInWithPopup(provider);
      } else {
        // Demo mode fallback
        this.simulateDemoUser();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // In demo mode, try to simulate user instead of showing error
      if (error.message.includes('firebase is not defined')) {
        this.simulateDemoUser();
      } else {
        this.showError('Failed to sign in. Please try again.');
      }
    }
  }
  
  async signOut() {
    try {
      if (window.firebaseAuth && window.firebaseAuth.signOut && typeof firebase !== 'undefined') {
        await window.firebaseAuth.signOut();
      } else {
        // Demo mode fallback - manually trigger sign out
        this.currentUser = null;
        this.handleAuthStateChange(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // In demo mode, force sign out
      if (error.message.includes('Firebase not properly configured')) {
        this.currentUser = null;
        this.handleAuthStateChange(null);
      } else {
        this.showError('Failed to sign out. Please try again.');
      }
    }
  }
  
  showAuthInterface() {
    this.authSection.style.display = 'block';
    this.chatSection.style.display = 'none';
    this.loginBtn.style.display = 'inline-block';
    this.logoutBtn.style.display = 'none';
  }
  
  showChatInterface() {
    this.authSection.style.display = 'block';
    this.chatSection.style.display = 'block';
    this.loginBtn.style.display = 'none';
    this.logoutBtn.style.display = 'inline-block';
    this.messageInput.focus();
  }
  
  loadMessages() {
    if (window.firebaseDB && window.firebaseDB.collection) {
      try {
        this.unsubscribeMessages = window.firebaseDB
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .onSnapshot((snapshot) => {
            this.displayMessages(snapshot);
          });
      } catch (error) {
        console.error('Error loading messages:', error);
        this.showDemoMessages();
      }
    } else {
      this.showDemoMessages();
    }
  }
  
  stopListeningToMessages() {
    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
      this.unsubscribeMessages = null;
    }
    this.chatBox.innerHTML = '';
  }
  
  displayMessages(snapshot) {
    this.chatBox.innerHTML = '';
    
    snapshot.forEach((doc) => {
      const message = doc.data();
      this.addMessageToChat(message);
    });
    
    this.scrollToBottom();
  }
  
  async sendMessage() {
    const messageText = this.messageInput.value.trim();
    
    if (!messageText) return;
    
    if (!this.currentUser) {
      this.showError('Please sign in to send messages.');
      return;
    }
    
    const messageData = {
      text: messageText,
      uid: this.currentUser.uid,
      displayName: this.currentUser.displayName || 'Anonymous',
      photoURL: this.currentUser.photoURL || '',
      timestamp: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
    };
    
    try {
      if (window.firebaseDB && window.firebaseDB.collection) {
        await window.firebaseDB.collection('messages').add(messageData);
      } else {
        // Demo mode - add message directly to chat
        messageData.timestamp = new Date();
        this.addMessageToChat(messageData);
        this.scrollToBottom();
      }
      
      this.messageInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message. Please try again.');
    }
  }
  
  addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const isOwnMessage = this.currentUser && message.uid === this.currentUser.uid;
    messageElement.classList.add(isOwnMessage ? 'own' : 'other');
    
    const timestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="message-text">${this.escapeHtml(message.text)}</div>
      <div class="message-info">
        ${isOwnMessage ? 'You' : message.displayName} • ${timeString}
      </div>
    `;
    
    this.chatBox.appendChild(messageElement);
  }
  
  scrollToBottom() {
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
  
  // Demo mode functions
  simulateDemoUser() {
    this.currentUser = {
      uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      displayName: 'Demo User',
      photoURL: ''
    };
    this.handleAuthStateChange(this.currentUser);
  }
  
  showDemoMode() {
    const demoNotice = document.createElement('div');
    demoNotice.innerHTML = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
        <strong>Demo Mode:</strong> Firebase not configured. You can still test the chat interface!
      </div>
    `;
    this.authSection.parentNode.insertBefore(demoNotice, this.authSection);
    
    // Auto-login in demo mode
    setTimeout(() => {
      this.simulateDemoUser();
    }, 1000);
  }
  
  showDemoMessages() {
    // Add some demo messages to show the interface
    const demoMessages = [
      {
        text: "Welcome to the Real-Time Chat App! 🎉",
        uid: 'demo-system',
        displayName: 'System',
        timestamp: new Date(Date.now() - 60000)
      },
      {
        text: "This is a demo message from another user.",
        uid: 'demo-other',
        displayName: 'Other User',
        timestamp: new Date(Date.now() - 30000)
      }
    ];
    
    demoMessages.forEach(message => {
      this.addMessageToChat(message);
    });
    
    this.scrollToBottom();
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const chatApp = new ChatApp();
});