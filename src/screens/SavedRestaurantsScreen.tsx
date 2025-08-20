import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Dimensions,
  FlatList,
  Image,
  ViewToken
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Share } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getSavedRestaurants, unsaveRestaurant, SavedRestaurant } from '../services/savedRestaurantsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2; // 16px padding on each side, 16px gap between cards
const CARD_HEIGHT = 320; // Increased card height for better visual impact



// Mock data for saved restaurants
const mockSavedRestaurants: SavedRestaurant[] = [
  {
    id: '1',
    name: 'Crabcab',
    cuisine: 'American',
    location: 'Alexandria',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    discountPercentage: 15,
    offers: ['Brunch'],
    isFavorite: true,
    savedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Fat Belly',
    cuisine: 'American',
    location: 'New Orleans',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    happyHourDeals: ['$5 Burgers', 'Half-price apps'],
    offers: ['Happy Hour'],
    isFavorite: true,
    savedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'EggQuest',
    cuisine: 'Brunch',
    location: 'Baltimore',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    offers: ['Brunch'],
    savedAt: new Date('2024-01-13'),
  },
  {
    id: '4',
    name: 'Ramonya',
    cuisine: 'Japanese',
    location: 'Philadelphia',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    discountPercentage: 20,
    happyHourDeals: ['$6 Sake', 'Half-price sushi'],
    offers: ['Happy Hour'],
    savedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    name: 'Trattoria Gianna',
    cuisine: 'Italian',
    location: 'Arlington',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    offers: ['Dining'],
    savedAt: new Date('2024-01-11'),
  },
  {
    id: '6',
    name: 'Cactus Cantina',
    cuisine: 'Mexican',
    location: 'Washington DC',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    happyHourDeals: ['$4 Margaritas', 'Free chips & salsa'],
    offers: ['Happy Hour'],
    savedAt: new Date('2024-01-10'),
  },
];

interface SavedRestaurantsScreenProps {
  onShowAuth: (mode?: 'signin' | 'signup') => void;
}

