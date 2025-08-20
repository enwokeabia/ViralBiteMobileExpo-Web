import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Restaurant } from './restaurantService';
import { ensureUserProfile } from './userService';

export interface SavedRestaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  videoUrl: string;
  imageUrl: string;
  discountPercentage?: number;
  happyHourDeals?: string[];
  offers: string[];
  isFavorite?: boolean;
  savedAt: Date;
}

// Save a restaurant to user's saved list
export const saveRestaurant = async (userId: string, restaurant: Restaurant): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('⚠️ User document does not exist, attempting to create...');
      // Try to get the user from auth to create profile
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        const profileCreated = await ensureUserProfile(currentUser);
        if (!profileCreated) {
          console.error('❌ Failed to create user profile');
          return false;
        }
      } else {
        console.error('❌ User document does not exist and cannot create profile');
        return false;
      }
    }

    // Check if restaurant is already saved
    const userData = userDoc.data();
    if (!userData) {
      console.error('❌ User data is undefined');
      return false;
    }
    
    const existingSavedRestaurants = userData.savedRestaurants || [];
    const isAlreadySaved = existingSavedRestaurants.some((saved: any) => saved.id === restaurant.id);
    
    if (isAlreadySaved) {
      console.log('⚠️ Restaurant already saved, unsaving instead');
      return await unsaveRestaurant(userId, restaurant.id);
    }

    // Create saved restaurant object with only valid values
    const savedRestaurant: any = {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      videoUrl: restaurant.videoUrl,
      imageUrl: restaurant.imageUrl,
      offers: restaurant.vibes?.includes('happy-hour') ? ['Happy Hour'] : 
              restaurant.vibes?.includes('brunch') ? ['Brunch'] : ['Dining'],
      isFavorite: true,
      savedAt: new Date(),
    };

    // Only add optional fields if they have valid values
    if (restaurant.discountPercentage !== undefined && restaurant.discountPercentage !== null) {
      savedRestaurant.discountPercentage = restaurant.discountPercentage;
    }
    
    if (restaurant.happyHourDeal) {
      savedRestaurant.happyHourDeals = [restaurant.happyHourDeal];
    }

    // Add to user's saved restaurants array
    await updateDoc(userRef, {
      savedRestaurants: arrayUnion(savedRestaurant),
      'stats.totalSaved': (userData.stats?.totalSaved || 0) + 1,
    });

    console.log('✅ Restaurant saved:', restaurant.name);
    return true;
  } catch (error) {
    console.error('❌ Error saving restaurant:', error);
    return false;
  }
};

// Remove a restaurant from user's saved list
export const unsaveRestaurant = async (userId: string, restaurantId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist');
      return false;
    }

    const userData = userDoc.data();
    const savedRestaurants = userData.savedRestaurants || [];
    
    // Find and remove the restaurant
    const updatedSavedRestaurants = savedRestaurants.filter(
      (restaurant: SavedRestaurant) => restaurant.id !== restaurantId
    );

    await updateDoc(userRef, {
      savedRestaurants: updatedSavedRestaurants,
      'stats.totalSaved': Math.max(0, (userData.stats?.totalSaved || 0) - 1),
    });

    console.log('✅ Restaurant unsaved:', restaurantId);
    return true;
  } catch (error) {
    console.error('❌ Error unsaving restaurant:', error);
    return false;
  }
};

// Get user's saved restaurants
export const getSavedRestaurants = async (userId: string): Promise<SavedRestaurant[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User document does not exist');
      return [];
    }

    const userData = userDoc.data();
    const savedRestaurants = userData.savedRestaurants || [];
    
    // Sort by most recently saved
    return savedRestaurants.sort((a: SavedRestaurant, b: SavedRestaurant) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch (error) {
    console.error('❌ Error getting saved restaurants:', error);
    return [];
  }
};

// Check if a restaurant is saved by the user
export const isRestaurantSaved = async (userId: string, restaurantId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const savedRestaurants = userData.savedRestaurants || [];
    
    return savedRestaurants.some((restaurant: SavedRestaurant) => restaurant.id === restaurantId);
  } catch (error) {
    console.error('❌ Error checking if restaurant is saved:', error);
    return false;
  }
};

// Get saved restaurant IDs for quick checking
export const getSavedRestaurantIds = async (userId: string): Promise<Set<string>> => {
  try {
    const savedRestaurants = await getSavedRestaurants(userId);
    return new Set(savedRestaurants.map(restaurant => restaurant.id));
  } catch (error) {
    console.error('❌ Error getting saved restaurant IDs:', error);
    return new Set();
  }
};
