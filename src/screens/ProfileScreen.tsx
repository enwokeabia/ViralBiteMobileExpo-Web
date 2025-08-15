import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
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
          `${result.message}\n\nCheck console for details.`,
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
          `${result.message}\n\nCheck your Feed tab now!`, 
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

  // Mock data for demonstration
  const mockBookings = [
    { time: '18:00', restaurant: 'Sage Bistro', status: 'Confirmed' },
    { time: '17:30', restaurant: 'Ramen House', status: 'Pending' },
  ];

  const mockSavedRestaurants = [
    { name: 'Le Petit Bistro', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200' },
    { name: 'Spice Garden', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200' },
  ];

  const mockHappyHourPicks = [
    { time: '4PM-7PM', deal: '$5 Appetizers', gradient: ['#667eea', '#764ba2'] as const },
    { time: '3PM-6PM', deal: '2 for 1 Cocktails', gradient: ['#f093fb', '#f5576c'] as const },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C384FF', '#ffffff']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userProfile?.displayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          {user ? (
            <>
              <Text style={styles.userName}>
                {userProfile?.displayName || user.displayName || 'User'}
              </Text>
              <Text style={styles.userBio}>
                Food enthusiast in DC
              </Text>
              <Pressable style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.userName}>Welcome to ViralBite</Text>
              <Text style={styles.userBio}>
                Sign in to save your booking history and get exclusive member perks.
              </Text>
              <Pressable style={styles.signInButton} onPress={() => onShowAuth('signin')}>
                <Text style={styles.signInText}>Log in or sign up</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* My Bookings Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
            <View style={styles.bookingCard}>
              {mockBookings.length > 0 ? (
                mockBookings.map((booking, index) => (
                  <View key={index} style={styles.bookingItem}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTime}>{booking.time}</Text>
                      <Text style={styles.bookingRestaurant}>{booking.restaurant}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: booking.status === 'Confirmed' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      <Text style={styles.statusText}>{booking.status}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBookingState}>
                  <Ionicons name="calendar-outline" size={32} color="#ccc" />
                  <Text style={styles.emptyBookingText}>No bookings yet</Text>
                  <Text style={styles.emptyBookingSubtext}>Your upcoming reservations will appear here</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Saved Restaurants Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Restaurants</Text>
            <View style={styles.restaurantGrid}>
              {mockSavedRestaurants.length > 0 ? (
                mockSavedRestaurants.map((restaurant, index) => (
                  <View key={index} style={styles.restaurantCard}>
                    <View style={styles.restaurantImageContainer}>
                      <View style={styles.restaurantImageOverlay}>
                        <Text style={styles.restaurantNameOverlay}>{restaurant.name}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRestaurantState}>
                  <Ionicons name="heart-outline" size={32} color="#ccc" />
                  <Text style={styles.emptyRestaurantText}>No saved restaurants</Text>
                  <Text style={styles.emptyRestaurantSubtext}>Restaurants you save will appear here</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Personalized Happy Hour Picks Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized Happy Hour Picks</Text>
            <View style={styles.dealsGrid}>
              {mockHappyHourPicks.map((deal, index) => (
                <LinearGradient
                  key={index}
                  colors={deal.gradient}
                  style={styles.dealCard}
                >
                  <Text style={styles.dealTime}>{deal.time}</Text>
                  <Text style={styles.dealText}>{deal.deal}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Location', 'Location settings coming soon!')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location-outline" size={20} color="#5500DB" />
              <Text style={styles.menuItemText}>Location services</Text>
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



        {/* Bottom Action Button */}
        <Pressable style={styles.nearMeButton}>
          <Ionicons name="search" size={20} color="white" />
          <Text style={styles.nearMeText}>Near Me</Text>
        </Pressable>

        {/* Bottom padding to ensure scrolling works properly */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: 'transparent',
  },
  contentContainer: {
    backgroundColor: 'transparent',
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5500DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  editProfileButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editProfileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#5500DB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  // Bookings
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emptyBookingState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyBookingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  emptyBookingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  bookingRestaurant: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Saved Restaurants
  restaurantGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restaurantCard: {
    width: '48%',
    alignItems: 'center',
  },
  restaurantImageContainer: {
    width: '100%',
    height: 120,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#5500DB',
  },
  restaurantImageOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 12,
  },
  restaurantNameOverlay: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptyRestaurantState: {
    alignItems: 'center',
    paddingVertical: 32,
    width: '100%',
  },
  emptyRestaurantText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  emptyRestaurantSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },

  // Happy Hour Picks
  dealsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dealCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dealTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dealText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Menu Items
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
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
  },
  signOutText: {
    color: '#FF6B6B',
  },

  // Near Me Button
  nearMeButton: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  nearMeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  bottomPadding: {
    height: 120,
  },
}); 