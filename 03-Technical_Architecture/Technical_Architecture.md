# Bharat KYC - Technical Architecture

## 1. SDK Size Optimization

### Current Challenge
- Target SDK size: <5MB
- Must include core KYC functionality
- Support for multiple document types
- Face recognition capabilities

### Optimization Strategies

#### 1.1 Modular Architecture
```javascript
// Core SDK Structure
class BharatKYCSDK {
  constructor(config) {
    this.modules = new Map();
    this.loadedModules = new Set();
  }

  // Lazy loading of modules
  async loadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    const module = await import(`./modules/${moduleName}.js`);
    this.modules.set(moduleName, module);
    this.loadedModules.add(moduleName);
    return module;
  }

  // Core modules only loaded initially
  async initialize() {
    await this.loadModule('core');
    await this.loadModule('storage');
    // Other modules loaded on demand
  }
}
```

#### 1.2 Asset Optimization
- **Image Compression**: WebP format for smaller sizes
- **Model Quantization**: TensorFlow Lite models optimized
- **Tree Shaking**: Remove unused code during build
- **Code Splitting**: Separate bundles for different features

#### 1.3 Size Breakdown
```
SDK Components:
├── Core Engine (1.2MB)
├── Document Processing (800KB)
├── Face Recognition (1.5MB)
├── Offline Storage (400KB)
├── Network Layer (300KB)
└── UI Components (800KB)
Total: ~5MB
```

## 2. On-Device vs Server-Side Processing

### Processing Decision Matrix

| Feature | On-Device | Server-Side | Hybrid | Decision |
|---------|-----------|-------------|--------|----------|
| Face Match | ✅ | ❌ | ✅ | **Hybrid** |
| Liveness Detection | ✅ | ❌ | ❌ | **On-Device** |
| Document OCR | ❌ | ✅ | ✅ | **Hybrid** |
| Data Validation | ✅ | ✅ | ✅ | **Both** |
| Image Compression | ✅ | ❌ | ❌ | **On-Device** |

### Implementation Strategy

#### 2.1 Face Matching (Hybrid)
```javascript
class FaceMatchingService {
  constructor() {
    this.localModel = null;
    this.serverEndpoint = null;
  }

  async matchFaces(face1, face2) {
    // Step 1: Local quality check
    const quality1 = await this.checkQuality(face1);
    const quality2 = await this.checkQuality(face2);

    if (quality1 < 0.7 || quality2 < 0.7) {
      throw new Error('Image quality too low');
    }

    // Step 2: Local feature extraction
    const features1 = await this.extractFeatures(face1);
    const features2 = await this.extractFeatures(face2);

    // Step 3: Local similarity check
    const localSimilarity = this.calculateSimilarity(features1, features2);

    // Step 4: Server verification for high-confidence cases
    if (localSimilarity > 0.8) {
      return await this.serverVerification(features1, features2);
    }

    return localSimilarity;
  }

  async extractFeatures(image) {
    // Use TensorFlow Lite for feature extraction
    const model = await this.loadLocalModel();
    return await model.predict(image);
  }
}
```

#### 2.2 Liveness Detection (On-Device)
```javascript
class LivenessDetection {
  constructor() {
    this.model = null;
    this.sequence = [];
  }

  async detectLiveness(videoStream) {
    const frames = await this.extractFrames(videoStream, 30);
    
    // On-device processing
    const results = await Promise.all(
      frames.map(frame => this.analyzeFrame(frame))
    );

    return this.aggregateResults(results);
  }

  async analyzeFrame(frame) {
    // Use TensorFlow Lite model
    const model = await this.getLivenessModel();
    return await model.predict(frame);
  }
}
```

#### 2.3 Document OCR (Hybrid)
```javascript
class DocumentOCRService {
  async extractText(image) {
    // Step 1: Local preprocessing
    const processedImage = await this.preprocessImage(image);
    
    // Step 2: Local basic OCR for common fields
    const localResult = await this.localOCR(processedImage);
    
    // Step 3: Server-side advanced OCR if needed
    if (localResult.confidence < 0.8) {
      return await this.serverOCR(processedImage);
    }
    
    return localResult;
  }

  async localOCR(image) {
    // Use Tesseract.js for basic OCR
    const worker = await createWorker('eng+hin');
    const result = await worker.recognize(image);
    await worker.terminate();
    return result;
  }
}
```

## 3. Low Bandwidth & Retry/Resume Flows

### Network Strategy

