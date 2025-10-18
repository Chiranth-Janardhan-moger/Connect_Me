import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
// import LottieView from 'lottie-react-native';
// import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Home = () => {
  const [userName, setUserName] = useState('');


const router = useRouter();

  useEffect(() => {
    // Fetch user name from database
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    try {
      // Replace with your actual API endpoint
      // const response = await fetch('YOUR_API_ENDPOINT/user');
      // const data = await response.json();
      // setUserName(data.name);
      
      // Sample data - replace with actual database call
      setUserName('Chiranth Moger');
    } catch (error) {
      console.error('Error fetching user name:', error);
      setUserName('User');
    }
  };

  const handleBusPress = () => {
    router.push('/Map');
  };

  const handleContactsPress = () => {
    console.log('Contacts pressed');
    // Navigate to contacts screen
  };

  const handleSOSPress = () => {
    console.log('SOS pressed');
    // Trigger SOS functionality
  };

  const handleInfoPress = () => {
    console.log('Info pressed');
    // Navigate to info screen
  };

  return (
    <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    
      
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.instituteName}>BMS institute of Technology</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          
          {/* Profile Avatar with Lottie Animation */}
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../assets/images/profile.jpg')}
              style={styles.lottieAvatar}
            />
          </View>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        {/* Bus Tracking */}
        <TouchableOpacity
          style={[styles.menuItem, styles.busItem]}
          onPress={handleBusPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/images/Bus_icon.png')}
        
              style={styles.lottieIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Contacts */}
        <TouchableOpacity
          style={[styles.menuItem, styles.contactsItem]}
          onPress={handleContactsPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {/* <LottieView
              source={require('./assets/contacts-animation.json')} // Add your lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            /> */}
            <Image
              source={require('../assets/images/profile.jpg')}
            
              style={styles.lottieIcon}
            />
          </View>
        </TouchableOpacity>

        {/* SOS */}
        <TouchableOpacity
          style={[styles.menuItem, styles.sosItem]}
          onPress={handleSOSPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {/* <LottieView
              source={require('./assets/sos-animation.json')} // Add your lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            /> */}
            <Image
              source={require('../assets/images/profile.jpg')}
           
              style={styles.lottieIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Info */}
        <TouchableOpacity
          style={[styles.menuItem, styles.infoItem]}
          onPress={handleInfoPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {/* <LottieView
              source={require('')} // Add your lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            /> */}
            <Image
              source={require('../assets/images/profile.jpg')}
              style={styles.lottieIcon}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 25,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instituteName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lottieAvatar: {
    width: 80,
    height: 80,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 60) / 2,
    height: 140,
    borderRadius: 25,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  busItem: {
    backgroundColor: '#D4F1F4',
  },
  contactsItem: {
    backgroundColor: '#D4F4DD',
  },
  sosItem: {
    backgroundColor: '#FFE4E9',
  },
  infoItem: {
    backgroundColor: '#FFF4E0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieIcon: {
    width: 100,
    height: 100,
  },
});

export default Home;