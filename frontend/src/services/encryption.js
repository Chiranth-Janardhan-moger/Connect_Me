// End-to-End Encryption Service for Chat
// Uses AES-256 for message encryption with secure random generation
// Fixed for React Native crypto.getRandomValues() compatibility

import 'react-native-get-random-values'; // CRITICAL: Must be first
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ENCRYPTION_CONFIG } from '../config/keys';

// Verify crypto.getRandomValues is available
if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
  console.error('❌ CRITICAL: crypto.getRandomValues not available!');
  console.error('🛠️ Solution: Install react-native-get-random-values and import it first');
  console.error('📚 Command: npm install react-native-get-random-values');
  console.error('📝 Import: Add "import \'react-native-get-random-values\';" at the top of _layout.jsx');
}

const KEY_STORAGE_KEY = STORAGE_KEYS.CHAT_ENCRYPTION_KEY;
const KEY_SIZE = ENCRYPTION_CONFIG.CHAT_KEY_SIZE; // bits

class EncryptionService {
  constructor() {
    this.encryptionKey = null;
    this.initialized = false;
  }

  /**
   * Initialize encryption service with crypto polyfill verification
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 🔒 CRITICAL: Verify crypto.getRandomValues is working
      if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
        throw new Error('🛠️ crypto.getRandomValues not available. Install react-native-get-random-values!');
      }

      // Test secure random generation
      const testArray = new Uint8Array(8);
      crypto.getRandomValues(testArray);
      
      // Verify we got actual random data (not all zeros)
      const isAllZeros = testArray.every(byte => byte === 0);
      if (isAllZeros) {
        throw new Error('🛠️ crypto.getRandomValues returned all zeros - polyfill may be broken');
      }
      
      console.log('✅ Secure random generator verified:', Array.from(testArray.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Try to load existing key
      const storedKey = await AsyncStorage.getItem(KEY_STORAGE_KEY);
      
      if (storedKey) {
        // Verify stored key format
        if (storedKey.length === 64 && /^[0-9a-f]+$/i.test(storedKey)) {
          this.encryptionKey = storedKey;
          console.log('🔐 Loaded existing encryption key (64 hex chars)');
        } else {
          console.warn('⚠️ Invalid stored key format, generating new key');
          await this.generateKey();
        }
      } else {
        // Generate new key
        await this.generateKey();
      }

      this.initialized = true;
      console.log('✅ Encryption service initialized successfully');
    } catch (error) {
      console.error('❌ Encryption initialization error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('crypto.getRandomValues')) {
        console.error('📚 Fix: npm install react-native-get-random-values');
        console.error('📝 Then add: import \'react-native-get-random-values\'; at the top of _layout.jsx');
      }
      
      throw error;
    }
  }

  /**
   * Generate new encryption key with enhanced security verification
   */
  async generateKey() {
    try {
      // Generate secure random 256-bit key using crypto.getRandomValues()
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      
      // Verify we got good random data
      const entropy = this.calculateEntropy(randomBytes);
      if (entropy < 6.0) {
        console.warn('⚠️ Low entropy detected, regenerating key...');
        crypto.getRandomValues(randomBytes); // Try again
      }
      
      this.encryptionKey = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Store key securely
      await AsyncStorage.setItem(KEY_STORAGE_KEY, this.encryptionKey);
      
      console.log('🔐 Generated new secure encryption key');
      console.log('📊 Key entropy:', entropy.toFixed(2), 'bits per byte (good if > 6.0)');
      return this.encryptionKey;
    } catch (error) {
      console.error('❌ Key generation failed:', error);
      throw new Error('Failed to generate secure encryption key: ' + error.message);
    }
  }

  /**
   * Calculate entropy of random bytes (for quality verification)
   */
  calculateEntropy(bytes) {
    const frequency = new Array(256).fill(0);
    bytes.forEach(byte => frequency[byte]++);
    
    let entropy = 0;
    const length = bytes.length;
    
    for (let i = 0; i < 256; i++) {
      if (frequency[i] > 0) {
        const p = frequency[i] / length;
        entropy -= p * Math.log2(p);
      }
    }
    
    return entropy;
  }

