// Real-Time Chat App JavaScript
class ChatApp {
  constructor() {
    this.currentUser = null;
    this.messagesCollection = db.collection('messages');
    this.unsubscribe = null;
    
    this.initializeElements();
    this.attachEventListeners();
    this.setupAuthStateListener();
  }

  initializeElements() {
    // DOM elements
    this.loginBtn = document.getElementById('loginBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.authSection = document.getElementById('auth-section');
    this.chatSection = document.getElementById('chat-section');
    this.chatBox = document.getElementById('chat-box');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message-input');
  }

  attachEventListeners() {
    // Authentication event listeners
    this.loginBtn.addEventListener('click', () => this.signInWithGoogle());
    this.logoutBtn.addEventListener('click', () => this.signOut());
    
    // Message form event listener
    this.messageForm.addEventListener('submit', (e) => this.sendMessage(e));
    
    // Enter key shortcut for sending messages
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(e);
      }
    });
  }

  setupAuthStateListener() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        this.showChatInterface();
        this.loadMessages();
        this.showUserStatus(`Signed in as ${user.displayName}`);
      } else {
        this.currentUser = null;
        this.showAuthInterface();
        this.clearMessages();
      }
    });
  }

  async signInWithGoogle() {
    try {
      this.showLoading(this.loginBtn, 'Signing in...');
      const result = await auth.signInWithPopup(googleProvider);
      console.log('User signed in:', result.user.displayName);
    } catch (error) {
      console.error('Error signing in:', error);
      this.showError('Failed to sign in. Please try again.');
    } finally {
      this.hideLoading(this.loginBtn, 'Sign In with Google');
    }
  }

  async signOut() {
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
      await auth.signOut();
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      this.showError('Failed to sign out. Please try again.');
    }
  }

  showChatInterface() {
    this.authSection.style.display = 'none';
    this.chatSection.style.display = 'flex';
    this.logoutBtn.style.display = 'inline-block';
    this.messageInput.focus();
  }

  showAuthInterface() {
    this.authSection.style.display = 'block';
    this.chatSection.style.display = 'none';
    this.logoutBtn.style.display = 'none';
  }

  async sendMessage(e) {
    e.preventDefault();
    
    const messageText = this.messageInput.value.trim();
    if (!messageText || !this.currentUser) return;

    try {
      const submitButton = this.messageForm.querySelector('button[type="submit"]');
      this.showLoading(submitButton, 'Sending...');
      
      await this.messagesCollection.add({
        text: messageText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: this.currentUser.uid,
        userName: this.currentUser.displayName,
        userPhoto: this.currentUser.photoURL
      });
      
      this.messageInput.value = '';
      this.messageInput.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message. Please try again.');
    } finally {
      const submitButton = this.messageForm.querySelector('button[type="submit"]');
      this.hideLoading(submitButton, 'Send');
    }
  }

  loadMessages() {
    // Unsubscribe from previous listener if exists
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Listen to messages in real-time
    this.unsubscribe = this.messagesCollection
      .orderBy('createdAt', 'asc')
      .limit(50)
      .onSnapshot((snapshot) => {
        this.clearMessages();
        
        snapshot.forEach((doc) => {
          const message = doc.data();
          this.displayMessage(message);
        });
        
        this.scrollToBottom();
      }, (error) => {
        console.error('Error loading messages:', error);
        this.showError('Failed to load messages.');
      });
  }

  displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.userId === this.currentUser.uid ? 'own' : 'other'}`;
    
    const timestamp = message.createdAt ? 
      message.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
      'Sending...';
    
    messageDiv.innerHTML = `
      <div class="message-info">
        ${message.userName} • ${timestamp}
      </div>
      <div class="message-text">${this.escapeHtml(message.text)}</div>
    `;
    
    this.chatBox.appendChild(messageDiv);
  }

  clearMessages() {
    this.chatBox.innerHTML = '';
  }

  scrollToBottom() {
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  showUserStatus(message) {
    const existingStatus = document.querySelector('.user-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'user-status';
    statusDiv.textContent = message;
    this.chatSection.insertBefore(statusDiv, this.chatBox);
    
    // Remove status after 3 seconds
    setTimeout(() => {
      if (statusDiv.parentNode) {
        statusDiv.remove();
      }
    }, 3000);
  }

  showError(message) {
    // Simple error display - in a real app, you might want a more sophisticated notification system
    alert('Error: ' + message);
  }

  showLoading(button, loadingText) {
    button.disabled = true;
    button.innerHTML = `<span class="loading"></span> ${loadingText}`;
  }

  hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the chat app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase is not loaded. Please check your Firebase configuration.');
    document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Error: Firebase not loaded</h1><p>Please check your Firebase configuration and try again.</p></div>';
    return;
  }
  
  // Initialize the chat app
  new ChatApp();
});

// Handle page visibility change to manage real-time updates
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Re-focus message input when page becomes visible
    const messageInput = document.getElementById('message-input');
    if (messageInput && auth.currentUser) {
      setTimeout(() => messageInput.focus(), 100);
    }
  }
});