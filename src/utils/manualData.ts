import { addDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Simple restaurant data structure
export interface SimpleRestaurant {
  name: string;
  cuisine: string;
  location: string;
  description: string;
  discountPercentage: number;
  videoUrl: string;
  rating: number;
  priceRange: string;
  isActive: boolean;
}

// Manual restaurant entries
export const manualRestaurants: SimpleRestaurant[] = [
  {
    name: 'Sage Bistro',
    cuisine: 'Modern American',
    location: 'Downtown DC',
    description: 'Farm-to-table dining with seasonal ingredients',
    discountPercentage: 30,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.6,
    priceRange: '$$$',
    isActive: true,
  },
  {
    name: 'Ramen House',
    cuisine: 'Japanese',
    location: 'Georgetown',
    description: 'Authentic Tokyo-style ramen and small plates',
    discountPercentage: 40,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    rating: 4.4,
    priceRange: '$$',
    isActive: true,
  },
  {
    name: 'Pizza Palace',
    cuisine: 'Italian',
    location: 'Capitol Hill',
    description: 'Authentic Neapolitan pizza and Italian classics',
    discountPercentage: 25,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.2,
    priceRange: '$$',
    isActive: true,
  },
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    location: 'Adams Morgan',
    description: 'Fresh Mexican street food and margaritas',
    discountPercentage: 35,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    rating: 4.3,
    priceRange: '$',
    isActive: true,
  },
  {
    name: 'Thai Spice',
    cuisine: 'Thai',
    location: 'Dupont Circle',
    description: 'Authentic Thai cuisine with bold flavors',
    discountPercentage: 20,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.5,
    priceRange: '$$',
    isActive: true,
  }
];

// Add a single restaurant
export const addSingleRestaurant = async (restaurant: SimpleRestaurant) => {
  try {
    console.log('🔄 Adding restaurant:', restaurant.name);
    
    const docRef = await addDoc(collection(db, 'restaurants'), {
      ...restaurant,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ Successfully added:', restaurant.name, 'with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding restaurant:', restaurant.name, error);
    throw error;
  }
};

// Add all restaurants one by one
export const addAllRestaurants = async () => {
  console.log('🚀 Starting to add restaurants...');
  
  const results = [];
  
  for (const restaurant of manualRestaurants) {
    try {
      const id = await addSingleRestaurant(restaurant);
      results.push({ success: true, name: restaurant.name, id });
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.push({ success: false, name: restaurant.name, error });
    }
  }
  
  console.log('📊 Results:', results);
  return results;
};

// Check existing restaurants
export const checkExistingRestaurants = async () => {
  try {
    console.log('🔍 Checking existing restaurants...');
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    
    const restaurants: Array<{ id: string; [key: string]: any }> = [];
    querySnapshot.forEach((doc) => {
      restaurants.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('📋 Found', restaurants.length, 'restaurants:', restaurants.map(r => r.name));
    return restaurants;
  } catch (error) {
    console.error('❌ Error checking restaurants:', error);
    return [];
  }
};

// Clear all restaurants (for testing)
export const clearAllRestaurants = async () => {
  try {
    console.log('🧹 Clearing all restaurants...');
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('✅ Cleared', querySnapshot.size, 'restaurants');
  } catch (error) {
    console.error('❌ Error clearing restaurants:', error);
  }
}; 