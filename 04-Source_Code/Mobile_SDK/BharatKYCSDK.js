/**
 * Bharat KYC SDK - Main Entry Point
 * Lightweight KYC solution for rural India
 */

class BharatKYCSDK {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || 'https://api.bharatkyc.com',
      language: config.language || 'hi-IN',
      enableVoice: config.enableVoice || true,
      enableOffline: config.enableOffline || true,
      ...config
    };

    this.modules = new Map();
    this.loadedModules = new Set();
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the SDK
   */
  async initialize() {
    try {
      console.log('Initializing Bharat KYC SDK...');
      
      // Load core modules
      await this.loadModule('core');
      await this.loadModule('storage');
      
      // Initialize offline storage if enabled
      if (this.config.enableOffline) {
        await this.loadModule('offline');
        await this.modules.get('offline').initialize();
      }

      // Initialize voice guidance if enabled
      if (this.config.enableVoice) {
        await this.loadModule('voice');
        await this.modules.get('voice').initialize(this.config.language);
      }

      this.isInitialized = true;
      console.log('Bharat KYC SDK initialized successfully');
      
      this.emit('initialized', { success: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Load a module dynamically
   */
  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    try {
      const module = await import(`./modules/${moduleName}.js`);
      this.modules.set(moduleName, module.default);
      this.loadedModules.add(moduleName);
      return module.default;
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Start KYC process
   */
  async startKYC(options = {}) {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      const kycModule = await this.loadModule('kyc');
      return await kycModule.startKYCProcess(options);
    } catch (error) {
      console.error('KYC process failed:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Capture document
   */
  async captureDocument(documentType, options = {}) {
    try {
      const documentModule = await this.loadModule('document');
      return await documentModule.capture(documentType, options);
    } catch (error) {
      console.error('Document capture failed:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform face authentication
   */
  async authenticateFace(options = {}) {
    try {
      const faceModule = await this.loadModule('face');
      return await faceModule.authenticate(options);
    } catch (error) {
      console.error('Face authentication failed:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Submit KYC data
   */
  async submitKYC(data) {
    try {
      const submitModule = await this.loadModule('submit');
      return await submitModule.submit(data);
    } catch (error) {
      console.error('KYC submission failed:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get KYC status
   */
  async getKYCStatus(referenceId) {
    try {
      const statusModule = await this.loadModule('status');
      return await statusModule.getStatus(referenceId);
    } catch (error) {
      console.error('Failed to get KYC status:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Event handling
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }

  /**
   * Get SDK information
   */
  getInfo() {
    return {
      version: '1.0.0',
      name: 'Bharat KYC SDK',
      loadedModules: Array.from(this.loadedModules),
      config: this.config,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Cleanup resources
   */
  async destroy() {
    try {
      // Cleanup modules
      for (const [name, module] of this.modules) {
        if (module.destroy) {
          await module.destroy();
        }
      }

      // Clear event listeners
      this.eventListeners.clear();

      // Reset state
      this.modules.clear();
      this.loadedModules.clear();
      this.isInitialized = false;

      console.log('Bharat KYC SDK destroyed');
    } catch (error) {
      console.error('Error during SDK destruction:', error);
      throw error;
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BharatKYCSDK;
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return BharatKYCSDK; });
} else if (typeof window !== 'undefined') {
  window.BharatKYCSDK = BharatKYCSDK;
}
