import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Home = () => {
  const [userName, setUserName] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  });

  useEffect(() => {
    if (showProfileModal) {
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      modalScaleAnim.setValue(0);
    }
  });

  const fetchUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
        setUserRole(user.role || 'student');
        console.log('👤 User data loaded:', user);
      } else {
        setUserName('User');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserName('User');
    }
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleCloseModal = () => {
    Animated.timing(modalScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowProfileModal(false);
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out...');
              
              // Clear all session data
              await AsyncStorage.multiRemove([
                'authToken',
                'user',
                'userRole',
              ]);
              
              console.log('✅ Session cleared');
              
              // Close modal
              setShowProfileModal(false);
              
              // Navigate to login
              router.replace('/Login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBusPress = () => {
    router.push('/Map');
  };
  
  const handleContactsPress = () => { 
    console.log('Contacts pressed');
  };
  
  const handleSOSPress = () => { 
    console.log('SOS pressed');
  };
  
  const handleInfoPress = () => { 
    console.log('Info pressed');
  };

  const MenuCard = ({ children, style, onPress, animValue, colors }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          {
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
              { scale: scaleAnim },
            ],
          },
          style,
        ]}
      >
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={styles.touchableFix}
          >
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardContent}
            >
              {children}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.backgroundGradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Card */}
          <Animated.View
            style={[
              styles.headerCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#2C3E50', '#34495E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              {/* Decorative Circles */}
              <View style={styles.circleTopLeft} />
              <View style={styles.circleBottomRight} />
              <View style={styles.circleBottomLeft} />
              
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.instituteName}>
                    BMS Institute of Technology
                  </Text>
                  <Text style={styles.userName}>{userName}</Text>
                </View>

                {/* Profile Avatar Circle - Clickable */}
                <TouchableOpacity 
                  onPress={handleProfilePress}
                  activeOpacity={0.8}
                  style={styles.avatarContainer}
                >
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>
                      {userName.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {/* Bus Tracking */}
            <MenuCard
              animValue={cardAnims[0]}
              onPress={handleBusPress}
              style={styles.menuItem}
              colors={['#E8F5E9', '#C8E6C9']}
            >
              <Image
                source={require('../assets/images/Bus_icon.png')}
                style={styles.menuImage}
              />
              <Text style={styles.menuTitle}>Track Bus</Text>
            </MenuCard>

            {/* Chats */}
            <MenuCard
              animValue={cardAnims[1]}
              onPress={handleContactsPress}
              style={styles.menuItem}
              colors={['#E3F2FD', '#BBDEFB']}
            >
              <Image
                source={require('../assets/images/Chat.png')}
                style={styles.menuImage}
              />
              <Text style={styles.menuTitle}>Chat</Text>
            </MenuCard>

            {/* SOS */}
            <MenuCard
              animValue={cardAnims[2]}
              onPress={handleSOSPress}
              style={styles.menuItem}
              colors={['#FFEBEE', '#FFCDD2']}
            >
              <Image
                source={require('../assets/images/sos.png')}
                style={styles.menuImage}
              />
              <Text style={styles.menuTitle}>Emergency</Text>
            </MenuCard>

            {/* Info */}
            <MenuCard
              animValue={cardAnims[3]}
              onPress={handleInfoPress}
              style={styles.menuItem}
              colors={['#FFF8E1', '#FFECB3']}
            >
              <Image
                source={require('../assets/images/Information.png')}
                style={styles.menuImage}
              />
              <Text style={styles.menuTitle}>Information</Text>
            </MenuCard>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close-circle" size={32} color="#6b7280" />
              </TouchableOpacity>

              {/* Profile Avatar */}
              <View style={styles.modalAvatarContainer}>
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.modalAvatarGradient}
                >
                  <Text style={styles.modalAvatarText}>
                    {userName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
              </View>

              {/* User Info */}
              <Text style={styles.modalUserName}>{userName}</Text>
              <Text style={styles.modalUserEmail}>{userEmail}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.modalDivider} />

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerCard: {
    marginBottom: 30,
    borderRadius: 30,
    overflow: 'hidden',
    height: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerGradient: {
    flex: 1,
    position: 'relative',
  },
  circleTopLeft: {
    position: 'absolute',
    top: -50,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderWidth: 3,
    borderColor: '#3498DB',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    zIndex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  instituteName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 60) / 2,
    marginBottom: 20,
  },
  menuImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 8,
    resizeMode: 'contain',
  },
  menuTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bottomSpace: {
    height: 20,
  },
  cardWrapper: {
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  touchableFix: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    width: width - 80,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 10,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  roleBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Home;