export default function SavedRestaurantsScreen({ onShowAuth }: SavedRestaurantsScreenProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest Saved');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [videoLoadingStates, setVideoLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: any }>({});

  // Load saved restaurants when user is authenticated
  useEffect(() => {
    const loadSavedRestaurants = async () => {
      if (isAuthenticated && user?.uid) {
        setLoading(true);
        try {
          const saved = await getSavedRestaurants(user.uid);
          setSavedRestaurants(saved);
        } catch (error) {
          console.error('Error loading saved restaurants:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSavedRestaurants([]);
        setLoading(false);
      }
    };

    loadSavedRestaurants();
  }, [isAuthenticated, user?.uid]);

  // Filter restaurants based on search and cuisine
  const filteredRestaurants = savedRestaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = !selectedCuisine || restaurant.cuisine === selectedCuisine;
    
    return matchesSearch && matchesCuisine;
  });

  // Handle save/unsave restaurant
  const handleToggleSave = async (restaurantId: string) => {
    if (!isAuthenticated || !user?.uid) {
      onShowAuth('signin');
      return;
    }

    try {
      const success = await unsaveRestaurant(user.uid, restaurantId);
      if (success) {
        setSavedRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
        console.log('✅ Restaurant unsaved:', restaurantId);
      }
    } catch (error) {
      console.error('❌ Error unsaving restaurant:', error);
    }
  };

  // Handle share restaurant
  const handleShare = async (restaurant: SavedRestaurant) => {
    try {
      const shareMessage = `🍽️ Check out ${restaurant.name} on Viralbite!\n\n📍 ${restaurant.location}\n🍴 ${restaurant.cuisine}${restaurant.offers.length > 0 ? `\n✨ ${restaurant.offers.join(', ')}` : ''}${restaurant.discountPercentage ? `\n💰 ${restaurant.discountPercentage}% off food` : ''}\n\nDownload Viralbite to discover amazing restaurants! 🚀`;
      
      await Share.share({
        message: shareMessage,
        title: `${restaurant.name} on Viralbite`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Get unique cuisines for filter buttons
  const availableCuisines = Array.from(new Set(savedRestaurants.map(r => r.cuisine)));

  // Find the most visible restaurant in the viewport
  const findMostVisibleRestaurant = useCallback((contentOffset: number): SavedRestaurant | null => {
    const viewportCenter = contentOffset + (screenHeight / 2);
    let mostVisibleRestaurant: SavedRestaurant | null = null;
    let maxVisibility = 0;

    filteredRestaurants.forEach((restaurant, index) => {
      const itemTop = index * CARD_HEIGHT;
      const itemBottom = itemTop + CARD_HEIGHT;
      
      // Calculate how much of the item is visible in the viewport
      const visibleTop = Math.max(itemTop, contentOffset);
      const visibleBottom = Math.min(itemBottom, contentOffset + screenHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      if (visibleHeight > maxVisibility) {
        maxVisibility = visibleHeight;
        mostVisibleRestaurant = restaurant;
      }
    });

    return mostVisibleRestaurant;
  }, [filteredRestaurants]);

  // Handle video play with loading state
  const handleVideoPlay = useCallback((restaurantId: string) => {
    setCurrentlyPlaying(restaurantId);
    setVideoLoadingStates(prev => ({ ...prev, [restaurantId]: true }));
  }, []);

  // Handle video pause
  const handleVideoPause = useCallback(() => {
    if (currentlyPlaying) {
      setCurrentlyPlaying(null);
      setVideoLoadingStates(prev => ({ ...prev, [currentlyPlaying]: false }));
    }
  }, [currentlyPlaying]);

  // Handle video load success
  const handleVideoLoad = useCallback((restaurantId: string) => {
    setVideoLoadingStates(prev => ({ ...prev, [restaurantId]: false }));
  }, []);

  // Handle video load error - fallback to thumbnail
  const handleVideoError = useCallback((restaurantId: string) => {
    setVideoLoadingStates(prev => ({ ...prev, [restaurantId]: false }));
    if (currentlyPlaying === restaurantId) {
      setCurrentlyPlaying(null);
    }
  }, [currentlyPlaying]);

  // Handle scroll events for auto-play
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    const mostVisible = findMostVisibleRestaurant(contentOffset.y);
    
    if (mostVisible && mostVisible.id !== currentlyPlaying) {
      // Pause current video
      if (currentlyPlaying) {
        setCurrentlyPlaying(null);
        setVideoLoadingStates(prev => ({ ...prev, [currentlyPlaying]: false }));
      }
      
      // Start loading new video
      handleVideoPlay(mostVisible.id);
    }
  }, [findMostVisibleRestaurant, currentlyPlaying, handleVideoPlay]);

  // Handle scroll begin drag - pause all videos
  const handleScrollBeginDrag = useCallback(() => {
    handleVideoPause();
  }, [handleVideoPause]);

  const renderRestaurantCard = ({ item }: { item: SavedRestaurant }) => {
    const isPlaying = currentlyPlaying === item.id;
    const isLoading = videoLoadingStates[item.id];
    
    console.log(`🎥 Rendering card for ${item.name}:`, {
      isPlaying,
      isLoading,
      videoUrl: item.videoUrl,
      imageUrl: item.imageUrl
    });
    
    return (
      <View style={styles.restaurantCard}>
        <View style={styles.videoContainer}>
          {isPlaying && !isLoading ? (
            <Video
              ref={(ref) => {
                if (ref) videoRefs.current[item.id] = ref;
              }}
              source={{ uri: item.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              onLoad={() => handleVideoLoad(item.id)}
              onError={() => handleVideoError(item.id)}
              useNativeControls={false}
            />
          ) : (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}
          
          {/* Premium Subtle Transparent Overlay Gradient */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.cardOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          
          {/* Restaurant Name - Positioned at top */}
          <View style={styles.nameContainer}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            {/* Discount percentage - subtle under name */}
            {item.discountPercentage && (
              <Text style={styles.discountSubtitle}>{item.discountPercentage}% off food</Text>
            )}
          </View>
          
          {/* Save/Unsave Icon - Top right */}
          <Pressable 
            style={styles.saveIcon}
            onPress={() => handleToggleSave(item.id)}
          >
            <Ionicons 
              name={item.isFavorite ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={item.isFavorite ? "#7222E4" : "white"} 
            />
          </Pressable>

          {/* Share Button - Bottom right */}
          <Pressable 
            style={styles.shareButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color="white" 
            />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
          
          {/* Restaurant Offers - Vertically stacked at bottom */}
          <View style={styles.offersContainer}>
            {item.offers.map((offer, index) => (
              <View key={index} style={styles.offerTag}>
                <Text style={styles.offerText}>{offer}</Text>
              </View>
            ))}
            {/* Happy Hour Deals - Optional, only if space allows */}
            {item.happyHourDeals && item.happyHourDeals.length > 0 && item.offers.length <= 1 && 
              item.happyHourDeals.slice(0, 1).map((deal, index) => (
                <View key={`deal-${index}`} style={styles.dealTag}>
                  <Text style={styles.dealText}>{deal}</Text>
                </View>
              ))
            }
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Elegant Gradient Background */}
      <LinearGradient
        colors={['#0D0316', '#190726', '#2A0D3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>



      {/* Search and Filter Section */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.sortButton}>
            <Text style={styles.sortButtonText}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </Pressable>
        </View>
        
        {/* Cuisine Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.cuisineFilters}
          contentContainerStyle={styles.cuisineFiltersContent}
        >
          {availableCuisines.map((cuisine) => (
            <Pressable
              key={cuisine}
              style={[
                styles.cuisineFilter,
                selectedCuisine === cuisine && styles.activeCuisineFilter
              ]}
              onPress={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
            >
              <Text style={[
                styles.cuisineFilterText,
                selectedCuisine === cuisine && styles.activeCuisineFilterText
              ]}>
                {cuisine}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Restaurant Grid or Empty State */}
      {!isAuthenticated ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons name="bookmark-outline" size={64} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.emptyStateTitle}>Sign in to see your saved restaurants</Text>
            <Text style={styles.emptyStateSubtitle}>
              Save your favorite restaurants and they'll appear here
            </Text>
            <Pressable 
              style={styles.signInButton}
              onPress={() => onShowAuth('signin')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      ) : loading ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons name="bookmark-outline" size={64} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.emptyStateTitle}>Loading saved restaurants...</Text>
          </View>
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons name="bookmark-outline" size={64} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.emptyStateTitle}>No saved restaurants yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start saving restaurants from the Feed and they'll appear here
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          scrollEventThrottle={16} // 60fps scroll events
          getItemLayout={(data, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
        />
      )}
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  searchFilterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 62, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 62, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cuisineFilters: {
    marginBottom: 8,
  },
  cuisineFiltersContent: {
    gap: 8,
  },
  cuisineFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 42, 62, 0.8)',
  },
  activeCuisineFilter: {
    backgroundColor: '#7222E4',
  },
  cuisineFilterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCuisineFilterText: {
    color: 'white',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom tab bar
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  restaurantCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(42, 42, 62, 0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 280, // Much taller to showcase food images better
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  nameContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  discountSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saveIcon: {
    position: 'absolute',
    top: 12, // Moved down to align with discount line
    right: 2,
    padding: 4,
  },
  shareButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    alignItems: 'center',
    padding: 4,
  },
  shareText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  offersContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 60, // Leave space for share button
    flexDirection: 'column',
    gap: 4,
  },
  offerTag: {
    backgroundColor: '#7222E4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  offerText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  dealTag: {
    backgroundColor: '#7222E4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dealText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#7222E4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

