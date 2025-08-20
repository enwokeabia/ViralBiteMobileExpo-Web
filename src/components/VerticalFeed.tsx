// ==============================
// File: VerticalFeed.tsx
// Vertical full-screen paged feed + autoplay + booking modal
// ==============================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView, Animated, Linking, Share } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BookingModal from './BookingModal';
import GoogleGIcon from './GoogleGIcon';
import ShareIcon from './ShareIcon';
import * as Location from 'expo-location';
import { getRestaurants, getRestaurantsByCuisine, getRestaurantsByVibe, Restaurant } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { saveRestaurant, unsaveRestaurant, getSavedRestaurantIds } from '../services/savedRestaurantsService';

import VideoPlayer from './VideoPlayer';

const { height: H, width: W } = Dimensions.get('window');

// Modern Deal Card Component
const DealCard = ({ deal, type, isVisible }: { deal: string; type: 'drink' | 'food'; isVisible: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Always show the card when isVisible is true, with a slight delay for staggered effect
    if (isVisible) {
      const delay = Math.random() * 150; // Reduced delay for snappier feel
      
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const getTypeConfig = () => {
    switch (type) {
      case 'drink':
        return { 
          emoji: '🍷', 
          color: 'white', 
          bgColor: 'linear-gradient(90deg, #672bbd, #498573)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        };
      case 'food':
        return { 
          emoji: '🍽️', 
          color: 'white', 
          bgColor: 'linear-gradient(90deg, #f5720a, #8a3698)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        };
      default:
        return { 
          emoji: '💫', 
          color: 'white', 
          bgColor: 'linear-gradient(90deg, #672bbd, #498573)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.dealCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={config.bgColor === 'linear-gradient(90deg, #672bbd, #498573)' 
          ? ['#672bbd', '#498573'] 
          : ['#f5720a', '#8a3698']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.dealCardGradient]}
      >
        <Text style={[styles.dealEmoji, { color: config.color }]}>{config.emoji}</Text>
        <Text style={[styles.dealText, { color: config.color }]}>{deal}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// local fallback data for resiliency
const sampleRestaurants = [
  {
    id: '1',
    name: 'Sage Bistro',
    cuisine: 'American',
    cuisines: ['American', 'Mediterranean'], // Multiple cuisines for fusion
    location: 'Downtown DC',
    discount: '-30%',
    timeSlots: ['18:00', '18:30', '19:00', '19:30'],
    video: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Test video with audio
    description: 'Farm-to-table dining with seasonal ingredients',
    vibes: ['dining', 'brunch', 'happy-hour'],
    brunchDescription: 'Weekend brunch with bottomless mimosas and farm-fresh eggs - trendy rooftop dining experience',
    happyHourDescription: 'Craft cocktails and small plates from 4-7pm',
    happyHourDeal: '2-for-1 cocktails',
    brunchTimeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    brunchDiscountPercentage: 25,
    isPopular: true, // Popular restaurant
    // Happy Hour deal data
    happyHourStartTime: '16:00',
    happyHourEndTime: '19:00',
    happyHourDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    drinkDeals: {
      cocktails: { enabled: true, price: 6 },
      beer: { enabled: true, price: 5 },
      wine: { enabled: true, price: 7 },
      sake: { enabled: false, price: 0 }
    },
    foodDeals: {
      wings: { enabled: false, price: 0 },
      tacos: { enabled: false, price: 0 },
      sliders: { enabled: true, price: 7 },
      nachos: { enabled: false, price: 0 },
      fries: { enabled: false, price: 0 },
      pizza: { enabled: false, price: 0 }
    }
  },
  {
    id: '2',
    name: 'Ramen House',
    cuisine: 'Japanese',
    cuisines: ['Japanese', 'Korean'], // Fusion Japanese-Korean
    location: 'Georgetown',
    discount: '-40%',
    timeSlots: ['12:00', '12:30', '13:00', '13:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Authentic Tokyo-style ramen and small plates',
    vibes: ['dining', 'happy-hour'],
    happyHourDescription: 'Sake specials and izakaya-style small plates',
    happyHourDeal: 'Half-price sake',
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    // Happy Hour deal data
    happyHourStartTime: '16:00',
    happyHourEndTime: '19:00',
    happyHourDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    drinkDeals: {
      cocktails: { enabled: false, price: 0 },
      beer: { enabled: true, price: 5 },
      wine: { enabled: true, price: 6 },
      sake: { enabled: true, price: 4 }
    },
    foodDeals: {
      wings: { enabled: false, price: 0 },
      tacos: { enabled: false, price: 0 },
      sliders: { enabled: false, price: 0 },
      nachos: { enabled: false, price: 0 },
      fries: { enabled: false, price: 0 },
      pizza: { enabled: false, price: 0 }
    }
  },
  {
    id: '3',
    name: 'Spice Garden',
    cuisine: 'Indian',
    cuisines: ['Indian', 'Thai'], // Fusion Indian-Thai
    location: 'Adams Morgan',
    discount: '-25%',
    timeSlots: ['18:00', '18:30', '19:00', '19:30', '20:00'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Modern Indian cuisine with Thai influences',
    vibes: ['dining', 'happy-hour'],
    happyHourDescription: 'Craft cocktails and fusion small plates',
    happyHourDeal: '2-for-1 appetizers',
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
    isPopular: true, // Popular restaurant
    // Happy Hour deal data
    happyHourStartTime: '16:00',
    happyHourEndTime: '19:00',
    happyHourDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    drinkDeals: {
      cocktails: { enabled: true, price: 5 },
      beer: { enabled: true, price: 4 },
      wine: { enabled: true, price: 6 },
      sake: { enabled: false, price: 0 }
    },
    foodDeals: {
      wings: { enabled: false, price: 0 },
      tacos: { enabled: false, price: 0 },
      sliders: { enabled: false, price: 0 },
      nachos: { enabled: false, price: 0 },
      fries: { enabled: false, price: 0 },
      pizza: { enabled: false, price: 0 }
    }
  },
  {
    id: '4',
    name: 'Le Petit Bistro',
    cuisine: 'French',
    cuisines: ['French', 'Mediterranean'], // French-Mediterranean fusion
    location: 'Dupont Circle',
    discount: '-35%',
    timeSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Classic French cuisine with Mediterranean flair',
    vibes: ['dining', 'brunch'],
    brunchDescription: 'French brunch with Mediterranean specialties - trendy modern atmosphere',
    brunchTimeSlots: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    brunchDiscountPercentage: 20,
    // Modern deal data
    deals: {
      drinks: ['$8 Mimosas', '$6 Coffee', '$7 Bloody Mary'],
      food: ['$12 Brunch Plates', '$8 Pastries'],
      specials: ['Bottomless Mimosas', 'Brunch 10AM-2PM']
    }
  },
];

interface Props {
  vibe: 'dining' | 'brunch' | 'happy-hour';
  selectedCuisine?: string; // only used for dining
  selectedBrunchTheme?: string; // only used for brunch
  selectedHappyHourTheme?: string; // only used for happy hour
  onShowAuth: (mode?: 'signin' | 'signup') => void;
  proximityCoordinates?: { latitude: number; longitude: number };
}

export default function VerticalFeed({ vibe, selectedCuisine, selectedBrunchTheme, selectedHappyHourTheme, onShowAuth, proximityCoordinates }: Props) {
  const [data, setData] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // booking modal state (kept local for simplicity)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // location (optional, for distance sort)
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  // auth context
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // save state
  const [savedRestaurants, setSavedRestaurants] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation(loc);
        }
      } catch {}
    })();
  }, []);

  // load data on mount & whenever vibe/cuisine changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        let restaurants: Restaurant[] = [];
        if (vibe === 'dining') {
          if (!selectedCuisine || selectedCuisine === 'All') {
            restaurants = await getRestaurants();
          } else {
            restaurants = await getRestaurantsByCuisine(selectedCuisine);
          }
        } else {
          restaurants = await getRestaurantsByVibe(vibe);
        }
        
        // Filter by brunch theme if needed
        if (vibe === 'brunch' && selectedBrunchTheme && selectedBrunchTheme !== 'All') {
          restaurants = restaurants.filter(restaurant => {
            // For now, we'll filter based on brunch description or other fields
            // This can be enhanced when we add brunch theme fields to the database
            const description = restaurant.brunchDescription || restaurant.description || '';
            const theme = selectedBrunchTheme.toLowerCase();
            
            if (theme === 'bottomless mimosas') {
              return description.toLowerCase().includes('mimosa') || description.toLowerCase().includes('bottomless');
            } else if (theme === 'rooftop') {
              return description.toLowerCase().includes('rooftop') || description.toLowerCase().includes('roof');
            } else if (theme === 'bottomless brunch') {
              return description.toLowerCase().includes('bottomless');
            } else if (theme === 'trendy') {
              return description.toLowerCase().includes('trendy') || description.toLowerCase().includes('modern') || description.toLowerCase().includes('hip');
            }
            return true;
          });
                 }
         
         // Filter by happy hour theme if needed
         if (vibe === 'happy-hour' && selectedHappyHourTheme && selectedHappyHourTheme !== 'All') {
           restaurants = restaurants.filter(restaurant => {
             if (selectedHappyHourTheme === 'Popular') {
               // Filter by popular tag (assuming we'll add this to the database)
               return restaurant.isPopular === true || restaurant.rating >= 4.5;
             } else if (selectedHappyHourTheme === 'Happening Now') {
               // Filter by current time vs happy hour slots
               const now = new Date();
               const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1630 for 4:30 PM
               
               const happyHourSlots = restaurant.happyHourTimeSlots || restaurant.timeSlots || [];
               if (happyHourSlots.length === 0) return false;
               
               // Check if current time is within 15 minutes of start or during happy hour
               for (const slot of happyHourSlots) {
                 const slotTime = parseInt(slot.replace(':', ''));
                 if (slotTime <= currentTime + 15 && slotTime + 200 >= currentTime) { // 200 = 2 hours typical HH duration
                   return true;
                 }
               }
               return false;
             } else if (selectedHappyHourTheme === 'Near Me') {
               // For "Near Me", we need location to be meaningful
               // If no location, we'll still show restaurants but they won't be sorted by distance
               // The sorting logic will handle this case
               return true;
             }
             return true;
           });
         }
         
         if (!isMounted) return;
         setData(restaurants);
      } catch (e) {
        // fallback to local sample
        const fallbackData: Restaurant[] = sampleRestaurants
          .filter((r) => (vibe === 'dining' ? true : r.vibes?.includes(vibe)))
          .map((restaurant: any) => ({
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            cuisines: restaurant.cuisines || [restaurant.cuisine], // Include cuisines array
            location: restaurant.location,
            address: `${restaurant.location}, DC`,
            description: restaurant.description,
            discountPercentage: parseInt(String(restaurant.discount).replace('-', '').replace('%', '')),
            videoUrl: restaurant.video,
            imageUrl: restaurant.video,
            rating: 4.5,
            priceRange: '$$',
            isActive: true,
            isPopular: restaurant.isPopular || false,
            vibes: restaurant.vibes || ['dining'],
            brunchDescription: restaurant.brunchDescription,
            happyHourDescription: restaurant.happyHourDescription,
            happyHourDeal: restaurant.happyHourDeal,
            brunchTimeSlots: restaurant.brunchTimeSlots,
            happyHourTimeSlots: restaurant.happyHourTimeSlots,
            brunchDiscountPercentage: restaurant.brunchDiscountPercentage,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Happy Hour deal data
            drinkDeals: restaurant.drinkDeals || {
              cocktails: { enabled: true, price: 8 },
              beer: { enabled: true, price: 5 },
              wine: { enabled: true, price: 7 },
              sake: { enabled: false, price: 0 }
            },
            foodDeals: restaurant.foodDeals || {
              wings: { enabled: true, price: 8 },
              tacos: { enabled: true, price: 6 },
              sliders: { enabled: true, price: 7 },
              nachos: { enabled: false, price: 0 },
              fries: { enabled: false, price: 0 },
              pizza: { enabled: false, price: 0 }
            }
          }));
        if (!isMounted) return;
        setData(fallbackData);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [vibe, selectedCuisine, selectedBrunchTheme, selectedHappyHourTheme]);

  // Load saved restaurants when user is authenticated
  useEffect(() => {
    const loadSavedRestaurants = async () => {
      console.log('🔄 Loading saved restaurants - Auth state:', { isAuthenticated, userUid: user?.uid, authLoading });
      
      if (isAuthenticated && user?.uid) {
        try {
          console.log('📥 Fetching saved restaurant IDs for user:', user.uid);
          const savedIds = await getSavedRestaurantIds(user.uid);
          console.log('✅ Loaded saved restaurant IDs:', Array.from(savedIds));
          setSavedRestaurants(savedIds);
        } catch (error) {
          console.error('❌ Error loading saved restaurants:', error);
        }
      } else {
        console.log('🔄 Clearing saved restaurants - not authenticated or no user');
        setSavedRestaurants(new Set());
      }
    };

    loadSavedRestaurants();
  }, [isAuthenticated, user?.uid, authLoading]);

  // Handle "Near Me" filter - request location permission when needed
  useEffect(() => {
    if (vibe === 'happy-hour' && selectedHappyHourTheme === 'Near Me' && !userLocation) {
      console.log('Near Me selected, requesting location permission...');
      requestLocationPermission();
    }
  }, [selectedHappyHourTheme, userLocation, vibe]);

  // distance helper
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedData = useMemo(() => {
    let sortedRestaurants = [...data];
    
    // Apply distance sorting if we have proximity coordinates
    if (proximityCoordinates) {
      sortedRestaurants = sortedRestaurants
        .map((r: any) => ({
          ...r,
          distance: r.latitude && r.longitude
            ? calculateDistance(proximityCoordinates.latitude, proximityCoordinates.longitude, r.latitude, r.longitude)
            : undefined,
        }));
      
      // Sort by distance for "Near Me" filter or if we have coordinates
      if (selectedHappyHourTheme === 'Near Me' || proximityCoordinates) {
        sortedRestaurants.sort((a: any, b: any) => (a.distance ?? 999) - (b.distance ?? 999));
      }
    }
    
    return sortedRestaurants;
  }, [data, proximityCoordinates, selectedHappyHourTheme]);

  // viewability to drive autoplay
  const viewabilityConfig = { itemVisiblePercentThreshold: 80 } as const;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.[0]) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  const handleTimeSlotPress = (restaurant: Restaurant, timeSlot: any) => {
    setSelectedRestaurant(restaurant);
    setSelectedTimeSlot(timeSlot.time || timeSlot);
    setShowBookingModal(true);
  };

  const openInMaps = (restaurant: Restaurant) => {
    const address = restaurant.address || `${restaurant.location}, DC`;
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://maps.apple.com/?address=${encodedAddress}`;
    
    Linking.openURL(mapsUrl).catch((err) => {
      console.error('Error opening maps:', err);
      // Fallback to Google Maps if Apple Maps fails
      const googleMapsUrl = `https://maps.google.com/?q=${encodedAddress}`;
      Linking.openURL(googleMapsUrl).catch((err2) => {
        console.error('Error opening Google Maps:', err2);
      });
    });
  };

  // Handle save/unsave restaurant
  const handleToggleSave = async (restaurantId: string) => {
    console.log('🔍 Save button pressed - Auth state:', { isAuthenticated, userUid: user?.uid, authLoading });
    
    // Don't proceed if auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, showing auth modal');
      // Show auth modal for unauthenticated users
      onShowAuth('signin');
      return;
    }

    if (!user?.uid) {
      console.error('❌ User UID not available');
      return;
    }

    try {
      const restaurant = data.find(r => r.id === restaurantId);
      if (!restaurant) {
        console.error('Restaurant not found:', restaurantId);
        return;
      }

      const isCurrentlySaved = savedRestaurants.has(restaurantId);
      
      if (isCurrentlySaved) {
        // Unsave restaurant
        const success = await unsaveRestaurant(user.uid, restaurantId);
        if (success) {
          setSavedRestaurants(prev => {
            const newSet = new Set(prev);
            newSet.delete(restaurantId);
            return newSet;
          });
          console.log('✅ Restaurant unsaved:', restaurantId);
        }
      } else {
        // Save restaurant
        const success = await saveRestaurant(user.uid, restaurant);
        if (success) {
          setSavedRestaurants(prev => {
            const newSet = new Set(prev);
            newSet.add(restaurantId);
            return newSet;
          });
          console.log('✅ Restaurant saved:', restaurantId);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
    }
  };

  const handleShare = async (restaurant: any) => {
    try {
      // Create share message based on vibe
      let dealsText = '';
      let vibeText = '';
      
      if (vibe === 'happy-hour') {
        const drinkDeals = restaurant.drinkDeals ? 
          Object.entries(restaurant.drinkDeals)
            .filter(([_, deal]: [string, any]) => deal.enabled && deal.price > 0)
            .map(([type, deal]: [string, any]) => `$${deal.price} ${type}`)
            .slice(0, 2)
            .join(', ') : '';
        
        const foodDeals = restaurant.foodDeals ? 
          Object.entries(restaurant.foodDeals)
            .filter(([_, deal]: [string, any]) => deal.enabled && deal.price > 0)
            .map(([type, deal]: [string, any]) => `$${deal.price} ${type}`)
            .slice(0, 2)
            .join(', ') : '';
        
        dealsText = `${drinkDeals}${drinkDeals && foodDeals ? ' • ' : ''}${foodDeals}`;
        vibeText = 'Happy Hour';
      } else if (vibe === 'brunch') {
        dealsText = restaurant.brunchDescription || 'Bottomless brunch specials';
        vibeText = 'Brunch';
      } else {
        dealsText = restaurant.description;
        vibeText = 'Dining';
      }

      const shareMessage = `🍽️ ${restaurant.name}\n\n${dealsText}\n\n📍 ${restaurant.address || restaurant.location}\n⭐ ${restaurant.rating} stars\n\n📱 Check it out on ViralBite! #${vibeText.replace(' ', '')}`;

      await Share.share({
        message: shareMessage,
        title: `${restaurant.name} - ${vibeText}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle location permission for "Near Me" filter
  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      
      // Check if we already have permission
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus === 'granted') {
        // Already have permission, just get location
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc);
        return;
      }
      
      // Ask for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc);
      } else {
        alert('Location permission is needed to show nearby restaurants.');
      }
    } catch (error) {
      console.error('Error with location:', error);
      alert('Unable to access location services.');
    }
  };

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // derive vibe-specific info
    const isDining = vibe === 'dining';
    const isBrunch = vibe === 'brunch';
    const isHappyHour = vibe === 'happy-hour';

    let timeSlots: any[] = [];
    let discountPercentage: number = item.discountPercentage;

    if (isDining) {
      timeSlots = item.timeSlots || [];
    } else if (isBrunch) {
      timeSlots = item.brunchTimeSlots || item.timeSlots || [];
      discountPercentage = item.brunchDiscountPercentage || item.discountPercentage;
    } else if (isHappyHour) {
      timeSlots = item.happyHourTimeSlots || item.timeSlots || [];
    }

    if (!timeSlots || timeSlots.length === 0) {
      timeSlots = isBrunch
        ? ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30']
        : isHappyHour
        ? ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']
        : ['18:00', '18:30', '19:00', '19:30'];
    }

    return (
      <View style={styles.page}>
        <VideoPlayer
          source={{ uri: item.videoUrl }}
          style={styles.video}
          shouldPlay={index === currentIndex}
          isCurrentVideo={index === currentIndex}
          vibe={vibe}
        />

        {/* Gradient overlay */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.gradient} />

        {/* Info overlay */}
        <View style={styles.info}>
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{item.name}</Text>
                        <Pressable 
              style={styles.saveButton}
              onPress={() => handleToggleSave(item.id)}
              disabled={authLoading}
            >
              <Ionicons 
                name={authLoading ? "hourglass-outline" : "bookmark"} 
                size={24} 
                color={authLoading ? "rgba(255, 255, 255, 0.5)" : savedRestaurants.has(item.id) ? "#7222E4" : "rgba(255, 255, 255, 0.8)"} 
              />
              <Text style={[styles.saveText, savedRestaurants.has(item.id) && styles.saveTextActive, authLoading && styles.saveTextDisabled]}>
                {authLoading ? 'Loading...' : savedRestaurants.has(item.id) ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
            <Text style={styles.cuisine}>
              {isDining 
                ? (item.cuisines && item.cuisines.length > 1 
                    ? item.cuisines.join(' • ') 
                    : item.cuisine)
                : isBrunch 
                ? <Text style={styles.vibeLabel}>Brunch</Text>
                : <Text style={styles.vibeLabel}>Happy Hour</Text>} • {item.location}
            </Text>
            {/* Description - Hidden for dining feed to reduce clutter */}
            {vibe !== 'dining' && (
              <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                {isBrunch
                  ? item.brunchDescription || item.description
                  : item.happyHourDescription || item.description}
              </Text>
            )}
            {/* Rating, Distance & Price */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingPill}>
                <GoogleGIcon size={12} />
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Text style={styles.starIcon}>⭐</Text>
              </View>
              {typeof item.distance === 'number' && (
                <View style={styles.distancePill}>
                  <Text style={styles.distanceText}>{item.distance.toFixed(1)} miles away</Text>
                </View>
              )}
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>
                  Average price ${item.priceRange === '$$' ? '19' : item.priceRange === '$$$' ? '35' : item.priceRange === '$$$$' ? '60' : '12'}
                </Text>
              </View>
            </View>
          </View>

          {/* Modern Deal Cards - Happy Hour Only */}
          {vibe === 'happy-hour' && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.dealCardsContainer}
              contentContainerStyle={styles.dealCardsContent}
            >
              {/* Drink Deals */}
              {item.drinkDeals && Object.entries(item.drinkDeals)
                .filter(([_, deal]: [string, any]) => deal.enabled && deal.price > 0)
                .slice(0, 3)
                .map(([type, deal]: [string, any], dealIndex) => (
                  <DealCard
                    key={`drink-${type}-${item.id}`}
                    deal={`$${deal.price} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                    type="drink"
                    isVisible={true}
                  />
                ))}
              
              {/* Food Deals */}
              {item.foodDeals && Object.entries(item.foodDeals)
                .filter(([_, deal]: [string, any]) => deal.enabled && deal.price > 0)
                .slice(0, 2)
                .map(([type, deal]: [string, any], dealIndex) => (
                  <DealCard
                    key={`food-${type}-${item.id}`}
                    deal={`$${deal.price} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                    type="food"
                    isVisible={true}
                  />
                ))}
              
              {/* Fallback deal if no specific deals are configured */}
              {(!item.drinkDeals || !item.foodDeals || 
                (Object.values(item.drinkDeals || {}).every((deal: any) => !deal.enabled) &&
                 Object.values(item.foodDeals || {}).every((deal: any) => !deal.enabled))) && (
                <DealCard
                  key={`fallback-${item.id}`}
                  deal={item.happyHourDeal || `Happy Hour`}
                  type="drink"
                  isVisible={true}
                />
              )}
            </ScrollView>
          )}

          {/* Quick Action Buttons - Happy Hour Only */}
          {vibe === 'happy-hour' && (
            <View style={styles.quickActionsContainer}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={() => openInMaps(item)}
              >
                <Text style={styles.actionButtonText}>Directions</Text>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={() => {
                  // TODO: Implement call functionality
                  console.log('Call:', item.name);
                }}
              >
                <Text style={styles.actionButtonText}>Call</Text>
              </Pressable>
            </View>
          )}

          {/* Modern Share Button - All Vibes */}
          <View style={styles.modernShareContainer}>
            <Pressable 
              onPress={() => handleShare(item)}
            >
              <ShareIcon size={32} color="white" />
              <Text style={styles.modernShareText}>Share</Text>
            </Pressable>
          </View>

          {/* Discount badge - Hidden for Happy Hour */}
          {vibe !== 'happy-hour' && (
            <Pressable
              style={styles.discountBadge}
              onPress={() => {
                setSelectedRestaurant(item);
                setSelectedTimeSlot('');
                setShowBookingModal(true);
              }}
            >
              <Text style={styles.discountText}>
                🔥
                {`-${isBrunch ? discountPercentage : item.discountPercentage}% off food`}
              </Text>
            </Pressable>
          )}

          {/* Time slots - Hidden for Happy Hour */}
          {vibe !== 'happy-hour' && (
            <View style={styles.timeSlotScroll}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeSlots.map((slot: any, i: number) => (
                  <React.Fragment key={`${slot}-${i}`}>
                    <Pressable style={styles.timeSlotContainer} onPress={() => handleTimeSlotPress(item, slot)}>
                      <Text style={styles.timeSlotText}>{slot.time || slot}</Text>
                      <View style={styles.discountContainer}>
                        <Text style={styles.discountLabel}>
                          {`-${discountPercentage}%`}
                        </Text>
                      </View>
                    </Pressable>
                    {i < timeSlots.length - 1 && <View style={styles.timeSlotDivider} />}
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  }, [currentIndex, vibe]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <FlashList
        data={sortedData}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig as any}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={H}
        decelerationRate="fast"
        getItemType={() => 'restaurant'}
      />

      <BookingModal
        visible={showBookingModal}
        restaurant={selectedRestaurant}
        selectedTime={selectedTimeSlot}
        vibe={vibe}
        onClose={() => setShowBookingModal(false)}
        onBook={(details: any) => {
          // place to persist booking
          setShowBookingModal(false);
          if (selectedRestaurant) {
            alert(`🎉 Table reserved at ${selectedRestaurant.name}!`);
          }
        }}
        onShowAuth={onShowAuth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    height: H,
    width: W,
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
    position: 'relative',
  },
  restaurantName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 4,
  },
  saveButton: {
    position: 'absolute',
    top: 20,
    right: -4,
    alignItems: 'center',
    padding: 4,
  },
  saveText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveTextActive: {
    color: '#7222E4',
  },
  saveTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cuisine: { fontSize: 16, color: 'rgb(255, 255, 255)', marginBottom: 2 },
  description: { fontSize: 15, color: 'rgb(255, 255, 255)', marginBottom: 8 },
  vibeLabel: { 
    fontSize: 16, 
    color: 'white', 
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  ratingContainer: { marginBottom: -12, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  ratingText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', marginRight: 4 },
  starIcon: { fontSize: 10, color: 'white' },
  distancePill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  distanceText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '500' },
  pricePill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priceText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '500' },

  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  discountText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  timeSlotScroll: { marginTop: 8 },
  timeSlotContainer: { marginRight: 12, alignItems: 'center', minWidth: 60 },
  timeSlotDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  timeSlotText: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  discountContainer: { backgroundColor: 'rgba(255,59,48,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignItems: 'center' },
  discountLabel: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // New styles for DealCard
  dealCardsContainer: {
    marginBottom: 2,
    maxWidth: '95%',
  },
  dealCardsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  dealCard: {
    marginBottom: 8,
  },
  dealEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  dealText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dealCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Quick Action Button styles
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: -10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 0.95 }],
  },

  // Modern Share Button styles
  modernShareContainer: {
    position: 'absolute',
    bottom: 160,
    right: -4,
    alignItems: 'center',
  },
  modernShareText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: -2,
  },
});