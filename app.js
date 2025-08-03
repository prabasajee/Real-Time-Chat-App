// Chat Application with Voice Messages
class VoiceChatApp {
    constructor() {
        this.currentUser = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingStartTime = 0;
        this.recognition = null;
        this.transcript = '';
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.checkAuthState();
    }

    initializeElements() {
        // Auth elements
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.authSection = document.getElementById('auth-section');
        this.chatSection = document.getElementById('chat-section');
        
        // Chat elements
        this.chatBox = document.getElementById('chat-box');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        
        // Voice elements
        this.voiceRecordBtn = document.getElementById('voice-record-btn');
        this.recordingModal = document.getElementById('recording-modal');
        this.recordingTimer = document.getElementById('recording-timer');
        this.recordingWaveform = document.getElementById('recording-waveform');
        this.cancelRecordingBtn = document.getElementById('cancel-recording');
        this.sendVoiceBtn = document.getElementById('send-voice');
    }

    setupEventListeners() {
        // Auth listeners
        this.loginBtn.addEventListener('click', () => this.signInWithGoogle());
        this.logoutBtn.addEventListener('click', () => this.signOut());
        
        // Message listeners
        this.messageForm.addEventListener('submit', (e) => this.sendTextMessage(e));
        
        // Voice listeners
        this.voiceRecordBtn.addEventListener('click', () => this.toggleRecording());
        this.cancelRecordingBtn.addEventListener('click', () => this.cancelRecording());
        this.sendVoiceBtn.addEventListener('click', () => this.sendVoiceMessage());
        
        // Modal listeners
        this.recordingModal.addEventListener('click', (e) => {
            if (e.target === this.recordingModal) {
                this.cancelRecording();
            }
        });
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                this.transcript = finalTranscript;
            };
        }
    }

    checkAuthState() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showChatInterface();
                this.loadMessages();
            } else {
                this.currentUser = null;
                this.showAuthInterface();
            }
        });
    }

    async signInWithGoogle() {
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error) {
            console.error('Error signing in:', error);
            alert('Failed to sign in. Please try again.');
        }
    }

    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    showAuthInterface() {
        this.authSection.style.display = 'block';
        this.chatSection.style.display = 'none';
        this.loginBtn.style.display = 'inline-block';
        this.logoutBtn.style.display = 'none';
    }

    showChatInterface() {
        this.authSection.style.display = 'none';
        this.chatSection.style.display = 'block';
        this.loginBtn.style.display = 'none';
        this.logoutBtn.style.display = 'inline-block';
    }

    async sendTextMessage(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        if (!message || !this.currentUser) return;

        try {
            await firestore.collection('messages').add({
                text: message,
                type: 'text',
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.transcript = '';

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Start speech recognition
            if (this.recognition) {
                this.recognition.start();
            }

            // UI Updates
            this.voiceRecordBtn.classList.add('recording');
            this.recordingModal.classList.add('active');
            this.generateRecordingWaveform();
            this.startRecordingTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop speech recognition
            if (this.recognition) {
                this.recognition.stop();
            }

            // UI Updates
            this.voiceRecordBtn.classList.remove('recording');
            this.stopRecordingTimer();
        }
    }

    cancelRecording() {
        this.stopRecording();
        this.audioChunks = [];
        this.transcript = '';
        this.recordingModal.classList.remove('active');
    }

    async sendVoiceMessage() {
        if (this.audioChunks.length === 0) return;

        try {
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

            // Upload audio blob to Firebase Storage
            const storageRef = firebase.storage().ref();
            const fileName = `voiceMessages/${this.currentUser.uid}_${Date.now()}.wav`;
            const audioFileRef = storageRef.child(fileName);
            await audioFileRef.put(audioBlob);
            const audioUrl = await audioFileRef.getDownloadURL();
            // Calculate duration
            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

            // Send to Firestore
            await firestore.collection('messages').add({
                type: 'voice',
                audioUrl: audioUrl,
                duration: duration,
                transcript: this.transcript || 'Voice message',
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName,
                photoURL: this.currentUser.photoURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reset
            this.audioChunks = [];
            this.transcript = '';
            this.recordingModal.classList.remove('active');

        } catch (error) {
            console.error('Error sending voice message:', error);
        }
    }

    startRecordingTimer() {
        this.recordingTimer.textContent = '00:00';
        this.recordingTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.recordingTimer.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
        }
    }

    generateRecordingWaveform() {
        // Generate animated waveform
        this.recordingWaveform.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'recording-bar';
            bar.style.height = '10px';
            this.recordingWaveform.appendChild(bar);
        }

        // Animate waveform
        if (this.isRecording) {
            this.waveformInterval = setInterval(() => {
                const bars = this.recordingWaveform.querySelectorAll('.recording-bar');
                bars.forEach(bar => {
                    const height = Math.random() * 50 + 10;
                    bar.style.height = `${height}px`;
                });
            }, 100);
        }
    }

    loadMessages() {
        firestore.collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                this.chatBox.innerHTML = '';
                snapshot.forEach((doc) => {
                    const message = doc.data();
                    this.displayMessage(message);
                });
                this.chatBox.scrollTop = this.chatBox.scrollHeight;
            });
    }

    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.uid === this.currentUser.uid ? 'own' : 'other'}`;

        if (message.type === 'voice') {
            messageDiv.innerHTML = this.createVoiceMessageHTML(message);
        } else {
            messageDiv.innerHTML = `
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-info">
                    ${message.displayName} • ${this.formatTime(message.timestamp)}
                </div>
            `;
        }

        messageDiv.classList.add('fade-in');
        this.chatBox.appendChild(messageDiv);
    }

    createVoiceMessageHTML(message) {
        const waveformBars = Array.from({length: 15}, () => 
            `<div class="waveform-bar" style="height: ${Math.random() * 20 + 5}px"></div>`
        ).join('');

        return `
            <div class="voice-message ${message.uid === this.currentUser.uid ? 'own' : 'other'}">
                <button class="voice-play-btn" data-audio-url="${message.audioUrl}">
                    ▶️
                </button>
                <div class="voice-waveform">${waveformBars}</div>
                <div class="voice-duration">${this.formatDuration(message.duration)}</div>
            </div>
            ${message.transcript ? `<div class="voice-transcript">"${message.transcript}"</div>` : ''}
            <div class="message-info">
                ${message.displayName} • ${this.formatTime(message.timestamp)}
            </div>
        `;
    }

    async playVoiceMessage(audioUrl, button) {
        try {
            const audio = new Audio(audioUrl);
            const waveform = button.parentElement.querySelector('.voice-waveform');
            const bars = waveform.querySelectorAll('.waveform-bar');
            
            button.textContent = '⏸️';
            button.disabled = true;

            // Animate waveform during playback
            const animateWaveform = () => {
                bars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.classList.add('active');
                        setTimeout(() => bar.classList.remove('active'), 200);
                    }, index * 100);
                });
            };

            const waveformInterval = setInterval(animateWaveform, 300);

            audio.onended = () => {
                button.textContent = '▶️';
                button.disabled = false;
                clearInterval(waveformInterval);
                bars.forEach(bar => bar.classList.remove('active'));
            };

            await audio.play();
        } catch (error) {
            console.error('Error playing voice message:', error);
            button.textContent = '▶️';
            button.disabled = false;
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return 'now';
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VoiceChatApp();
});
