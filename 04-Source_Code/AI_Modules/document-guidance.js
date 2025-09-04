/**
 * AI-Powered Document Guidance Module
 * Provides real-time assistance during document capture
 */

class DocumentGuidance {
  constructor() {
    this.visionModel = null;
    this.isModelLoaded = false;
    this.currentAnalysis = null;
    this.guidanceQueue = [];
    this.language = 'hi-IN';
  }

  /**
   * Initialize the document guidance system
   */
  async initialize(language = 'hi-IN') {
    try {
      this.language = language;
      
      // Load TensorFlow Lite model for document analysis
      await this.loadVisionModel();
      
      // Initialize guidance system
      this.startGuidanceLoop();
      
      console.log('Document guidance system initialized');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize document guidance:', error);
      throw error;
    }
  }

  /**
   * Load the computer vision model
   */
  async loadVisionModel() {
    try {
      // Load TensorFlow Lite model
      this.visionModel = await tf.loadLayersModel('/models/document-analysis.json');
      this.isModelLoaded = true;
      console.log('Vision model loaded successfully');
    } catch (error) {
      console.error('Failed to load vision model:', error);
      // Fallback to basic analysis
      this.visionModel = null;
    }
  }

  /**
   * Analyze document image in real-time
   */
  async analyzeImage(imageData) {
    try {
      if (!this.isModelLoaded) {
        return this.basicAnalysis(imageData);
      }

      // Preprocess image for model
      const processedImage = await this.preprocessImage(imageData);
      
      // Run model prediction
      const prediction = await this.visionModel.predict(processedImage);
      
      // Extract analysis results
      const analysis = {
        documentType: this.getDocumentType(prediction),
        quality: this.getQualityScore(prediction),
        confidence: this.getConfidenceScore(prediction),
        suggestions: this.generateSuggestions(prediction),
        timestamp: Date.now()
      };

      this.currentAnalysis = analysis;
      this.addToGuidanceQueue(analysis);
      
      return analysis;
    } catch (error) {
      console.error('Image analysis failed:', error);
      return this.basicAnalysis(imageData);
    }
  }

  /**
   * Basic analysis when ML model is not available
   */
  basicAnalysis(imageData) {
    const analysis = {
      documentType: 'unknown',
      quality: this.estimateQuality(imageData),
      confidence: 0.5,
      suggestions: this.getBasicSuggestions(imageData),
      timestamp: Date.now()
    };

    this.currentAnalysis = analysis;
    return analysis;
  }

  /**
   * Estimate image quality using basic metrics
   */
  estimateQuality(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate brightness
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness /= (data.length / 4);
        
        // Calculate contrast
        let contrast = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
          contrast += Math.abs(pixel - brightness);
        }
        contrast /= (data.length / 4);
        
