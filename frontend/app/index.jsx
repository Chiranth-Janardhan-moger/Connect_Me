// app/index.js (or your main splash screen file)
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

export default function SplashScreen() {
  const router = useRouter();
  
  // State to track if each task is finished
  const [authFinished, setAuthFinished] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  
  // State to store the destination
  const [targetRoute, setTargetRoute] = useState(null);
  
  // Ref to prevent auth check from running multiple times
  const authCheckDone = useRef(false);

  // 1. Check Authentication as soon as the component loads
  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckDone.current) return;
      authCheckDone.current = true;
      console.log('🔍 Starting auth check...');
      
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userRole = await AsyncStorage.getItem('userRole');
        console.log('🔑 Token exists:', !!token);
        console.log('👤 User role:', userRole);

        let route = '/Login';
        if (token && userRole) {
          switch (userRole) {
            case 'student': route = '/Student'; break;
            case 'driver': route = '/Driver'; break;
            case 'admin': route = '/Admin'; break;
            default: route = '/Login';
          }
        }
        
        console.log('📍 Target route determined:', route);
        setTargetRoute(route); // Save the route
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setTargetRoute('/Login'); // Default to Login on error
      } finally {
        console.log('✅ Auth check finished.');
        setAuthFinished(true); // Mark auth as finished
      }
    };

    checkAuth();
  }, []);

  // 2. This function runs when the animation completes
  const handleAnimationFinish = () => {
    console.log('🎬 Animation finished!');
    setAnimationFinished(true); // Mark animation as finished
  };

  // 3. This 'useEffect' watches for BOTH tasks to be complete
  useEffect(() => {
    // If auth is not finished OR animation is not finished OR we don't have a route yet, do nothing.
    if (!authFinished || !animationFinished || !targetRoute) {
      return;
    }

    // --- Both are finished! Time to navigate. ---
    console.log(`🚀 Navigating to: ${targetRoute}`);
    router.replace(targetRoute);

  }, [authFinished, animationFinished, targetRoute, router]); // Re-run when any of these change

  // --- Render the component ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <LottieView
        source={require('../assets/json/Bus-Loading.json')}
        autoPlay
        loop={false} // <-- This is what you wanted
        style={styles.lottie}
        onAnimationFinish={handleAnimationFinish} // <-- Triggers when done
      />
      <View style={styles.bottomTextContainer}>
        <Text style={styles.text}>Developed by</Text>
        <Text style={styles.textEpoch}>Team Epoch with ❤️</Text>
      </View>
    </View>
  );
}

// (Your styles remain the same)
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