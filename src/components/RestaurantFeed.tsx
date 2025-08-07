import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import BookingModal from './BookingModal';
import GoogleGIcon from './GoogleGIcon';
import { getRestaurants, getRestaurantsByCuisine, getRestaurantsByVibe, Restaurant, TimeSlot } from '../services/restaurantService';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Sample restaurant data (we'll replace with Firebase later)
const sampleRestaurants = [
  {
    id: '1',
    name: 'Sage Bistro',
    cuisine: 'Modern American',
    location: 'Downtown DC',
    discount: '-30%',
    timeSlots: ['18:00', '18:30', '19:00', '19:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Farm-to-table dining with seasonal ingredients',
    vibes: ['dining', 'brunch', 'happy-hour'],
    brunchDescription: 'Weekend brunch with bottomless mimosas and farm-fresh eggs',
    happyHourDescription: 'Craft cocktails and small plates from 4-7pm',
    happyHourDeal: '2-for-1 cocktails',
    brunchTimeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    brunchDiscountPercentage: 25
  },
  {
    id: '2', 
    name: 'Ramen House',
    cuisine: 'Japanese',
    location: 'Georgetown',
    discount: '-40%',
    timeSlots: ['12:00', '12:30', '13:00', '13:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Authentic Tokyo-style ramen and small plates',
    vibes: ['dining', 'happy-hour'],
    happyHourDescription: 'Sake specials and izakaya-style small plates',
    happyHourDeal: 'Half-price sake',
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']
  },
  {
    id: '3',
    name: 'Pizza Palace',
    cuisine: 'Italian',
    location: 'Capitol Hill',
    discount: '-25%',
    timeSlots: ['17:30', '18:00', '18:30', '19:00', '19:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Authentic Neapolitan pizza and Italian classics',
    vibes: ['dining', 'brunch'],
    brunchDescription: 'Italian-inspired brunch with wood-fired breakfast pizzas',
    brunchTimeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    brunchDiscountPercentage: 20
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    location: 'Adams Morgan',
    discount: '-35%',
    timeSlots: ['11:30', '12:00', '12:30', '13:00', '18:00', '18:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Fresh Mexican street food and margaritas',
    vibes: ['dining', 'brunch', 'happy-hour'],
    brunchDescription: 'Mexican breakfast with huevos rancheros and fresh tortillas',
    happyHourDescription: 'Margarita madness with $5 tacos',
    happyHourDeal: '$5 margaritas',
    brunchTimeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    brunchDiscountPercentage: 30
  },
  {
    id: '5',
    name: 'Thai Spice',
    cuisine: 'Thai',
    location: 'Dupont Circle',
    discount: '-20%',
    timeSlots: ['17:00', '17:30', '18:00', '18:30', '19:00'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Authentic Thai cuisine with bold flavors',
    vibes: ['dining', 'happy-hour'],
    happyHourDescription: 'Thai-inspired cocktails and spicy appetizers',
    happyHourDeal: 'Buy one get one free appetizers',
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']
  }
];

interface RestaurantFeedProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function RestaurantFeed({ onShowAuth }: RestaurantFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedVibe, setSelectedVibe] = useState('Dining');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleVibeChange = (newVibe: string) => {
    // Slide out to the right
    Animated.timing(slideAnim, {
      toValue: screenWidth, // Slide out to the right
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change vibe
      setSelectedVibe(newVibe);
      // Reset position and slide in from the left
      slideAnim.setValue(-screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0, // Slide in from left
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffset / screenHeight);
    setCurrentIndex(index);
  };

  const handleReservePress = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setShowBookingModal(true);
  };

  const handleBookingConfirmed = (bookingDetails: any) => {
    console.log('Booking confirmed:', bookingDetails);
    // Here we'll save to Firebase and process commission
    setShowBookingModal(false);
    
    // Show success message (you can customize this)
    alert(`🎉 Table reserved at ${selectedRestaurant?.name}!\nYou saved ${selectedRestaurant?.discountPercentage}%!`);
  };

  const handleTimeSlotPress = (restaurant: Restaurant, timeSlot: any) => {
    setSelectedRestaurant(restaurant);
    setSelectedTimeSlot(timeSlot.time || timeSlot);
    setShowBookingModal(true);
  };

  const cuisineTypes = ['All', 'Modern American', 'Japanese', 'Italian', 'Mexican', 'Thai'];

  // Load restaurants and location on component mount
  useEffect(() => {
    loadRestaurants();
    loadLocation();
  }, []);

  // Load restaurants when cuisine changes
  useEffect(() => {
    if (selectedVibe === 'Dining') {
      loadRestaurants();
    }
  }, [selectedCuisine]);

  // Load restaurants when vibe changes
  useEffect(() => {
    if (selectedVibe === 'Dining') {
      loadRestaurants();
    } else if (selectedVibe === 'Brunch') {
      loadRestaurantsByVibe('brunch');
    } else if (selectedVibe === 'Happy Hour') {
      loadRestaurantsByVibe('happy-hour');
    }
  }, [selectedVibe]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      let restaurantData: Restaurant[];
      if (selectedCuisine === 'All') {
        restaurantData = await getRestaurants();
      } else {
        restaurantData = await getRestaurantsByCuisine(selectedCuisine);
      }
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      // Fallback to sample data if Firebase fails
      const fallbackData: Restaurant[] = sampleRestaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        location: restaurant.location,
        address: `${restaurant.location}, DC`,
        description: restaurant.description,
        discountPercentage: parseInt(restaurant.discount.replace('-', '').replace('%', '')),
        videoUrl: restaurant.video,
        imageUrl: restaurant.video, // Using video as image for now
        rating: 4.5,
        priceRange: '$$',
        isActive: true,
        vibes: ['dining'], // Default to dining vibe for fallback data
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setRestaurants(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantsByVibe = async (vibe: string) => {
    setLoading(true);
    try {
      const restaurantData = await getRestaurantsByVibe(vibe);
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error loading restaurants by vibe:', error);
      // Fallback to sample data if Firebase fails
      const fallbackData: Restaurant[] = sampleRestaurants
        .filter(restaurant => restaurant.vibes?.includes(vibe === 'happy-hour' ? 'happy-hour' : vibe))
        .map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          location: restaurant.location,
          address: `${restaurant.location}, DC`,
          description: restaurant.description,
          discountPercentage: parseInt(restaurant.discount.replace('-', '').replace('%', '')),
          videoUrl: restaurant.video,
          imageUrl: restaurant.video, // Using video as image for now
          rating: 4.5,
          priceRange: '$$',
          isActive: true,
          vibes: restaurant.vibes || ['dining'],
          brunchDescription: restaurant.brunchDescription,
          happyHourDescription: restaurant.happyHourDescription,
          happyHourDeal: restaurant.happyHourDeal,
          brunchTimeSlots: restaurant.brunchTimeSlots,
          happyHourTimeSlots: restaurant.happyHourTimeSlots,
          brunchDiscountPercentage: restaurant.brunchDiscountPercentage,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      setRestaurants(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const loadLocation = async () => {
    try {
      console.log('🔍 Requesting location permission...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📱 Permission status:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permission to access location was denied');
        return;
      }

      console.log('📍 Getting current position...');
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      console.log('✅ Location loaded:', location.coords);
    } catch (error) {
      console.error('❌ Error loading location:', error);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort restaurants by distance if location is available
  const getSortedRestaurants = () => {
    if (!userLocation) return restaurants;
    
    return restaurants.map(restaurant => ({
      ...restaurant,
      distance: calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        restaurant.latitude || 0,
        restaurant.longitude || 0
      )
    })).sort((a, b) => (a.distance || 999) - (b.distance || 999));
  };

  // Get sorted restaurants (by distance if location available)
  const sortedRestaurants = getSortedRestaurants();
  
  // Filter restaurants based on selected cuisine (now handled by Firebase)
  const filteredRestaurants = sortedRestaurants;

  return (
    <>
      {/* Vibe Filters */}
      <View style={styles.vibeFilterContainer}>
        <View style={styles.vibeFilterRow}>
          {['Dining', 'Brunch', 'Happy Hour'].map(vibe => (
            <Pressable
              key={vibe}
              style={styles.vibeFilterItem}
              onPress={() => handleVibeChange(vibe)}
            >
              <Animated.Text style={[styles.vibeFilterText, selectedVibe === vibe && styles.vibeFilterTextActive]}>
                {vibe}
              </Animated.Text>
              {selectedVibe === vibe && <View style={styles.vibeFilterUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Cuisine Filters - Only show when Dining is selected */}
      {selectedVibe === 'Dining' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {cuisineTypes.map(cuisine => (
              <Pressable
                key={cuisine}
                style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipSelected]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <Text style={[styles.filterText, selectedCuisine === cuisine && styles.filterTextSelected]}>
                  {cuisine}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.container}
      >
        <Animated.View style={{ 
          transform: [{ translateX: slideAnim }]
        }}>
          {filteredRestaurants.map((restaurant, index) => (
            <View key={restaurant.id} style={styles.videoContainer}>
              <Video
                source={{ uri: restaurant.videoUrl }}
                style={styles.video}
                shouldPlay={index === currentIndex}
                isLooping
                isMuted={false}
                resizeMode={ResizeMode.COVER}
              />
              
              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              />
              
              {/* Restaurant info */}
              <View style={styles.info}>
                <View style={styles.restaurantDetails}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.cuisine}>
                    {selectedVibe === 'Dining' ? restaurant.cuisine : selectedVibe} • {restaurant.location}
                  </Text>
                  <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                    {selectedVibe === 'Dining' ? restaurant.description : 
                     selectedVibe === 'Brunch' ? (restaurant.brunchDescription || restaurant.description) :
                     selectedVibe === 'Happy Hour' ? (restaurant.happyHourDescription || restaurant.description) :
                     restaurant.description}
                  </Text>
                  <Text style={styles.averagePrice}>Average price ${restaurant.priceRange === '$$' ? '19' : restaurant.priceRange === '$$$' ? '35' : restaurant.priceRange === '$$$$' ? '60' : '12'}</Text>
                  
                                {/* Rating and Distance */}
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingPill}>
                    <GoogleGIcon size={12} />
                    <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    <Text style={styles.starIcon}>⭐</Text>
                  </View>
                  {userLocation && restaurant.distance && (
                    <View style={styles.distancePill}>
                      <Text style={styles.distanceText}>{restaurant.distance.toFixed(1)} miles away</Text>
                    </View>
                  )}
                </View>
                </View>
                
                                {/* Discount badge */}
                  <Pressable 
                    style={styles.discountBadge}
                    onPress={() => {
                      setSelectedRestaurant(restaurant);
                      setSelectedTimeSlot(''); // No pre-filled time
                      setShowBookingModal(true);
                    }}
                  >
                    <Text style={styles.discountText}>
                      🔥 {selectedVibe === 'Happy Hour' ? 
                          (restaurant.happyHourDeal || `-${restaurant.discountPercentage}% off food`) :
                          `-${selectedVibe === 'Brunch' ? (restaurant.brunchDiscountPercentage || restaurant.discountPercentage) : restaurant.discountPercentage}% off food`}
                    </Text>
                  </Pressable>
                
                {/* Time Slot Chips */}
                <View style={styles.timeSlotScroll}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(() => {
                      // Get vibe-specific time slots
                      let timeSlots: any[] = [];
                      let discountPercentage: number = restaurant.discountPercentage;
                      
                      if (selectedVibe === 'Dining') {
                        timeSlots = restaurant.timeSlots || [];
                      } else if (selectedVibe === 'Brunch') {
                        timeSlots = restaurant.brunchTimeSlots || restaurant.timeSlots || [];
                        discountPercentage = restaurant.brunchDiscountPercentage || restaurant.discountPercentage;
                      } else if (selectedVibe === 'Happy Hour') {
                        timeSlots = restaurant.happyHourTimeSlots || restaurant.timeSlots || [];
                      }
                      
                      // If no time slots available, use defaults based on vibe
                      if (!timeSlots || timeSlots.length === 0) {
                        if (selectedVibe === 'Brunch') {
                          timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
                        } else if (selectedVibe === 'Happy Hour') {
                          timeSlots = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];
                        } else {
                          timeSlots = ['18:00', '18:30', '19:00', '19:30'];
                        }
                      }
                      
                      return timeSlots.map((timeSlot: any, slotIndex: number) => (
                        <React.Fragment key={slotIndex}>
                          <Pressable
                            style={styles.timeSlotContainer}
                            onPress={() => handleTimeSlotPress(restaurant, timeSlot)}
                          >
                            <Text style={styles.timeSlotText}>{timeSlot.time || timeSlot}</Text>
                            <View style={styles.discountContainer}>
                              <Text style={styles.discountLabel}>
                                {selectedVibe === 'Happy Hour' ? 
                                  (restaurant.happyHourDeal ? '🔥' : `-${discountPercentage}%`) :
                                  `-${discountPercentage}%`}
                              </Text>
                            </View>
                          </Pressable>
                          {slotIndex < timeSlots.length - 1 && (
                            <View style={styles.timeSlotDivider} />
                          )}
                        </React.Fragment>
                      ));
                    })()}
                  </ScrollView>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Add the booking modal */}
      <BookingModal
        visible={showBookingModal}
        restaurant={selectedRestaurant}
        selectedTime={selectedTimeSlot}
        onClose={() => setShowBookingModal(false)}
        onBook={handleBookingConfirmed}
        onShowAuth={onShowAuth}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  vibeFilterContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  vibeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeFilterItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  vibeFilterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  vibeFilterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  vibeFilterUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  filterContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 70,
  },
  filterChipSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextSelected: {
    color: 'black',
  },

  videoContainer: {
    height: screenHeight,
    width: screenWidth,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  info: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  restaurantDetails: {
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  cuisine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  averagePrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingContainer: {
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  starIcon: {
    fontSize: 10,
  },
  distancePill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  timeSlot: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeSlotScroll: {
    marginTop: 8,
  },
  timeSlotContainer: {
    marginRight: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  timeSlotDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 6,
  },
  timeSlotText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  discountContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  discountLabel: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeSlotPlaceholder: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeSlotPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
}); 