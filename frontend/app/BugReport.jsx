import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiCall } from '../src/config/api';
import { showSuccessAlert, showErrorAlert } from './components/CustomAlert';

const BugReport = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      showErrorAlert('Error', 'Please enter a message');
      return;
    }

    if (message.length > 1000) {
      showErrorAlert('Error', 'Message is too long (max 1000 characters)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiCall('/api/bug-reports/submit', {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() }),
      });

      if (response.ok) {
        showSuccessAlert(
          'Success',
          'Bug report submitted successfully! Thank you for helping us improve the app.',
          () => {
            setMessage('');
            router.back();
          }
        );
      } else {
        showErrorAlert('Error', response.data?.error || 'Failed to submit bug report');
      }
    } catch (error) {
      console.error('Bug report error:', error);
      showErrorAlert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ef4444" />

      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="bug" size={32} color="#fff" />
            <Text style={styles.headerTitle}>Report a Bug</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Help us improve the app by reporting issues
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text style={styles.infoText}>
              Please describe the bug or issue you encountered. Include as many details as possible to help us fix it quickly.
            </Text>
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Describe the Issue</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Example: The app crashes when I try to open the map..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={10}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {message.length}/1000 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting || !message.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={submitting || !message.trim() ? ['#d1d5db', '#9ca3af'] : ['#ef4444', '#dc2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitText}>Submit Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Guidelines */}
          <View style={styles.guidelinesCard}>
            <Text style={styles.guidelinesTitle}>Reporting Guidelines</Text>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.guidelineText}>Be specific about the issue</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.guidelineText}>Include steps to reproduce the bug</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.guidelineText}>Mention which screen you were on</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.guidelineText}>Describe what you expected vs what happened</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginLeft: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  guidelinesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default BugReport;
