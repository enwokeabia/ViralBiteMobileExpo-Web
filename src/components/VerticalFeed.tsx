// ==============================
// File: VerticalFeed.tsx
// Vertical full-screen paged feed + autoplay + booking modal
// ==============================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import BookingModal from './BookingModal';
import GoogleGIcon from './GoogleGIcon';
import * as Location from 'expo-location';
import { getRestaurants, getRestaurantsByCuisine, getRestaurantsByVibe, Restaurant } from '../services/restaurantService';

const { height: H, width: W } = Dimensions.get('window');

// local fallback data for resiliency
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
    brunchDiscountPercentage: 25,
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
    happyHourTimeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
  },
];

interface Props {
  vibe: 'dining' | 'brunch' | 'happy-hour';
  selectedCuisine?: string; // only used for dining
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function VerticalFeed({ vibe, selectedCuisine, onShowAuth }: Props) {
  const [data, setData] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // booking modal state (kept local for simplicity)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // location (optional, for distance sort)
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

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
            location: restaurant.location,
            address: `${restaurant.location}, DC`,
            description: restaurant.description,
            discountPercentage: parseInt(String(restaurant.discount).replace('-', '').replace('%', '')),
            videoUrl: restaurant.video,
            imageUrl: restaurant.video,
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
        if (!isMounted) return;
        setData(fallbackData);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [vibe, selectedCuisine]);

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
    if (!userLocation) return data;
    return data
      .map((r: any) => ({
        ...r,
        distance: r.latitude && r.longitude
          ? calculateDistance(userLocation.coords.latitude, userLocation.coords.longitude, r.latitude, r.longitude)
          : undefined,
      }))
      .sort((a: any, b: any) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [data, userLocation]);

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
        <Video
          source={{ uri: item.videoUrl }}
          style={styles.video}
          shouldPlay={index === currentIndex}
          isLooping
          isMuted={false}
          resizeMode={ResizeMode.COVER}
          useNativeControls={false}
        />

        {/* Gradient overlay */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.gradient} />

        {/* Info overlay */}
        <View style={styles.info}>
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.cuisine}>
              {isDining ? item.cuisine : isBrunch ? 'Brunch' : 'Happy Hour'} • {item.location}
            </Text>
            <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
              {isDining
                ? item.description
                : isBrunch
                ? item.brunchDescription || item.description
                : item.happyHourDescription || item.description}
            </Text>
            <Text style={styles.averagePrice}>
              Average price $
              {item.priceRange === '$$' ? '19' : item.priceRange === '$$$' ? '35' : item.priceRange === '$$$$' ? '60' : '12'}
            </Text>

            {/* Rating & Distance */}
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
            </View>
          </View>

          {/* Discount badge */}
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
              {isHappyHour
                ? item.happyHourDeal || `-${item.discountPercentage}% off food`
                : `-${isBrunch ? discountPercentage : item.discountPercentage}% off food`}
            </Text>
          </Pressable>

          {/* Time slots */}
          <View style={styles.timeSlotScroll}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timeSlots.map((slot: any, i: number) => (
                <React.Fragment key={`${slot}-${i}`}>
                  <Pressable style={styles.timeSlotContainer} onPress={() => handleTimeSlotPress(item, slot)}>
                    <Text style={styles.timeSlotText}>{slot.time || slot}</Text>
                    <View style={styles.discountContainer}>
                      <Text style={styles.discountLabel}>
                        {isHappyHour ? (item.happyHourDeal ? '🔥' : `-${discountPercentage}%`) : `-${discountPercentage}%`}
                      </Text>
                    </View>
                  </Pressable>
                  {i < timeSlots.length - 1 && <View style={styles.timeSlotDivider} />}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
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
  restaurantDetails: { marginBottom: 20 },
  restaurantName: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  cuisine: { fontSize: 16, color: 'rgba(255,255,255,0.95)', marginBottom: 8 },
  description: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  averagePrice: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 10 },

  ratingContainer: { marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
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

  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  timeSlotScroll: { marginTop: 8 },
  timeSlotContainer: { marginRight: 12, alignItems: 'center', minWidth: 60 },
  timeSlotDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  timeSlotText: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  discountContainer: { backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignItems: 'center' },
  discountLabel: { color: 'black', fontSize: 10, fontWeight: 'bold' },
});