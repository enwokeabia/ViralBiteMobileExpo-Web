// ==============================
// File: RestaurantFeed.tsx
// TikTok-style: Horizontal Pager (contexts) + Vertical paged feeds
// ==============================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable, Animated, Alert, TextInput } from 'react-native';
import { GestureHandlerRootView, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as Location from 'expo-location';
import VerticalFeed from './VerticalFeed';
import { useSoundContext } from '../contexts/SoundContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const VIBES = ['🍽️ Dining', '🥂 Brunch', '🍸 Happy Hour'] as const;
type VibeLabel = typeof VIBES[number];

// Area coordinates for proximity calculation
const AREA_COORDINATES: { [key: string]: { latitude: number; longitude: number } } = {
  'Washington DC': { latitude: 38.9072, longitude: -77.0369 },
  'Georgetown, Washington DC': { latitude: 38.9098, longitude: -77.0654 },
  'Dupont Circle, Washington DC': { latitude: 38.9095, longitude: -77.0432 },
  'Adams Morgan, Washington DC': { latitude: 38.9219, longitude: -77.0425 },
  'Capitol Hill, Washington DC': { latitude: 38.8899, longitude: -77.0091 },
  'Downtown DC, Washington DC': { latitude: 38.8951, longitude: -77.0364 },
  'Arlington, VA': { latitude: 38.8868, longitude: -77.0915 },
  'Alexandria, VA': { latitude: 38.8318, longitude: -77.0594 },
  'Bethesda, MD': { latitude: 38.9847, longitude: -77.0947 },
};

// Constants for tab layout
const TAB_COUNT = VIBES.length;
const TAB_WIDTH = screenWidth / TAB_COUNT;
const underlineW = 40;

interface RestaurantFeedProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function RestaurantFeed({ onShowAuth }: RestaurantFeedProps) {
  const [selectedVibe, setSelectedVibe] = useState<VibeLabel>('🍽️ Dining');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedBrunchTheme, setSelectedBrunchTheme] = useState('All');
  const [selectedHappyHourTheme, setSelectedHappyHourTheme] = useState('All');

  // Location state management
  const [selectedArea, setSelectedArea] = useState<string | null>('Washington DC');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'requesting' | null>(null);
  const [displayLocation, setDisplayLocation] = useState('Washington DC');
  const [locationSource, setLocationSource] = useState<'manual' | 'gps' | 'default'>('default');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  // Modal animation
  const modalSlideAnim = useRef(new Animated.Value(0)).current;

  // Safe area insets
  const insets = useSafeAreaInsets();
  
  // Sound context
  const { isMuted, toggleMute, setActiveVibe } = useSoundContext();

  // pager state
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState<number>(0);

  // continuous underline animation
  const scrollX = useRef(new Animated.Value(0)).current;
  const underlineTranslateX = scrollX.interpolate({
    inputRange: [0, TAB_COUNT - 1],
    outputRange: [
      (TAB_WIDTH - underlineW) / 2,
      (TAB_WIDTH - underlineW) / 2 + TAB_WIDTH * (TAB_COUNT - 1)
    ],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const i = VIBES.indexOf(selectedVibe);
    if (i !== page) {
      pagerRef.current?.setPage(i);
      setPage(i);
    }
    // Convert emoji vibe to clean vibe name
    const cleanVibe = selectedVibe.replace(/[🍽️🥂🍸]/g, '').trim().toLowerCase().replace(' ', '-');
    setActiveVibe(cleanVibe);
  }, [selectedVibe]);

  // Location functions
  const validateLocation = (location: any) => {
    if (!location) return false;
    if (!location.latitude || !location.longitude) return false;
    if (location.latitude < -90 || location.latitude > 90) return false;
    if (location.longitude < -180 || location.longitude > 180) return false;
    return true;
  };

  const handleLocationError = (error: any) => {
    console.log('Location error:', error);
    setLocationSource('manual');
    setDisplayLocation(selectedArea || 'Washington DC');
  };

  // Get current proximity coordinates based on location source
  const getProximityCoordinates = () => {
    if (locationSource === 'gps' && currentLocation) {
      return { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
    } else if (locationSource === 'manual' && selectedArea && AREA_COORDINATES[selectedArea]) {
      return AREA_COORDINATES[selectedArea];
    } else {
      // Default fallback to Washington DC
      return AREA_COORDINATES['Washington DC'];
    }
  };

  const requestLocationPermission = async () => {
    try {
      setLocationPermission('requesting');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission('granted');
        const address = await getGPSLocationWithAddress();
        
        // Get actual GPS coordinates
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address
        });
        setLocationSource('gps');
        setDisplayLocation(address);
      } else {
        setLocationPermission('denied');
        setLocationSource('manual');
        setDisplayLocation(selectedArea || 'Washington DC');
      }
    } catch (error) {
      handleLocationError(error);
    }
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
    // Slide up animation
    Animated.spring(modalSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    // Close immediately and animate out
    setShowLocationModal(false);
    // Slide down animation
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      // Mock search results - in real app, this would call a location API
      const mockResults = [
        'Georgetown, Washington DC',
        'Dupont Circle, Washington DC', 
        'Adams Morgan, Washington DC',
        'Capitol Hill, Washington DC',
        'Downtown DC, Washington DC',
        'Arlington, VA',
        'Alexandria, VA',
        'Bethesda, MD'
      ].filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(mockResults);
    } else {
      setSearchResults([]);
    }
  };

  const getGPSLocationWithAddress = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address && address.length > 0) {
        const locationData = address[0];
        const city = locationData.city || 'Unknown City';
        const region = locationData.region || '';
        const country = locationData.country || '';
        
        const fullAddress = [city, region, country].filter(Boolean).join(', ');
        return fullAddress;
      }
      
      return 'Current Location';
    } catch (error) {
      console.log('GPS location error:', error);
      return 'Current Location';
    }
  };

  const handleTabPress = (v: VibeLabel) => {
    setSelectedVibe(v);
    // Convert emoji vibe to clean vibe name
    const cleanVibe = v.replace(/[🍽️🥂🍸]/g, '').trim().toLowerCase().replace(' ', '-');
    setActiveVibe(cleanVibe); // Immediately update active vibe
  };

  const cuisineTypes = ['All', 'American', 'Japanese', 'Italian', 'Mexican', 'Thai', 'Ethiopian', 'Chinese', 'Indian', 'Korean', 'Mediterranean', 'French', 'Woodbridge (Northern Virginia)'];
  const brunchThemes = ['All', 'Bottomless Mimosas', 'Rooftop', 'Bottomless Brunch', 'Trendy'];
  const happyHourThemes = ['All', 'Happening Now', 'Popular', 'Near Me'];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Top gradient for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'transparent']}
        style={{
          position: 'absolute',
          top: -insets.top,
          left: 0,
          right: 0,
          height: insets.top + 80,
          zIndex: 999,
        }}
        pointerEvents="none"
      />

      {/* Mute/Unmute Button */}
      <Pressable
        style={[styles.muteButton, { top: insets.top + 450 }]}
        onPress={toggleMute}
      >
        <Ionicons 
          name={isMuted ? 'volume-mute' : 'volume-high'} 
          size={24} 
          color="white" 
        />
      </Pressable>

      {/* Vibe Tabs */}
      <View style={[styles.vibeFilterContainer, { top: insets.top + 8 }]}>
        <View style={styles.vibeFilterRow}>
          {VIBES.map((v) => (
            <Pressable
              key={v} 
              style={[styles.vibeFilterItem, { width: TAB_WIDTH, height: 36 }]} 
              onPress={() => handleTabPress(v)}
            >
              <Text style={[styles.vibeFilterText, selectedVibe === v && styles.vibeFilterTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        {/* continuous animated underline */}
        <Animated.View
          style={[
            styles.vibeFilterUnderline,
            { 
              width: underlineW, 
              transform: [{ translateX: underlineTranslateX }],
              position: 'absolute',
              bottom: 6,
            },
          ]}
        />
      </View>

      {/* Location Display */}
      <View style={[styles.locationContainer, { top: insets.top + 8 + 36 + 8 + 32 + 8 }]}>
        <Pressable onPress={handleLocationPress}>
          <View style={styles.locationColumn}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="white" />
              <Text style={styles.locationLabel}>Near</Text>
            </View>
            <Text style={styles.locationName}>{displayLocation}</Text>
          </View>
        </Pressable>
      </View>

      {/* Cuisine Filters - Only show when Dining is selected */}
      {selectedVibe === '🍽️ Dining' && (
        <View style={[styles.filterContainer, { top: insets.top + 8 + 36 + 8 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {cuisineTypes.map((cuisine) => (
              <Pressable
                key={cuisine}
                style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipSelected]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <Text style={[styles.filterText, selectedCuisine === cuisine && styles.filterTextSelected]}>{cuisine}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Brunch Theme Filters - Only show when Brunch is selected */}
      {selectedVibe === '🥂 Brunch' && (
        <View style={[styles.filterContainer, { top: insets.top + 8 + 36 + 8 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {brunchThemes.map((theme) => (
              <Pressable
                key={theme}
                style={[styles.filterChip, selectedBrunchTheme === theme && styles.filterChipSelected]}
                onPress={() => setSelectedBrunchTheme(theme)}
              >
                <Text style={[styles.filterText, selectedBrunchTheme === theme && styles.filterTextSelected]}>{theme}</Text>
              </Pressable>
            ))}
          </ScrollView>
                  </View>
                )}

      {/* Happy Hour Theme Filters - Only show when Happy Hour is selected */}
      {selectedVibe === '🍸 Happy Hour' && (
        <View style={[styles.filterContainer, { top: insets.top + 8 + 36 + 8 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {happyHourThemes.map((theme) => (
                <Pressable 
                key={theme}
                style={[styles.filterChip, selectedHappyHourTheme === theme && styles.filterChipSelected]}
                onPress={() => setSelectedHappyHourTheme(theme)}
              >
                <Text style={[styles.filterText, selectedHappyHourTheme === theme && styles.filterTextSelected]}>{theme}</Text>
                </Pressable>
            ))}
                </ScrollView>
              </View>
      )}

      {/* Horizontal Pager for contexts (Dining / Brunch / Happy Hour) */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          scrollX.setValue(position + offset);
        }}
        onPageSelected={(e) => {
          const i = e.nativeEvent.position;
          setPage(i);
          setSelectedVibe(VIBES[i]);
          // Convert emoji vibe to clean vibe name
          const cleanVibe = VIBES[i].replace(/[🍽️🥂🍸]/g, '').trim().toLowerCase().replace(' ', '-');
          setActiveVibe(cleanVibe); // Convert to match our vibe format
        }}
        overScrollMode="never"
      >
        <View key="dining" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="dining"
            selectedCuisine={selectedCuisine}
            onShowAuth={onShowAuth}
            proximityCoordinates={getProximityCoordinates()}
          />
            </View>
        <View key="brunch" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="brunch"
            selectedCuisine={undefined} // cuisine ignored for brunch for now
            selectedBrunchTheme={selectedBrunchTheme}
            onShowAuth={onShowAuth}
            proximityCoordinates={getProximityCoordinates()}
          />
          </View>
        <View key="happy-hour" style={{ flex: 1 }}>
          <VerticalFeed
            vibe="happy-hour"
            selectedCuisine={undefined}
            selectedHappyHourTheme={selectedHappyHourTheme}
            onShowAuth={onShowAuth}
            proximityCoordinates={getProximityCoordinates()}
          />
        </View>
      </PagerView>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{
                  translateY: modalSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0], // Slide up from 600px below
                  })
                }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <Pressable onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>
            </View>

            {/* Selected Location */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Selected location</Text>
              <Text style={styles.modalSelectedLocation}>{displayLocation}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.modalSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search location..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((result, index) => (
                    <Pressable
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSelectedArea(result);
                        setDisplayLocation(result);
                        setLocationSource('manual');
                        setShowLocationModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.searchResultText}>{result}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Current Location */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Current location</Text>
              <Pressable 
                style={styles.locationOption}
                onPress={() => {
                  requestLocationPermission();
                  setShowLocationModal(false);
                }}
              >
                <Ionicons name="location" size={20} color="#7222e4" />
                <View style={styles.locationOptionText}>
                  <Text style={styles.locationOptionTitle}>Current Location</Text>
                  <Text style={styles.locationOptionSubtitle}>Use GPS location</Text>
                </View>
              </Pressable>
            </View>

            {/* Saved Locations */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Saved locations</Text>
              <View style={styles.locationOption}>
                <Ionicons name="time" size={20} color="#666" />
                <View style={styles.locationOptionText}>
                  <Text style={styles.locationOptionTitle}>Washington DC</Text>
                  <Text style={styles.locationOptionSubtitle}>Washington, DC, United States</Text>
                </View>
                <Pressable onPress={() => setSelectedArea('Washington DC')}>
                  <Ionicons name="close" size={20} color="#666" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  vibeFilterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 8,
  },
  vibeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeFilterItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    position: 'relative',
  },
  vibeFilterText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  vibeFilterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  vibeFilterUnderline: {
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  
  // Location styles
  locationContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 1000,
  },
  locationColumn: {
    flexDirection: 'column',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 6,
  },
  locationName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 22,
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  modalSelectedLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchResultText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationOptionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filterContainer: {
    position: 'absolute',
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
  muteButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1001,
    padding: 8, // Add some padding for easier tapping
  },
}); 