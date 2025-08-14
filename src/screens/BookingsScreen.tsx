import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Modal, Animated, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';
import AuthGate from '../components/AuthGate';
import { getUserBookings, Booking, getRestaurantById } from '../services/restaurantService';

const { width: screenWidth } = Dimensions.get('window');



interface BookingsScreenProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function BookingsScreen({ onShowAuth }: BookingsScreenProps) {
  const { isAuthenticated, userProfile } = useAuth();
  const auth = getAuth();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantImages, setRestaurantImages] = useState<{[key: string]: string}>({});

  // Fetch user bookings from Firebase
  useEffect(() => {
    const fetchBookings = async () => {
      console.log('🔍 Debug: isAuthenticated:', isAuthenticated);
      console.log('🔍 Debug: userProfile:', userProfile);
      console.log('🔍 Debug: auth.currentUser:', auth.currentUser);
      console.log('🔍 Debug: auth.currentUser?.uid:', auth.currentUser?.uid);
      
      // Use Firebase Auth UID instead of userProfile UID
      const userId = auth.currentUser?.uid;
      
      if (!isAuthenticated || !userId) {
        console.log('❌ Debug: Not authenticated or no UID');
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔍 Debug: Fetching bookings for UID:', userId);
        const userBookings = await getUserBookings(userId);
        console.log('✅ Debug: Fetched bookings:', userBookings);
        setBookings(userBookings);
        
        // Fetch restaurant images for each booking
        const imagePromises = userBookings.map(async (booking) => {
          try {
            const restaurant = await getRestaurantById(booking.restaurantId);
            return { restaurantId: booking.restaurantId, imageUrl: restaurant?.imageUrl || '' };
          } catch (error) {
            console.error('❌ Error fetching restaurant image:', error);
            return { restaurantId: booking.restaurantId, imageUrl: '' };
          }
        });
        
        const images = await Promise.all(imagePromises);
        const imageMap: {[key: string]: string} = {};
        images.forEach(img => {
          if (img.imageUrl) {
            imageMap[img.restaurantId] = img.imageUrl;
          }
        });
        
        setRestaurantImages(imageMap);
      } catch (error) {
        console.error('❌ Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, auth.currentUser?.uid]);

  // Filter bookings based on selected tab
  const currentBookings = bookings.filter(booking => {
    console.log('🔍 Debug: Filtering booking:', booking);
    console.log('🔍 Debug: Booking date:', booking.date);
    
    // Parse the booking date - handle both string and Date formats
    let bookingDate: Date;
    if (typeof booking.date === 'string') {
      // If it's a string like "2025-08-11", create a proper date
      const [year, month, day] = booking.date.split('-').map(Number);
      bookingDate = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      bookingDate = new Date(booking.date);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔍 Debug: Booking date parsed:', bookingDate);
    console.log('🔍 Debug: Today:', today);
    console.log('🔍 Debug: Selected tab:', selectedTab);
    
    const isUpcoming = bookingDate >= today;
    console.log('🔍 Debug: Is upcoming?', isUpcoming);
    
    if (selectedTab === 'upcoming') {
      return isUpcoming;
    } else {
      return !isUpcoming;
    }
  });
  
  console.log('🔍 Debug: Total bookings:', bookings.length);
  console.log('🔍 Debug: Current bookings (filtered):', currentBookings.length);

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const handleGetDirections = () => {
    console.log('🔍 Get Directions button pressed!');
    console.log('🔍 Selected booking:', selectedBooking);
    console.log('🔍 Restaurant location:', selectedBooking?.restaurantLocation);
    
    // Close the booking modal first, then open map modal
    setModalVisible(false);
    setTimeout(() => {
      setMapModalVisible(true);
    }, 100); // Much faster transition
  };

  const openInAppleMaps = async () => {
    console.log('🔍 Opening Apple Maps...');
    if (selectedBooking?.restaurantId) {
      try {
        // Fetch the restaurant to get the full address
        const restaurant = await getRestaurantById(selectedBooking.restaurantId);
        const fullAddress = restaurant?.address || selectedBooking.restaurantLocation;
        
        if (fullAddress) {
          const address = encodeURIComponent(fullAddress);
          console.log('🔍 Using full address:', fullAddress);
          
          const url = `http://maps.apple.com/?address=${address}`;
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            // Fallback to general Apple Maps
            await Linking.openURL(`http://maps.apple.com/?q=${address}`);
          }
        } else {
          console.log('❌ No restaurant address available');
        }
      } catch (error) {
        console.error('Error fetching restaurant address:', error);
      }
    } else {
      console.log('❌ No restaurant ID available');
    }
    setMapModalVisible(false);
  };

  const openInGoogleMaps = async () => {
    console.log('🔍 Opening Google Maps...');
    if (selectedBooking?.restaurantId) {
      try {
        // Fetch the restaurant to get the full address
        const restaurant = await getRestaurantById(selectedBooking.restaurantId);
        const fullAddress = restaurant?.address || selectedBooking.restaurantLocation;
        
        if (fullAddress) {
          const address = encodeURIComponent(fullAddress);
          console.log('🔍 Using full address:', fullAddress);
          
          const url = `https://maps.google.com/?q=${address}`;
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            // Fallback to web version
            await Linking.openURL(`https://www.google.com/maps/search/${address}`);
          }
        } else {
          console.log('❌ No restaurant address available');
        }
      } catch (error) {
        console.error('Error fetching restaurant address:', error);
      }
    } else {
      console.log('❌ No restaurant ID available');
    }
    setMapModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  // Show authentication gate if user is not signed in
  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Your Reservations"
        subtitle="Sign in to view and manage your upcoming restaurant bookings"
        ctaText="Sign In to View Bookings"
        onSignIn={() => onShowAuth('signin')}
        icon="calendar"
        gradient={['#5500DB', '#C384FF']}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={24} color="#8B5CF6" />
        </View>
        
        {/* Tab Segments */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
            onPress={() => setSelectedTab('past')}
          >
            <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
              Past
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="search" size={24} color="#8B5CF6" />
        </View>
      </View>

      

             {/* Bookings List */}
       <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
         {loading ? (
           <View style={styles.loadingContainer}>
             <Text style={styles.loadingText}>Loading your bookings...</Text>
           </View>
         ) : currentBookings.length === 0 ? (
           <View style={styles.emptyContainer}>
             <Ionicons name="calendar-outline" size={48} color="#8B5CF6" />
             <Text style={styles.emptyText}>
               {selectedTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
             </Text>
           </View>
         ) : (
           currentBookings.map(booking => (
          <Pressable
            key={booking.id}
            style={styles.bookingCard}
            onPress={() => handleBookingPress(booking)}
          >
            {/* Restaurant Image Background */}
            <View style={styles.cardBackground}>
              {restaurantImages[booking.restaurantId] ? (
                <Image
                  source={{ uri: restaurantImages[booking.restaurantId] }}
                  style={styles.restaurantImage}
                  resizeMode="cover"
                />
              ) : null}
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
              />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              {/* Top Row */}
              <View style={styles.cardHeader}>
                <View style={styles.restaurantInfo}>
                  <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>VB</Text>
                  </View>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {booking.restaurantName}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon(booking.status) as any} 
                    size={16} 
                    color={getStatusColor(booking.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>

              {/* Date and Time */}
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeText}>
                  {booking.date} at {booking.time}
                </Text>
              </View>

              {/* Bottom Row */}
              <View style={styles.cardFooter}>
                                 <Text style={styles.bookingNumber}>{booking.bookingNumber || booking.id}</Text>
                <View style={styles.guestInfo}>
                  <Text style={styles.guestText}>{booking.guestCount}x</Text>
                  <Ionicons name="people" size={16} color="white" />
                </View>
              </View>
            </View>
                       </Pressable>
           ))
         )}
       </ScrollView>

      {/* Booking Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Your Booking</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.modalDoneButton}>Done</Text>
              </Pressable>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Booking Card */}
                <View style={styles.modalBookingCard}>
                  <View style={styles.modalCardBackground}>
                    {restaurantImages[selectedBooking.restaurantId] ? (
                      <Image
                        source={{ uri: restaurantImages[selectedBooking.restaurantId] }}
                        style={styles.modalRestaurantImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={styles.modalGradient}
                    />
                  </View>
                  
                  <View style={styles.modalCardContent}>
                    <View style={styles.modalCardHeader}>
                      <Text style={styles.modalBookingNumber}>
                        {selectedBooking.bookingNumber || selectedBooking.id}
                      </Text>
                      <View style={styles.modalGuestBadge}>
                        <Text style={styles.modalGuestText}>{selectedBooking.guestCount}x</Text>
                        <Ionicons name="people" size={16} color="white" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Show QR Code Button */}
                <Pressable style={styles.qrCodeButton}>
                  <Ionicons name="qr-code" size={20} color="white" />
                  <Text style={styles.qrCodeButtonText}>Show QR Code</Text>
                </Pressable>

                {/* Booking Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Booking Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Restaurant</Text>
                    <Text style={styles.detailValue}>{selectedBooking.restaurantName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>{selectedBooking.date} at {selectedBooking.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guests</Text>
                    <Text style={styles.detailValue}>{selectedBooking.guestCount} people</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedBooking.restaurantLocation || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Discount</Text>
                    <Text style={styles.detailValue}>{selectedBooking.discountPercentage}% off</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusDetail}>
                      <Ionicons 
                        name={getStatusIcon(selectedBooking.status) as any} 
                        size={16} 
                        color={getStatusColor(selectedBooking.status)} 
                      />
                      <Text style={[styles.detailValue, { color: getStatusColor(selectedBooking.status) }]}>
                        {selectedBooking.status}
            </Text>
                    </View>
                  </View>
                </View>

                {/* Action Items */}
                <View style={styles.actionSection}>
                  <Pressable style={styles.actionItem}>
                    <Text style={styles.actionText}>Add to Calendar</Text>
                    <Ionicons name="calendar" size={20} color="#8B5CF6" />
                  </Pressable>
                  <View style={styles.actionDivider} />
                  <Pressable 
                    style={({ pressed }) => [
                      styles.actionItem,
                      pressed && styles.actionItemPressed
                    ]} 
                    onPress={handleGetDirections}
                  >
                    <Text style={styles.actionText}>Get Directions</Text>
                    <Ionicons name="location" size={20} color="#8B5CF6" />
                  </Pressable>
                </View>

                {/* Help Section */}
                <View style={styles.actionSection}>
                  <Pressable style={styles.actionItem}>
                    <Text style={styles.actionText}>Help with my Booking</Text>
                    <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Map Selection Modal */}
      <Modal
        visible={mapModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle}>Get Directions</Text>
              <Pressable onPress={() => setMapModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            <View style={styles.mapButtonsContainer}>
              <Pressable style={styles.mapButton} onPress={openInAppleMaps}>
                <Ionicons name="open-outline" size={24} color="#000" />
                <Text style={styles.mapButtonText}>View in Apple Maps</Text>
              </Pressable>
              
              <Pressable style={styles.mapButton} onPress={openInGoogleMaps}>
                <Ionicons name="open-outline" size={24} color="#000" />
                <Text style={styles.mapButtonText}>View in Google Maps</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    width: 40,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },

  bookingsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6', // Fallback color
  },
  restaurantImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateTimeContainer: {
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  statusDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B5CF6',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalCancelButton: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalDoneButton: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalBookingCard: {
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#8B5CF6',
  },
  modalCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalRestaurantImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBookingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalGuestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalGuestText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  qrCodeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionItemPressed: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  actionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  breakdownSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 16,
    color: 'white',
    marginRight: 20,
  },
  breakdownPrice: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  detailsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Map Modal Styles
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  mapModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  mapModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapButtonsContainer: {
    gap: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
}); 