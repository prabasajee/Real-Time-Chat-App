// Secure Configuration Loader
// This script safely loads Firebase configuration from multiple sources

class ConfigLoader {
    static loadFirebaseConfig() {
        // Try to load from external config file first (if exists)
        if (typeof window !== 'undefined' && window.firebaseConfig) {
            console.log('✅ Loading Firebase config from external file');
            return window.firebaseConfig;
        }

        // Fallback to environment variables or defaults
        const config = {
            apiKey: this.getConfigValue('FIREBASE_API_KEY', 'demo-api-key'),
            authDomain: this.getConfigValue('FIREBASE_AUTH_DOMAIN', 'demo-project.firebaseapp.com'),
            projectId: this.getConfigValue('FIREBASE_PROJECT_ID', 'demo-project-id'),
            storageBucket: this.getConfigValue('FIREBASE_STORAGE_BUCKET', 'demo-project.appspot.com'),
            messagingSenderId: this.getConfigValue('FIREBASE_MESSAGING_SENDER_ID', '123456789'),
            appId: this.getConfigValue('FIREBASE_APP_ID', 'demo-app-id')
        };

        return config;
    }

    static getConfigValue(envKey, defaultValue) {
        // In browser environment, check for global variables
        if (typeof window !== 'undefined') {
            return window[envKey] || defaultValue;
        }
        
        // In Node.js environment, check process.env
        if (typeof process !== 'undefined' && process.env) {
            return process.env[envKey] || defaultValue;
        }

        return defaultValue;
    }

    static validateConfig(config) {
        const requiredFields = ['apiKey', 'authDomain', 'projectId'];
        const issues = [];

        for (const field of requiredFields) {
            if (!config[field]) {
                issues.push(`Missing ${field}`);
            } else if (config[field].startsWith('demo-')) {
                issues.push(`${field} is using demo value`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    static displayConfigStatus(validation) {
        if (validation.isValid) {
            console.log('✅ Firebase configuration is valid');
        } else {
            console.warn('⚠️ Firebase configuration issues:');
            validation.issues.forEach(issue => console.warn(`  - ${issue}`));
            console.warn('📖 Check README.md for setup instructions');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
} else {
    window.ConfigLoader = ConfigLoader;
}