#### 3.1 Adaptive Quality
```javascript
class AdaptiveUpload {
  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.qualityLevels = {
      high: { quality: 0.9, maxSize: 2 * 1024 * 1024 },
      medium: { quality: 0.7, maxSize: 1 * 1024 * 1024 },
      low: { quality: 0.5, maxSize: 500 * 1024 }
    };
  }

  async uploadWithRetry(file, maxRetries = 3) {
    const quality = this.getOptimalQuality();
    const compressedFile = await this.compressFile(file, quality);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadFile(compressedFile);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
        
        // Reduce quality for retry
        quality.quality *= 0.8;
        compressedFile = await this.compressFile(file, quality);
      }
    }
  }

  getOptimalQuality() {
    const connection = this.networkMonitor.getConnectionType();
    const speed = this.networkMonitor.getSpeed();

    if (connection === 'wifi' && speed > 10) {
      return this.qualityLevels.high;
    } else if (connection === '4g' && speed > 5) {
      return this.qualityLevels.medium;
    } else {
      return this.qualityLevels.low;
    }
  }
}
```

#### 3.2 Resume Upload
```javascript
class ResumeUpload {
  constructor() {
    this.chunkSize = 256 * 1024; // 256KB chunks
    this.uploadQueue = new Map();
  }

  async uploadLargeFile(file) {
    const fileId = this.generateFileId(file);
    const chunks = this.splitIntoChunks(file, this.chunkSize);
    
    // Store upload progress
    this.uploadQueue.set(fileId, {
      file,
      chunks,
      uploadedChunks: new Set(),
      totalChunks: chunks.length
    });

    // Resume from last uploaded chunk
    const progress = await this.getUploadProgress(fileId);
    const startChunk = progress.uploadedChunks.size;

    for (let i = startChunk; i < chunks.length; i++) {
      try {
        await this.uploadChunk(fileId, i, chunks[i]);
        this.uploadQueue.get(fileId).uploadedChunks.add(i);
        await this.saveProgress(fileId, progress);
      } catch (error) {
        // Store failed chunk for retry
        await this.saveFailedChunk(fileId, i, chunks[i]);
        throw error;
      }
    }

    return await this.completeUpload(fileId);
  }
}
```

### Offline-First Architecture

#### 3.3 Local Storage Strategy
```javascript
class OfflineStorage {
  constructor() {
    this.db = null;
    this.syncQueue = [];
  }

  async initialize() {
    this.db = await openDB('BharatKYC', 1, {
      upgrade(db) {
        // Documents store
        const documentsStore = db.createObjectStore('documents', {
          keyPath: 'id',
          autoIncrement: true
        });
        documentsStore.createIndex('status', 'status');
        documentsStore.createIndex('uploaded', 'uploaded');

        // Sync queue store
        db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    });
  }

  async saveDocument(document) {
    const tx = this.db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    
    await store.add({
      ...document,
      status: 'pending',
      uploaded: false,
      createdAt: new Date()
    });

    // Add to sync queue
    await this.addToSyncQueue('document', document);
  }

  async syncWhenOnline() {
    if (!navigator.onLine) return;

    const queue = await this.getSyncQueue();
    
    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        await this.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Sync failed:', error);
        // Retry later
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 3) {
          await this.updateSyncQueue(item);
        }
      }
    }
  }
}
```

## 4. Security Architecture

### Data Protection

#### 4.1 Encryption Strategy
```javascript
class SecurityManager {
  constructor() {
    this.encryptionKey = null;
    this.iv = null;
  }

  async encryptSensitiveData(data) {
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );

    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }

  async decryptSensitiveData(encryptedData) {
    const key = await this.getEncryptionKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

#### 4.2 Secure Communication
```javascript
class SecureAPI {
  constructor() {
    this.baseURL = process.env.API_BASE_URL;
    this.apiKey = process.env.API_KEY;
  }

  async makeRequest(endpoint, data) {
    const timestamp = Date.now();
    const signature = await this.generateSignature(data, timestamp);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }
}
```

## 5. Performance Monitoring

### Metrics Collection
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.performanceObserver = null;
  }

  startMonitoring() {
    // Monitor SDK performance
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration);
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    const summary = {};
    for (const [name, values] of this.metrics) {
      summary[name] = {
        average: values.reduce((a, b) => a + b.value, 0) / values.length,
        count: values.length,
        min: Math.min(...values.map(v => v.value)),
        max: Math.max(...values.map(v => v.value))
      };
    }
    return summary;
  }
}
```

---

*This technical architecture prioritizes performance, security, and offline capability while maintaining a small SDK footprint suitable for low-end devices.*
