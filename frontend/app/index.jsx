import { View, Text, StyleSheet,StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();

  const handleAnimationFinish = async () => {
    // const token = await AsyncStorage.getItem('userToken');
    // if (token) router.replace('/home');
    // else router.replace('/login');

     router.replace('/Home');
  };

  return (
    <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Centered Lottie animation */}
      <LottieView
        source={require('../assets/json/Bus-Loading.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
        onAnimationFinish={handleAnimationFinish}
      />

      {/* Text at bottom */}
      <View style={styles.bottomTextContainer}>
        <Text style={styles.text}>Developed by</Text>
        <Text style={styles.textEpoch}>Team Epoch with ❤️</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // centers animation
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lottie: {
    width: 256,
    height: 256,
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 24, // adjust as needed
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
