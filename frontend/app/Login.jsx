import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../src/config/api';  // Import API
import * as Location from 'expo-location';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    try {
      // Use API helper
      const response = await authAPI.login(email.trim(), password);

      if (response.ok) {
        // Store token and user info
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role);

        // Navigate based on role
        switch (response.data.user.role) {
          case 'student':
            // Ask for location permission up-front (no watchers started here)
            try {
              await Location.requestForegroundPermissionsAsync();
            } catch {}
            router.replace('/Student');
            break;
          case 'driver':
            router.replace('/Driver');
            break;
          case 'admin':
            router.replace('/Admin');
            break;
          default:
            Alert.alert('Error', 'Invalid user role');
        }
      } else {
        let errorMessage = 'An error occurred. Please try again.';

        switch (response.status) {
          case 401:
            errorMessage = 'Invalid email or password.';
            break;
          case 404:
            errorMessage = 'User not found. Please contact admin.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = response.data.message || errorMessage;
        }

        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to server. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={'padding'}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Dont have an account? Contact your administrator.</Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});