/**
 * Voice-Guided Interface Module
 * Provides multilingual voice instructions and feedback
 */

class VoiceGuidance {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.language = 'hi-IN';
    this.isListening = false;
    this.isSpeaking = false;
    this.voiceQueue = [];
    this.recognitionInstance = null;
    this.availableVoices = [];
    this.currentUtterance = null;
  }

  /**
   * Initialize voice guidance system
   */
  async initialize(language = 'hi-IN') {
    try {
      this.language = language;
      
      // Wait for voices to load
      await this.loadVoices();
      
      // Initialize speech recognition
      this.initializeSpeechRecognition();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Voice guidance system initialized');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize voice guidance:', error);
      throw error;
    }
  }

  /**
   * Load available voices
   */
  async loadVoices() {
    return new Promise((resolve) => {
      if (this.speechSynthesis.getVoices().length > 0) {
        this.availableVoices = this.speechSynthesis.getVoices();
        resolve();
      } else {
        this.speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = this.speechSynthesis.getVoices();
          resolve();
        };
      }
    });
  }

  /**
   * Initialize speech recognition
   */
  initializeSpeechRecognition() {
    if (!this.speechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognitionInstance = new this.speechRecognition();
    this.recognitionInstance.continuous = false;
    this.recognitionInstance.interimResults = false;
    this.recognitionInstance.lang = this.language;
    
    this.recognitionInstance.onstart = () => {
      this.isListening = true;
      this.emit('listeningStarted');
    };
    
    this.recognitionInstance.onend = () => {
      this.isListening = false;
      this.emit('listeningEnded');
    };
    
    this.recognitionInstance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      this.emit('speechRecognized', { transcript, confidence });
    };
    
    this.recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.emit('recognitionError', { error: event.error });
    };
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for document guidance events
    document.addEventListener('documentGuidance', (event) => {
      const { suggestion } = event.detail;
      this.speakInstructions(suggestion);
    });
    
    // Listen for KYC step changes
    document.addEventListener('kycStepChanged', (event) => {
      const { step, instructions } = event.detail;
      this.speakInstructions(this.getStepInstructions(step, instructions));
    });
  }

  /**
   * Speak instructions
   */
  speakInstructions(text, options = {}) {
    try {
      // Cancel any current speech
      if (this.isSpeaking) {
        this.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.lang = this.language;
      utterance.rate = options.rate || 0.8; // Slower for clarity
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      
      // Select appropriate voice
      const voice = this.selectVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      // Set up event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.emit('speakingStarted', { text });
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.emit('speakingEnded', { text });
        
        // Process next item in queue
        this.processVoiceQueue();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isSpeaking = false;
        this.emit('speakingError', { error: event.error, text });
      };
      
      // Add to queue if already speaking
      if (this.isSpeaking) {
        this.voiceQueue.push({ utterance, options });
      } else {
        this.currentUtterance = utterance;
        this.speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Failed to speak instructions:', error);
      this.emit('speakingError', { error: error.message });
    }
  }

  /**
   * Select appropriate voice for language
   */
  selectVoice() {
    const voices = this.availableVoices.filter(voice => 
      voice.lang.startsWith(this.language.split('-')[0])
    );
    
    if (voices.length === 0) {
      return null;
    }
    
    // Prefer female voices for better clarity
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman')
    );
    
    return femaleVoice || voices[0];
  }

  /**
   * Process voice queue
   */
  processVoiceQueue() {
    if (this.voiceQueue.length > 0 && !this.isSpeaking) {
      const { utterance, options } = this.voiceQueue.shift();
      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening() {
    if (!this.recognitionInstance) {
      throw new Error('Speech recognition not available');
    }
    
    try {
      this.recognitionInstance.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (this.recognitionInstance && this.isListening) {
      this.recognitionInstance.stop();
    }
  }

  /**
   * Get step-specific instructions
   */
  getStepInstructions(step, customInstructions = null) {
    const instructions = {
      'welcome': this.getLocalizedMessage('welcome_instructions'),
      'language_selection': this.getLocalizedMessage('select_language'),
      'method_selection': this.getLocalizedMessage('choose_method'),
      'document_capture': this.getLocalizedMessage('capture_document'),
      'face_authentication': this.getLocalizedMessage('face_verification'),
      'review_submit': this.getLocalizedMessage('review_information'),
      'success': this.getLocalizedMessage('kyc_completed'),
      'error': this.getLocalizedMessage('try_again')
    };
    
    return customInstructions || instructions[step] || this.getLocalizedMessage('continue');
  }

  /**
   * Get localized message
   */
  getLocalizedMessage(key) {
    const messages = {
      'hi-IN': {
        'welcome_instructions': 'स्वागत है! आपका KYC प्रक्रिया शुरू करने के लिए तैयार है',
        'select_language': 'अपनी पसंदीदा भाषा चुनें',
        'choose_method': 'KYC के लिए अपना पसंदीदा तरीका चुनें',
        'capture_document': 'अपना दस्तावेज़ कैमरे के सामने रखें',
        'face_verification': 'कैमरे की तरफ देखें और अपना चेहरा स्थिर रखें',
        'review_information': 'अपनी जानकारी की जांच करें और सबमिट करें',
        'kyc_completed': 'आपका KYC सफलतापूर्वक पूरा हो गया है',
        'try_again': 'कृपया फिर से कोशिश करें',
        'continue': 'जारी रखने के लिए कहें',
        'retry': 'फिर से कोशिश करने के लिए कहें',
        'back': 'वापस जाने के लिए कहें',
        'help': 'मदद के लिए कहें'
      },
      'en-US': {
        'welcome_instructions': 'Welcome! Ready to start your KYC process',
        'select_language': 'Choose your preferred language',
        'choose_method': 'Choose your preferred KYC method',
        'capture_document': 'Place your document in front of the camera',
        'face_verification': 'Look at the camera and keep your face steady',
        'review_information': 'Review your information and submit',
        'kyc_completed': 'Your KYC has been completed successfully',
        'try_again': 'Please try again',
        'continue': 'Say continue to proceed',
        'retry': 'Say retry to try again',
        'back': 'Say back to go back',
        'help': 'Say help for assistance'
      },
      'ta-IN': {
        'welcome_instructions': 'வரவேற்கிறோம்! உங்கள் KYC செயல்முறையைத் தொடங்க தயாராக உள்ளோம்',
        'select_language': 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
        'choose_method': 'உங்கள் விருப்பமான KYC முறையைத் தேர்ந்தெடுக்கவும்',
        'capture_document': 'உங்கள் ஆவணத்தை கேமராவுக்கு முன் வைக்கவும்',
        'face_verification': 'கேமராவைப் பார்த்து உங்கள் முகத்தை நிலையாக வைக்கவும்',
        'review_information': 'உங்கள் தகவல்களை மதிப்பாய்வு செய்து சமர்ப்பிக்கவும்',
        'kyc_completed': 'உங்கள் KYC வெற்றிகரமாக முடிக்கப்பட்டுள்ளது',
        'try_again': 'தயவுசெய்து மீண்டும் முயற்சிக்கவும்',
        'continue': 'தொடர சொல்லுங்கள்',
        'retry': 'மீண்டும் முயற்சிக்க சொல்லுங்கள்',
        'back': 'திரும்பிச் செல்ல சொல்லுங்கள்',
        'help': 'உதவிக்கு சொல்லுங்கள்'
      }
    };

    return messages[this.language]?.[key] || messages['en-US'][key] || key;
  }

  /**
   * Handle voice commands
   */
  handleVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim();
    
    const commands = {
      'continue': () => this.emit('voiceCommand', { action: 'continue' }),
      'retry': () => this.emit('voiceCommand', { action: 'retry' }),
      'back': () => this.emit('voiceCommand', { action: 'back' }),
      'help': () => this.emit('voiceCommand', { action: 'help' }),
      'stop': () => this.emit('voiceCommand', { action: 'stop' }),
      'yes': () => this.emit('voiceCommand', { action: 'confirm' }),
      'no': () => this.emit('voiceCommand', { action: 'cancel' })
    };
    
    // Check for exact matches first
    if (commands[command]) {
      commands[command]();
      return;
    }
    
    // Check for partial matches
    for (const [key, handler] of Object.entries(commands)) {
      if (command.includes(key)) {
        handler();
        return;
      }
    }
    
    // No command recognized
    this.emit('voiceCommand', { action: 'unknown', transcript });
  }

  /**
   * Set language
   */
  setLanguage(language) {
    this.language = language;
    
    if (this.recognitionInstance) {
      this.recognitionInstance.lang = language;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      language: this.language,
      queueLength: this.voiceQueue.length
    };
  }

  /**
   * Stop all voice activities
   */
  stopAll() {
    if (this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
    
    if (this.isListening) {
      this.stopListening();
    }
    
    this.voiceQueue = [];
  }

  /**
   * Event handling
   */
  emit(event, data) {
    const customEvent = new CustomEvent(`voiceGuidance:${event}`, {
      detail: data
    });
    document.dispatchEvent(customEvent);
  }

  /**
   * Destroy voice guidance system
   */
  async destroy() {
    try {
      this.stopAll();
      
      if (this.recognitionInstance) {
        this.recognitionInstance.abort();
        this.recognitionInstance = null;
      }
      
      this.availableVoices = [];
      this.currentUtterance = null;
      
      console.log('Voice guidance system destroyed');
    } catch (error) {
      console.error('Error destroying voice guidance:', error);
      throw error;
    }
  }
}

export default VoiceGuidance;
