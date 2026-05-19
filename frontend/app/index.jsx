// app/index.js

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Splash Screen Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Loading...</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function SplashScreen() {
  const router = useRouter();

  // State to track if each task is finished
  const [authFinished, setAuthFinished] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  // State to store the destination
  const [targetRoute, setTargetRoute] = useState(null);

  // State to control the animation speed (default: 1x)
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Ref to prevent auth check from running multiple times
  const authCheckDone = useRef(false);

  // 1. Check Authentication as soon as the component loads
  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckDone.current) return;
      authCheckDone.current = true;

      try {
        console.log('🔄 Starting auth check...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        const authPromise = (async () => {
          const token = await AsyncStorage.getItem('authToken');
          const userRole = await AsyncStorage.getItem('userRole');
          return { token, userRole };
        })();

        const { token, userRole } = await Promise.race([authPromise, timeoutPromise]);

        console.log('🔑 Token exists:', !!token);
        console.log('👤 User role:', userRole);

        let route = '/Login';

        if (token && userRole) {
          // Returning user → Speed up animation
          console.log('🚀 Returning user. Speeding up animation!');
          setAnimationSpeed(2.5);

          switch (userRole) {
            case 'student':
              route = '/Student';
              break;
            case 'driver':
              route = '/Driver';
              break;
            case 'admin':
              route = '/Admin';
              break;
            default:
              console.warn('⚠️ Unknown user role:', userRole);
              route = '/Login';
          }
        } else {
          // New user → Normal speed
          console.log('👋 New user. Playing animation at normal speed.');
          setAnimationSpeed(1);
          route = '/Login';
        }

        console.log('📍 Target route determined:', route);
        setTargetRoute(route);
      } catch (error) {
        console.error('❌ Auth check error:', error);
        // Fallback to safe defaults
        setAnimationSpeed(1);
        setTargetRoute('/Login');
        // Show alert in debug mode
        if (__DEV__) {
          Alert.alert('Auth Error', error.message);
        }
      } finally {
        console.log('✅ Auth check finished.');
        setAuthFinished(true);
      }
    };

    // Add small delay to ensure app is fully initialized
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // 2. Function runs when animation completes
  const handleAnimationFinish = () => {
    try {
      console.log('🎬 Animation finished!');
      setAnimationFinished(true);
    } catch (error) {
      console.error('❌ Animation finish error:', error);
      setAnimationFinished(true); // Continue anyway
    }
  };

  // Handle animation loading error
  const handleAnimationError = (error) => {
    console.error('❌ Lottie animation error:', error);
    // Skip animation and proceed
    setAnimationFinished(true);
  };

  // 3. Watch for BOTH tasks to complete before navigating
  useEffect(() => {
    if (!authFinished || !animationFinished || !targetRoute) return;

    try {
      console.log(`🚀 Navigating to: ${targetRoute}`);
      // Add small delay to ensure smooth transition
      const timer = setTimeout(() => {
        router.replace(targetRoute);
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback navigation
      router.replace('/Login');
    }
  }, [authFinished, animationFinished, targetRoute, router]);

  // --- Render ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <LottieView
        source={require('../assets/json/Bus-Loading.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
        onAnimationFinish={handleAnimationFinish}
        speed={animationSpeed}
      />
      <View style={styles.bottomTextContainer}>
        <Text style={styles.text}>Developed by</Text>
        <Text style={styles.textEpoch}>Team Epoch with ❤️</Text>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lottie: {
    width: 256,
    height: 256,
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
  },
  text: {
    color: '#1f2937',
    fontSize: 20,
    fontWeight: '600',
  },
  textEpoch: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '600',
  },
});
