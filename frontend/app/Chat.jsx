// Chat Screen - Enhanced with Menu and Better Keyboard Handling
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatService from '../src/services/chatService';
import { showErrorAlert, showCustomAlert } from './components/CustomAlert';
import encryptionService from '../src/services/encryption';

const ChatScreen = () => {
  const router = useRouter();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [routeNumber, setRouteNumber] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);

  useEffect(() => {
    initializeChat();
    
    return () => {
      chatService.leaveRoom();
    };
  }, [initializeChat]);

  const initializeChat = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = await AsyncStorage.getItem('userRole');
      const route = user?.routeNumber;

      const name = user?.name || user?.username || 'Unknown';
      const id = user?._id || user?.id || '';
      
      console.log('👤 Chat User Info:', { name, id, role, route });
      
      setUserName(name);
      setUserId(id);
      setRouteNumber(route);

      if (!route) {
        showErrorAlert('Error', 'No route assigned to your account', () => router.back());
        return;
      }

      const initResult = await chatService.initialize();
      if (!initResult?.success) {
        showErrorAlert('Connection Error', 'Failed to initialize chat');
        setLoading(false);
        return;
      }

      const joinResult = await chatService.joinRoom(route);
      if (!joinResult?.success) {
        showErrorAlert('Connection Error', 'Failed to join chat room');
        setLoading(false);
        return;
      }

      const historyResult = await chatService.getChatHistory(route, 50);
      if (historyResult.success) {
        const decryptedMessages = historyResult.messages.map(msg => {
          if (!msg.decrypted && msg.encryptedContent) {
            try {
              const decrypted = encryptionService.decrypt(msg.encryptedContent);
              return { ...msg, content: decrypted, decrypted: true };
            } catch (err) {
              console.error('Failed to decrypt message:', msg._id, err);
              return { ...msg, content: 'Encrypted message', decrypted: false };
            }
          }
          return msg;
        });
        const sortedMessages = decryptedMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
      }

      chatService.onMessage((message) => {
        if (message.senderId === id) {
          console.log('🚫 Skipping own message from socket/polling');
          return;
        }
        
        let finalMessage = message;
        if (message.deleted) {
          finalMessage = { ...message, content: 'This message was deleted', decrypted: true };
        } else if (!message.decrypted && message.encryptedContent) {
          try {
            const decrypted = encryptionService.decrypt(message.encryptedContent);
            finalMessage = { ...message, content: decrypted, decrypted: true };
          } catch (err) {
            console.error('Failed to decrypt incoming message:', err);
            finalMessage = { ...message, content: 'Encrypted message', decrypted: false };
          }
        }
        
        setMessages((prev) => {
          const isDuplicate = prev.some(m => m._id === finalMessage._id);
          if (isDuplicate) {
            console.log('🚫 Duplicate message detected, skipping');
            return prev;
          }
          return [...prev, finalMessage];
        });
        
        requestAnimationFrame(() => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);
        });
      });

      setLoading(false);
    } catch (error) {
      console.error('Chat initialization error:', error);
      showErrorAlert('Initialization Error', 'Failed to initialize chat.');
      setLoading(false);
    }
  }, [router]);

  const handleDeleteChat = () => {
    setMenuVisible(false);

    showCustomAlert(
      'Delete Chat History',
      'Are you sure you want to delete all messages on this device? This will not affect other users.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Local-only delete: clear messages just on this device
              setMessages([]);
              showCustomAlert('Deleted', 'Chat history has been cleared on this device.', [], 'success');
            } catch (error) {
              console.error('Delete error:', error);
              showErrorAlert('Error', 'Failed to delete chat history');
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleMessageLongPress = (message) => {
    // Only allow deleting own messages
    if (message.senderId === userId) {
      setSelectedMessage(message);
      setMessageMenuVisible(true);
    }
  };

  const handleDeleteForMe = async () => {
    setMessageMenuVisible(false);
    try {
      // Remove message locally only
      setMessages((prev) => prev.filter(m => m._id !== selectedMessage._id));
      
      // Optional: Save deleted message IDs to AsyncStorage to persist across sessions
      // const deletedIds = JSON.parse(await AsyncStorage.getItem('deletedMessageIds') || '[]');
      // deletedIds.push(selectedMessage._id);
      // await AsyncStorage.setItem('deletedMessageIds', JSON.stringify(deletedIds));
      
      setSelectedMessage(null);
    } catch (error) {
      console.error('Delete for me error:', error);
      showErrorAlert('Error', 'Failed to delete message');
    }
  };

  const handleDeleteForEveryone = () => {
    setMessageMenuVisible(false);

    showCustomAlert(
      'Delete for Everyone?',
      'This message will be deleted for all participants in this chat.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedMessage(null),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await chatService.deleteMessage(selectedMessage._id, routeNumber, true);

              if (!result.success) {
                showErrorAlert('Error', result.error || 'Failed to delete message');
                return;
              }

              // Mark message as deleted locally so we can show a placeholder
              setMessages((prev) =>
                prev.map(m =>
                  m._id === selectedMessage._id
                    ? { ...m, content: 'This message was deleted', deleted: true }
                    : m
                )
              );
              setSelectedMessage(null);
            } catch (error) {
              console.error('Delete for everyone error:', error);
              showErrorAlert('Error', 'Failed to delete message');
            }
          },
        },
      ],
      'error'
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    const tempId = `temp_${Date.now()}_${Math.random()}`;

    try {
      const newMessage = {
        _id: tempId,
        content: messageText,
        senderId: userId,
        senderName: userName,
        timestamp: new Date().toISOString(),
        decrypted: true,
      };
      
      setMessages((prev) => [...prev, newMessage]);
      
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      const result = await chatService.sendMessage(messageText, routeNumber, userId, userName);
      
      if (!result.success) {
        setMessages((prev) => prev.filter(m => m._id !== tempId));
        showErrorAlert('Send Failed', result.error || 'Message could not be sent. Try again.');
        setInputText(messageText);
      } else if (result.data?.message?.id) {
        // Replace temporary message ID with real database ID to make future deletes reliable
        const realId = result.data.message.id;
        const realTimestamp = result.data.message.timestamp;
        setMessages((prev) =>
          prev.map(m =>
            m._id === tempId
              ? { ...m, _id: realId, timestamp: realTimestamp || m.timestamp }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages((prev) => prev.filter(m => m._id !== tempId));
      showErrorAlert('Network Error', 'Failed to send message.');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const getDateLabel = (timestamp) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const shouldShowDateHeader = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.senderId === userId;
    const time = new Date(item.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(item, previousMessage);

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>{getDateLabel(item.timestamp)}</Text>
          </View>
        )}
        <TouchableOpacity
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={300}
          activeOpacity={0.7}
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.senderName || 'Anonymous'}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownText : styles.otherText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownTime : styles.otherTime,
              ]}
            >
              {time}
            </Text>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route {routeNumber} Chat</Text>
          <View style={styles.headerSubtitleRow}>
            <Ionicons name="lock-closed" size={12} color="#10b981" />
            <Text style={styles.headerSubtitle}>End-to-end encrypted</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setMenuVisible(true)} 
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleDeleteChat}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.menuItemTextDelete}>Delete Chat History</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Message Delete Menu Modal */}
      <Modal
        visible={messageMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setMessageMenuVisible(false);
          setSelectedMessage(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setMessageMenuVisible(false);
          setSelectedMessage(null);
        }}>
          <View style={styles.messageModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.messageMenuContainer}>
                <TouchableOpacity 
                  style={styles.messageMenuItem}
                  onPress={handleDeleteForMe}
                >
                  <Ionicons name="trash-outline" size={20} color="#6b7280" />
                  <Text style={styles.messageMenuItemText}>Delete for Me</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity 
                  style={styles.messageMenuItem}
                  onPress={handleDeleteForEveryone}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text style={styles.messageMenuItemTextDelete}>Delete for Everyone</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 50);
          }}
          onLayout={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
        />

        {/* Input Container */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 60,
    marginRight: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemTextDelete: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 12,
    fontWeight: '500',
  },
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  messageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  messageMenuItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  messageMenuItemTextDelete: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
    overflow: 'hidden',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 12,
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTime: {
    color: '#dbeafe',
  },
  otherTime: {
    color: '#6b7280',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});

export default React.memo(ChatScreen);