        // Normalize quality score
        const quality = Math.min(1, (brightness / 255) * (contrast / 255));
        resolve(quality);
      };
      img.src = imageData;
    });
  }

  /**
   * Generate suggestions based on analysis
   */
  generateSuggestions(analysis) {
    const suggestions = [];
    
    // Quality-based suggestions
    if (analysis.quality < 0.7) {
      suggestions.push(this.getLocalizedMessage('move_closer'));
    }
    
    if (analysis.quality < 0.5) {
      suggestions.push(this.getLocalizedMessage('improve_lighting'));
    }
    
    // Document type suggestions
    if (analysis.confidence < 0.8) {
      suggestions.push(this.getLocalizedMessage('check_document'));
    }
    
    // Blur detection
    if (analysis.blur > 0.3) {
      suggestions.push(this.getLocalizedMessage('hold_steady'));
    }
    
    // Glare detection
    if (analysis.glare > 0.4) {
      suggestions.push(this.getLocalizedMessage('remove_glare'));
    }
    
    return suggestions;
  }

  /**
   * Get basic suggestions without ML
   */
  getBasicSuggestions(imageData) {
    return [
      this.getLocalizedMessage('ensure_good_lighting'),
      this.getLocalizedMessage('keep_document_flat'),
      this.getLocalizedMessage('hold_phone_steady')
    ];
  }

  /**
   * Get localized message
   */
  getLocalizedMessage(key) {
    const messages = {
      'hi-IN': {
        'move_closer': 'दस्तावेज़ के करीब जाएं',
        'improve_lighting': 'बेहतर रोशनी में लें',
        'check_document': 'दस्तावेज़ की जांच करें',
        'hold_steady': 'फोन को स्थिर रखें',
        'remove_glare': 'चमक हटाएं',
        'ensure_good_lighting': 'अच्छी रोशनी सुनिश्चित करें',
        'keep_document_flat': 'दस्तावेज़ को सपाट रखें',
        'hold_phone_steady': 'फोन को स्थिर रखें'
      },
      'en-US': {
        'move_closer': 'Move closer to the document',
        'improve_lighting': 'Improve lighting',
        'check_document': 'Check document placement',
        'hold_steady': 'Hold the phone steady',
        'remove_glare': 'Remove glare',
        'ensure_good_lighting': 'Ensure good lighting',
        'keep_document_flat': 'Keep document flat',
        'hold_phone_steady': 'Hold phone steady'
      }
    };

    return messages[this.language]?.[key] || messages['en-US'][key] || key;
  }

  /**
   * Add analysis to guidance queue
   */
  addToGuidanceQueue(analysis) {
    this.guidanceQueue.push(analysis);
    
    // Keep only last 10 analyses
    if (this.guidanceQueue.length > 10) {
      this.guidanceQueue.shift();
    }
  }

  /**
   * Start guidance loop for real-time feedback
   */
  startGuidanceLoop() {
    setInterval(() => {
      if (this.currentAnalysis && this.currentAnalysis.suggestions.length > 0) {
        this.emitGuidance(this.currentAnalysis.suggestions[0]);
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Emit guidance to UI
   */
  emitGuidance(suggestion) {
    // Emit custom event for UI to handle
    const event = new CustomEvent('documentGuidance', {
      detail: {
        suggestion,
        timestamp: Date.now(),
        analysis: this.currentAnalysis
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Get document type from prediction
   */
  getDocumentType(prediction) {
    const types = ['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport'];
    const maxIndex = prediction.indexOf(Math.max(...prediction));
    return types[maxIndex] || 'unknown';
  }

  /**
   * Get quality score from prediction
   */
  getQualityScore(prediction) {
    // Extract quality features from prediction
    const qualityFeatures = prediction.slice(0, 5); // First 5 values
    return qualityFeatures.reduce((sum, val) => sum + val, 0) / qualityFeatures.length;
  }

  /**
   * Get confidence score from prediction
   */
  getConfidenceScore(prediction) {
    // Extract confidence features from prediction
    const confidenceFeatures = prediction.slice(5, 10); // Next 5 values
    return confidenceFeatures.reduce((sum, val) => sum + val, 0) / confidenceFeatures.length;
  }

  /**
   * Preprocess image for model input
   */
  async preprocessImage(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize to model input size
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);
        
        // Convert to tensor
        const tensor = tf.browser.fromPixels(canvas);
        const normalized = tensor.div(255.0);
        const expanded = normalized.expandDims(0);
        
        resolve(expanded);
      };
      
      img.src = imageData;
    });
  }

  /**
   * Get current analysis
   */
  getCurrentAnalysis() {
    return this.currentAnalysis;
  }

  /**
   * Get guidance history
   */
  getGuidanceHistory() {
    return [...this.guidanceQueue];
  }

  /**
   * Clear guidance history
   */
  clearGuidanceHistory() {
    this.guidanceQueue = [];
  }

  /**
   * Destroy the guidance system
   */
  async destroy() {
    try {
      if (this.visionModel) {
        this.visionModel.dispose();
        this.visionModel = null;
      }
      
      this.isModelLoaded = false;
      this.currentAnalysis = null;
      this.guidanceQueue = [];
      
      console.log('Document guidance system destroyed');
    } catch (error) {
      console.error('Error destroying document guidance:', error);
      throw error;
    }
  }
}

export default DocumentGuidance;
