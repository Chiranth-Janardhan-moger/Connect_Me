import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
// 1. Import SafeAreaView from the correct package
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- FIX 1
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Adjust this import path to your apiService.js file
import { apiCall, authAPI, adminAPI } from '../src/config/api'; 
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

// API endpoints for admin actions
const ADMIN_ENDPOINTS = {
  ADD_STUDENT: '/api/admin/add-student',
  ADD_DRIVER: '/api/admin/add-driver',
  ADD_ROUTE: '/api/admin/add-route',
};

export default function AdminDashboard() {
  const router = useRouter(); 

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState(null); 

  // State for Add Student form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentRouteNumber, setStudentRouteNumber] = useState('');

  // State for Add Driver form
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverRouteNumber, setDriverRouteNumber] = useState('');
  const [driverBusNumber, setDriverBusNumber] = useState('');

  // State for Add Route form
  const [routeNumber, setRouteNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeStops, setRouteStops] = useState('');

  // State for available routes
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Connectivity
  const [isOffline, setIsOffline] = useState(false);

  // Users listing
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState('students'); // 'students' | 'drivers'
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  // --- Clear Form Inputs ---
  const clearStudentForm = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('');
    setStudentRollNo('');
    setStudentRouteNumber('');
  };

  const clearDriverForm = () => {
    setDriverName('');
    setDriverEmail('');
    setDriverPassword('');
    setDriverLicense('');
    setDriverRouteNumber('');
    setDriverBusNumber('');
  };
  
  const clearRouteForm = () => {
    setRouteNumber('');
    setRouteName('');
    setRouteStops('');
  };

  // --- API Handlers ---

  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const { ok, data } = await adminAPI.getRoutes();
      if (ok) {
        setAvailableRoutes(data.routes || []);
      } else {
        Alert.alert('Error', 'Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const [studentsResp, driversResp] = await Promise.all([
        adminAPI.getUsers?.('student'),
        adminAPI.getUsers?.('driver'),
      ]);
      if (studentsResp?.ok) setStudents(studentsResp.data.users || []);
      if (driversResp?.ok) setDrivers(driversResp.data.users || []);
      if (!studentsResp?.ok && !driversResp?.ok) {
        Alert.alert('Info', 'User listing API not available.');
      }
    } catch (e) {
      console.error('Error fetching users', e);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddStudent = async () => {
    // Validate all fields including route number
    if (!studentName || !studentEmail || !studentPassword || !studentRollNo || !studentRouteNumber) {
      Alert.alert('Error', 'Please fill all student fields, including Route Number.');
      return;
    }
    
    // Validate route number is a positive integer
    const routeNum = parseInt(studentRouteNumber);
    if (isNaN(routeNum) || routeNum <= 0) {
      Alert.alert('Error', 'Route number must be a positive integer (e.g., 1, 2, 12).');
      return;
    }

    const { ok, data } = await apiCall(ADMIN_ENDPOINTS.ADD_STUDENT, {
      method: 'POST',
      body: JSON.stringify({
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        rollNumber: studentRollNo,
        routeNumber: routeNum,
      }),
    });

    if (ok) {
      Alert.alert('Success', data.message || 'Student added successfully!');
      clearStudentForm();
      setModalVisible(false);
    } else {
      Alert.alert('Error', data.message || 'Failed to add student.');
    }
  };

  const handleAddDriver = async () => {
    if (!driverName || !driverEmail || !driverPassword || !driverLicense || !driverRouteNumber || !driverBusNumber) {
      Alert.alert('Error', 'Please fill all driver fields including Route Number and Bus Number.');
      return;
    }

    // Validate route number is a positive integer
    const routeNum = parseInt(driverRouteNumber);
    if (isNaN(routeNum) || routeNum <= 0) {
      Alert.alert('Error', 'Route number must be a positive integer (e.g., 1, 2, 12).');
      return;
    }

    const { ok, data } = await apiCall(ADMIN_ENDPOINTS.ADD_DRIVER, {
      method: 'POST',
      body: JSON.stringify({
        name: driverName,
        email: driverEmail,
        password: driverPassword,
        licenseNumber: driverLicense,
        routeNumber: routeNum,
        busNumber: driverBusNumber,
      }),
    });

    if (ok) {
      Alert.alert('Success', data.message || 'Driver added successfully!');
      clearDriverForm();
      setModalVisible(false);
    } else {
      Alert.alert('Error', data.message || 'Failed to add driver.');
    }
  };

  const handleAddRoute = async () => {
    if (!routeNumber || !routeName || !routeStops) {
      Alert.alert('Error', 'Please fill all route fields including Route Number.');
      return;
    }

    // Validate route number is a positive integer
    const routeNum = parseInt(routeNumber);
    if (isNaN(routeNum) || routeNum <= 0) {
      Alert.alert('Error', 'Route number must be a positive integer (e.g., 1, 2, 12).');
      return;
    }

    const stopsArray = routeStops.split(',').map(stop => stop.trim());
    const { ok, data } = await apiCall(ADMIN_ENDPOINTS.ADD_ROUTE, {
      method: 'POST',
      body: JSON.stringify({
        routeNumber: routeNum,
        name: routeName,
        stops: stopsArray,
      }),
    });

    if (ok) {
      Alert.alert('Success', data.message || 'Route added successfully!');
      clearRouteForm();
      setModalVisible(false);
    } else {
      Alert.alert('Error', data.message || 'Failed to add route.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out...');
              await authAPI.logout(); 
              await AsyncStorage.multiRemove([
                'authToken',
                'user',
                'userRole',
              ]);
              console.log('✅ Session cleared');
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

  // --- Modal Content Renderer ---
  const renderModalContent = () => {
    switch (formType) {
      case 'select':
        return (
          <View>
            <Text style={styles.modalTitle}>Add New User</Text>
            <Text style={styles.modalSubtitle}>What kind of user do you want to add?</Text>
            <Pressable
              style={[styles.button, { backgroundColor: '#007bff' }]}
              onPress={() => setFormType('student')}
            >
              <Text style={styles.buttonText}>Add Student</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: '#28a745' }]}
              onPress={() => setFormType('driver')}
            >
              <Text style={styles.buttonText}>Add Driver</Text>
            </Pressable>
          </View>
        );
      
      case 'student':
        return (
          <View>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <TextInput
              style={styles.input}
              placeholder="Student Name"
              placeholderTextColor="#6b7280"
              value={studentName}
              onChangeText={setStudentName}
            />
            <TextInput
              style={styles.input}
              placeholder="Student Email"
              placeholderTextColor="#6b7280"
              value={studentEmail}
              onChangeText={setStudentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6b7280"
              value={studentPassword}
              onChangeText={setStudentPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Roll Number"
              placeholderTextColor="#6b7280"
              value={studentRollNo}
              onChangeText={setStudentRollNo}
            />
            <TextInput
              style={styles.input}
              placeholder="Route Number (e.g., 1, 2, 12)"
              placeholderTextColor="#6b7280"
              value={studentRouteNumber}
              onChangeText={setStudentRouteNumber}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Pressable style={styles.button} onPress={handleAddStudent}>
              <Text style={styles.buttonText}>Create Student</Text>
            </Pressable>
          </View>
        );

      case 'driver':
        return (
          <View>
            <Text style={styles.modalTitle}>Add New Driver</Text>
            <TextInput
              style={styles.input}
              placeholder="Driver Name"
              placeholderTextColor="#6b7280"
              value={driverName}
              onChangeText={setDriverName}
            />
            <TextInput
              style={styles.input}
              placeholder="Driver Email"
              placeholderTextColor="#6b7280"
              value={driverEmail}
              onChangeText={setDriverEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6b7280"
              value={driverPassword}
              onChangeText={setDriverPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="License Number"
              placeholderTextColor="#6b7280"
              value={driverLicense}
              onChangeText={setDriverLicense}
            />
            <TextInput
              style={styles.input}
              placeholder="Route Number (e.g., 1, 2, 12)"
              placeholderTextColor="#6b7280"
              value={driverRouteNumber}
              onChangeText={setDriverRouteNumber}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Bus Number (e.g., CB-101)"
              placeholderTextColor="#6b7280"
              value={driverBusNumber}
              onChangeText={setDriverBusNumber}
              autoCapitalize="none"
            />
            <Pressable style={styles.button} onPress={handleAddDriver}>
              <Text style={styles.buttonText}>Create Driver</Text>
            </Pressable>
          </View>
        );

      case 'route':
        return (
          <View>
            <Text style={styles.modalTitle}>Add New Route</Text>
            <TextInput
              style={styles.input}
              placeholder="Route Number (e.g., 1, 2, 12)"
              placeholderTextColor="#6b7280"
              value={routeNumber}
              onChangeText={setRouteNumber}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Route Name (e.g., 'Route-1')"
              placeholderTextColor="#6b7280"
              value={routeName}
              onChangeText={setRouteName}
            />
            <TextInput
              style={styles.input}
              placeholder="Stops (comma-separated, e.g., Stop1, Stop2)"
              placeholderTextColor="#6b7280"
              value={routeStops}
              onChangeText={setRouteStops}
            />
            <Pressable style={styles.button} onPress={handleAddRoute}>
              <Text style={styles.buttonText}>Create Route</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  // --- Main Render ---
  return (
    // FIX 1: This component is now imported from the new package
    <SafeAreaView style={styles.safeArea}> 
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline</Text>
        </View>
      )}
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={30} color="#dc3545" />
          </TouchableOpacity>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          <MenuCard
            title="Add New User"
            icon="person-add-outline"
            colors={['#007bff', '#0056b3']}
            onPress={() => {
              setFormType('select');
              setModalVisible(true);
            }}
          />
          <MenuCard
            title="Add New Route"
            icon="map-outline"
            colors={['#28a745', '#19692c']}
            onPress={() => {
              setFormType('route');
              setModalVisible(true);
            }}
          />
          <MenuCard
            title="Manage Buses"
            icon="bus-outline"
            colors={['#ffc107', '#b38600']}
            onPress={() => Alert.alert('Not Implemented')}
          />
          <MenuCard
            title="View All Users"
            icon="people-outline"
            colors={['#17a2b8', '#0f6674']}
            onPress={() => { setUsersModalVisible(true); fetchUsers(); }}
          />
        </View>
      </ScrollView>

      {/* --- Add/Edit Modal --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#6b7280" />
            </TouchableOpacity>
            
            {renderModalContent()}

          </Pressable>
        </Pressable>
      </Modal>

      {/* Users Modal */}
      <Modal
        visible={usersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsersModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setUsersModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setUsersModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All Users</Text>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeUserTab === 'students' && styles.tabActive]}
                onPress={() => setActiveUserTab('students')}
              >
                <Text style={[styles.tabText, activeUserTab === 'students' && styles.tabTextActive]}>Students</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeUserTab === 'drivers' && styles.tabActive]}
                onPress={() => setActiveUserTab('drivers')}
              >
                <Text style={[styles.tabText, activeUserTab === 'drivers' && styles.tabTextActive]}>Drivers</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {loadingUsers ? (
                <Text style={{ color: '#111', textAlign: 'center' }}>Loading...</Text>
              ) : (
                (activeUserTab === 'students' ? students : drivers).map((u) => (
                  <View key={u._id || u.email} style={styles.userRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
                      <Text style={styles.userSub}>{u.email}</Text>
                    </View>
                    {u.routeNumber ? (
                      <View style={styles.pill}><Text style={styles.pillText}>Route {u.routeNumber}</Text></View>
                    ) : null}
                    <TouchableOpacity
                      style={{ marginLeft: 12 }}
                      onPress={async () => {
                        Alert.alert(
                          'Delete User',
                          `Are you sure you want to delete ${u.name || 'this user'}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                const resp = await adminAPI.deleteUser(u._id);
                                if (resp.ok) {
                                  fetchUsers();
                                } else {
                                  Alert.alert('Error', resp.data?.message || 'Failed to delete user');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// --- Card Component ---
const MenuCard = ({ title, icon, colors, onPress }) => (
  <TouchableOpacity style={styles.cardWrapper} onPress={onPress}>
    <LinearGradient colors={colors} style={styles.cardContent}>
      <Ionicons name={icon} size={48} color="#fff" />
      <Text style={styles.cardTitle}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutIcon: {
    padding: 5,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: (width - 60) / 2, // 20 padding on each side, 20 gap
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    height: 160,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    borderRadius: 20,
    padding: 30,
    paddingTop: 45, // Make space for close button
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  userSub: {
    color: '#6b7280',
    fontSize: 13,
  },
  pill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
});