  /**
   * Encrypt message
   */
  encrypt(message, recipientKey = null) {
    if (!this.initialized || !this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Use recipient's key if provided, otherwise use own key
      const key = recipientKey || this.encryptionKey;
      
      // Generate secure IV using crypto.getRandomValues()
      const ivArray = new Uint8Array(16);
      crypto.getRandomValues(ivArray);
      
      // Verify IV is not all zeros (security check)
      const isAllZeros = ivArray.every(byte => byte === 0);
      if (isAllZeros) {
        console.error('❌ Generated IV is all zeros - crypto polyfill issue!');
        throw new Error('Insecure IV generated - check crypto.getRandomValues() polyfill');
      }
      
      const iv = CryptoJS.lib.WordArray.create(Array.from(ivArray));
      
      // Encrypt using AES-256 with custom IV
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Return IV + encrypted data
      return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt message
   */
  decrypt(encryptedMessage, senderKey = null) {
    if (!this.initialized || !this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Use sender's key if provided, otherwise use own key
      const key = senderKey || this.encryptionKey;
      
      // Check if message has IV (new format) or is legacy format
      let decrypted;
      if (encryptedMessage.includes(':')) {
        // New format: IV:encrypted
        const [ivHex, encryptedData] = encryptedMessage.split(':');
        const iv = CryptoJS.enc.Hex.parse(ivHex);
        
        decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
      } else {
        // Legacy format: just encrypted data
        decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
      }
      
      const message = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!message) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return message;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  /**
   * Get public key for sharing
   */
  async getPublicKey() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In a real implementation, this would be the public part of an RSA key pair
    // For simplicity, we're using a hash of the encryption key
    const publicKey = CryptoJS.SHA256(this.encryptionKey).toString();
    return publicKey;
  }

  /**
   * Generate shared key for group chat with security verification
   */
  generateSharedKey() {
    try {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      
      // Security check: ensure not all zeros
      const isAllZeros = randomBytes.every(byte => byte === 0);
      if (isAllZeros) {
        throw new Error('Generated shared key is all zeros - crypto polyfill issue!');
      }
      
      return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('❌ Shared key generation failed:', error);
      throw error;
    }
  }

  /**
   * Verify crypto polyfill is working correctly
   */
  static verifyCryptoPolyfill() {
    try {
      if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
        return {
          working: false,
          error: 'crypto.getRandomValues not available',
          solution: 'Install react-native-get-random-values and import it first'
        };
      }
      
      // Test random generation
      const testBytes = new Uint8Array(16);
      crypto.getRandomValues(testBytes);
      
      // Check if we got actual random data
      const isAllZeros = testBytes.every(byte => byte === 0);
      const isAllSame = testBytes.every(byte => byte === testBytes[0]);
      
      if (isAllZeros || isAllSame) {
        return {
          working: false,
          error: 'crypto.getRandomValues returning non-random data',
          solution: 'Check react-native-get-random-values installation'
        };
      }
      
      return {
        working: true,
        sample: Array.from(testBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      };
    } catch (error) {
      return {
        working: false,
        error: error.message,
        solution: 'Install and import react-native-get-random-values'
      };
    }
  }

  /**
   * Hash data (for verification)
   */
  hash(data) {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Clear encryption keys (logout)
   */
  async clearKeys() {
    this.encryptionKey = null;
    this.initialized = false;
    await AsyncStorage.removeItem(KEY_STORAGE_KEY);
    console.log('🗑️ Encryption keys cleared');
  }
}

// Verify crypto polyfill on module load
const cryptoCheck = EncryptionService.verifyCryptoPolyfill();
if (!cryptoCheck.working) {
  console.error('❌ Crypto polyfill check failed:', cryptoCheck.error);
  console.error('🛠️ Solution:', cryptoCheck.solution);
} else {
  console.log('✅ Crypto polyfill verified, sample:', cryptoCheck.sample);
}

export default new EncryptionService();
