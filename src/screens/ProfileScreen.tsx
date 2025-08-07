import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { signOutUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { debugFirebase, testRestaurantLoading } from '../utils/debugFirebase';
import { simpleFirestoreTest, testFirestoreConnection } from '../utils/simpleTest';
import { writeTestRestaurant, writeMultipleTestRestaurants } from '../utils/directWrite';
import { addTimeSlotsToRestaurant } from '../utils/addTimeSlots';

interface ProfileScreenProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function ProfileScreen({ onShowAuth }: ProfileScreenProps) {
  const { user, userProfile, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        Alert.alert('Success', 'Signed out successfully.');
      } else {
        Alert.alert('Error', result.error || 'Sign out failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Sign out failed.');
    }
  };

  const handleDebugFirebase = async () => {
    try {
      const result = await debugFirebase();
      if (result.success) {
        Alert.alert(
          '🔍 Debug Results',
          `Simple query: ${result.simpleCount} restaurants\nActive query: ${result.activeCount} restaurants\n\nCheck console for details.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Debug Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Debug failed.', [{ text: 'OK' }]);
    }
  };

  const handleTestLoading = async () => {
    try {
      const result = await testRestaurantLoading();
      if (result.success) {
        Alert.alert(
          '🍽️ Loading Test Results',
          `Simple approach: ${result.simpleRestaurants?.length || 0} restaurants\nActive filter: ${result.activeRestaurants?.length || 0} restaurants\n\nCheck console for details.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Loading Test Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Loading test failed.', [{ text: 'OK' }]);
    }
  };

  const handleSimpleTest = async () => {
    try {
      const result = await simpleFirestoreTest();
      if (result.success) {
        Alert.alert(
          '🧪 Simple Test Results',
          `Found ${result.count} documents in restaurants collection.\n\nCheck console for details.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Simple Test Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Simple test failed.', [{ text: 'OK' }]);
    }
  };

  const handleConnectionTest = async () => {
    try {
      const result = await testFirestoreConnection();
      if (result.success) {
        Alert.alert('✅ Connection Test Passed!', 'Firestore connection is working.', [{ text: 'OK' }]);
      } else {
        Alert.alert('❌ Connection Test Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Connection test failed.', [{ text: 'OK' }]);
    }
  };

  const handleWriteTestRestaurant = async () => {
    try {
      const result = await writeTestRestaurant();
      if (result.success) {
        Alert.alert(
          '✅ Write Test Passed!', 
          `Restaurant written successfully!\nDocument ID: ${result.documentId}\n\nCheck your Feed tab now!`, 
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Write Test Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Write test failed.', [{ text: 'OK' }]);
    }
  };

  const handleWriteMultipleRestaurants = async () => {
    try {
      const result = await writeMultipleTestRestaurants();
      if (result.success) {
        Alert.alert(
          '✅ Multiple Write Test Passed!', 
          result.message + '\n\nCheck your Feed tab now!', 
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Multiple Write Test Failed', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Multiple write test failed.', [{ text: 'OK' }]);
    }
  };

  const handleAddTimeSlots = async () => {
    try {
      const success = await addTimeSlotsToRestaurant('XgNKGQcLefqTI2tINCW9');
      if (success) {
        Alert.alert(
          '✅ Time Slots Added!', 
          'Time slots have been added to your restaurant.\n\nCheck your Feed tab now!', 
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Failed to Add Time Slots', 'Check console for error details.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to add time slots.', [{ text: 'OK' }]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {userProfile?.displayName || user.displayName || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {userProfile && (
                  <Text style={styles.userMemberSince}>
                    Member since {userProfile.createdAt.toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Guest User</Text>
                <Text style={styles.userEmail}>Sign in to access your account</Text>
              </View>
            </View>
          )}
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <Pressable style={styles.settingItem} onPress={handleSignOut}>
              <Text style={styles.settingText}>Sign Out</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.settingItem} onPress={() => onShowAuth('signin')}>
              <Text style={styles.settingText}>Sign In</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Location Services</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Terms of Service</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {userProfile?.stats?.totalBookings || 0}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ${userProfile?.stats?.totalSaved || 0}
              </Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
          </View>
        </View>

        {/* Debug Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Tools</Text>
          <Pressable style={styles.settingItem} onPress={handleAddTimeSlots}>
            <Text style={styles.settingText}>Add Time Slots to Restaurant</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userMemberSince: {
    fontSize: 12,
    color: '#999',
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingArrow: {
    fontSize: 18,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ccc',
  },
}); 