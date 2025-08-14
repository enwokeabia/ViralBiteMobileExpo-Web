import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
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
          },
        },
      ]
    );
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your profile</Text>
          {!user && (
            <Text style={styles.subtitle}>
              Sign in to save your booking history and get exclusive member perks.
            </Text>
          )}
        </View>

        {/* Sign In Button for Guests */}
        {!user && (
          <Pressable style={styles.signInButton} onPress={() => onShowAuth('signin')}>
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              style={styles.gradient}
            >
              <Text style={styles.signInText}>Log in or sign up</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* User Info for Authenticated Users */}
        {user && (
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userProfile?.displayName || user.displayName || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Booking Stats Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your activity</Text>
            
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="calendar-outline" size={16} color="white" />
                </View>
                <Text style={styles.menuItemText}>Total bookings</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{userProfile?.stats?.totalBookings || 0}</Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="wallet-outline" size={16} color="white" />
                </View>
                <Text style={styles.menuItemText}>Total saved</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>${userProfile?.stats?.totalSaved || 0}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Location', 'Location settings coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Location services</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Cuisine Preferences', 'Cuisine preferences coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="restaurant-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Cuisine preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Help Center', 'Help center coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Help center</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Contact Us', 'Contact us coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Contact us</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('About ViralBite', 'About ViralBite coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>About ViralBite</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Personal Details', 'Personal details coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Personal details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Terms of Service', 'Terms of service coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </Pressable>

          {user && (
            <Pressable style={styles.menuItem} onPress={handleSignOut}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.menuItemText, styles.signOutText]}>Sign out</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </Pressable>
          )}
        </View>

        {/* Debug Section (only for authenticated users) */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>
            <Pressable style={styles.menuItem} onPress={handleAddTimeSlots}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="code-slash-outline" size={20} color="#666" />
                <Text style={styles.menuItemText}>Add Time Slots</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </Pressable>
          </View>
        )}

        {/* Bottom padding to ensure scrolling works properly */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  signInButton: {
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5500DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5500DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  signOutText: {
    color: '#FF6B6B',
  },
  badge: {
    backgroundColor: '#5500DB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 120, // Provides enough space for bottom navigation and safe area
  },
}); 