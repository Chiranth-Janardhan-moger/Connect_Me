// Chat Service with E2E Encryption
import { apiCall } from '../config/api';
import { getSocket } from '../config/socket';
import encryptionService from './encryption';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ChatService {
  constructor() {
    this.socket = null;
    this.messageListeners = [];
    this.currentRoom = null;
    this.pollingInterval = null;
    this.lastMessageId = null;
  }

  /**
   * Initialize chat service
   */
  async initialize() {
    try {
      await encryptionService.initialize();
      
      // Try Socket.IO first, but don't fail if it doesn't connect
      try {
        this.socket = getSocket();
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
        this.setupSocketListeners();
      } catch (socketError) {
        console.warn('Socket.IO not available, using HTTP polling:', socketError.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Chat initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup socket listeners for real-time chat
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for incoming messages
    this.socket.on('chat:message', async (data) => {
      try {
        // Decrypt message
        const decryptedMessage = encryptionService.decrypt(data.encryptedContent);
        
        const message = {
          ...data,
          content: decryptedMessage,
          decrypted: true,
        };

        // Notify listeners
        this.messageListeners.forEach(listener => {
          try {
            listener(message);
          } catch (error) {
            console.error('Message listener error:', error);
          }
        });
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    // Listen for typing indicators
    this.socket.on('chat:typing', (data) => {
      console.log(`User ${data.userId} is typing...`);
    });
  }

  /**
   * Join chat room
   */
  async joinRoom(routeNumber) {
    this.currentRoom = routeNumber;
    
    // Try Socket.IO if available
    if (this.socket && this.socket.connected) {
      try {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(), 3000);
          this.socket.emit('chat:join', { routeNumber }, (response) => {
            clearTimeout(timeout);
            resolve();
          });
        });
      } catch (error) {
        console.warn('Socket.IO join failed, using HTTP polling');
      }
    }
    
    // Start HTTP polling for new messages (fallback)
    this.startPolling(routeNumber);
    
    return { success: true };
  }
  
  /**
   * Start polling for new messages (HTTP fallback)
   */
  startPolling(routeNumber) {
    // Clear existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Initialize lastMessageId on first poll
    let isFirstPoll = true;
    
    // Poll every 5 seconds (reduced frequency)
    this.pollingInterval = setInterval(async () => {
      try {
        const result = await this.getChatHistory(routeNumber, 10);
        if (result.success && result.messages.length > 0) {
          const latestMessage = result.messages[result.messages.length - 1];
          
          if (isFirstPoll) {
            // On first poll, just set the ID without notifying
            this.lastMessageId = latestMessage._id;
            isFirstPoll = false;
          } else if (this.lastMessageId !== latestMessage._id) {
            // New message detected
            console.log('📬 Polling detected new message:', latestMessage._id);
            this.lastMessageId = latestMessage._id;
            
            // Notify listeners of new message
            this.messageListeners.forEach(listener => {
              listener(latestMessage);
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  }

  /**
   * Leave chat room
   */
  leaveRoom() {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Leave socket room if connected
    if (this.socket && this.currentRoom) {
      this.socket.emit('chat:leave', { routeNumber: this.currentRoom });
    }
    
    this.currentRoom = null;
    this.lastMessageId = null;
  }

  /**
   * Send message
   */
  async sendMessage(content, routeNumber, senderId, senderName) {
    try {
      console.log('🔵 [CHAT SERVICE] Starting sendMessage...');
      console.log('📝 Content length:', content.length);
      console.log('🚌 Route number:', routeNumber);
      console.log('👤 Sender:', senderName, '(ID:', senderId, ')');
      
      // Encrypt message
      console.log('🔐 [CHAT SERVICE] Encrypting message...');
      let encryptedContent;
      try {
        encryptedContent = encryptionService.encrypt(content);
        console.log('✅ [CHAT SERVICE] Message encrypted, length:', encryptedContent.length);
      } catch (encryptError) {
        console.error('❌ [CHAT SERVICE] Encryption failed:', encryptError);
        throw new Error(`Encryption failed: ${encryptError.message}`);
      }

      // Get current API base URL for debugging
      const apiBaseUrl = await AsyncStorage.getItem('apiBaseUrl');
      console.log('🌐 [CHAT SERVICE] API Base URL:', apiBaseUrl || 'Using default');
      
      // Send via API for persistence
      console.log('📡 [CHAT SERVICE] Sending to API endpoint: /api/chat/send');
      const response = await apiCall('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          routeNumber,
          encryptedContent,
          senderId,
          senderName,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log('📡 [CHAT SERVICE] API Response:', {
        ok: response.ok,
        status: response.status,
        hasData: !!response.data,
      });

      // Also broadcast via Socket.IO for real-time delivery
      if (this.socket && this.socket.connected) {
        console.log('🔌 [CHAT SERVICE] Broadcasting via Socket.IO');
        this.socket.emit('chat:message', {
          routeNumber,
          encryptedContent,
          senderId,
          senderName,
          timestamp: new Date().toISOString(),
        });
        console.log('✅ [CHAT SERVICE] Socket.IO broadcast sent');
      } else {
        console.warn('⚠️ [CHAT SERVICE] Socket.IO not connected, skipping real-time broadcast');
        console.log('🔌 Socket status:', {
          exists: !!this.socket,
          connected: this.socket?.connected || false,
        });
      }

      if (response.ok) {
        console.log('✅ [CHAT SERVICE] Message sent successfully');
        return { success: true, data: response.data };
      } else {
        console.error('❌ [CHAT SERVICE] API returned error');
        console.error('🔍 Response details:', response);
        return { 
          success: false, 
          error: response.data?.message || response.data?.error || `HTTP ${response.status}`,
          status: response.status,
          data: response.data
        };
      }
    } catch (error) {
      console.error('❌ [CHAT SERVICE] Exception in sendMessage:', error);
      console.error('🔍 Error type:', error.name);
      console.error('🔍 Error message:', error.message);
      console.error('🔍 Error stack:', error.stack);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network request failed - Check your internet connection and API server';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - Server is not responding';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid server response - Server may be down';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(routeNumber, limit = 50) {
    try {
      const response = await apiCall(`/api/chat/history?routeNumber=${routeNumber}&limit=${limit}`, {
        method: 'GET',
      });

      if (response.ok && response.data) {
        // Decrypt messages
        const decryptedMessages = response.data.messages.map(msg => {
          // If message is marked deleted, show placeholder instead of decrypting
          if (msg.deleted) {
            return {
              ...msg,
              content: 'This message was deleted',
              decrypted: true,
            };
          }

          try {
            return {
              ...msg,
              content: encryptionService.decrypt(msg.encryptedContent),
              decrypted: true,
            };
          } catch (error) {
            console.error('Failed to decrypt message:', msg.id);
            return {
              ...msg,
              content: '[Encrypted]',
              decrypted: false,
            };
          }
        });

        return { success: true, messages: decryptedMessages };
      }

      return { success: false, messages: [] };
    } catch (error) {
      console.error('Get chat history error:', error);
      return { success: false, error: error.message, messages: [] };
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(callback) {
    this.messageListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Send typing indicator
   */
  sendTyping(routeNumber) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:typing', { routeNumber });
    }
  }

  /**
   * Delete message via API
   * - routeNumber is used by backend to ensure room context
   * - forEveryone=true => delete for everyone (soft delete in DB)
   */
  async deleteMessage(messageId, routeNumber, forEveryone = false) {
    try {
      const response = await apiCall(`/api/chat/message/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ routeNumber, forEveryone }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: response.data?.error || response.data?.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ChatService();
