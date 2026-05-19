import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../src/config/api';

export default function FeedbackScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'driving', label: 'Driving', icon: 'car' },
    { id: 'punctuality', label: 'Punctuality', icon: 'time' },
    { id: 'behavior', label: 'Behavior', icon: 'people' },
    { id: 'cleanliness', label: 'Cleanliness', icon: 'sparkles' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiCall('/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({ rating, category, comment }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Thank you for your feedback!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Rate Your Experience</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#f59e0b' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                category === cat.id && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={24}
                color={category === cat.id ? '#3b82f6' : '#6b7280'}
              />
              <Text style={[
                styles.categoryLabel,
                category === cat.id && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Comments (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Share your thoughts..."
          placeholderTextColor="#9ca3af"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.anonymousNote}>
          Your feedback is anonymous and helps improve the service
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12, marginTop: 20 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  categoryLabelActive: { color: '#3b82f6' },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { backgroundColor: '#93c5fd' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  anonymousNote: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16, marginBottom: 40 },
});
