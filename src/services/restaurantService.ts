import { collection, getDocs, query, where, orderBy, limit, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Restaurant data structure with intuitive field names
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string; // Primary cuisine (for backward compatibility)
  cuisines?: string[]; // Multiple cuisines for fusion restaurants
  location: string;
  address: string;
  description: string;
  discountPercentage: number; // e.g., 30 for 30% off
  videoUrl: string;
  imageUrl: string;
  rating: number; // 1-5 stars
  priceRange: string; // "$", "$$", "$$$"
  isActive: boolean;
  isPopular?: boolean; // Popular restaurant tag
  timeSlots?: any[]; // Time slots for the restaurant
  latitude?: number; // Restaurant coordinates
  longitude?: number; // Restaurant coordinates
  distance?: number; // Calculated distance from user
  createdAt: Date;
  updatedAt: Date;
  
  // Vibe functionality
  vibes: string[]; // ['dining', 'brunch', 'happy-hour'] - ALL restaurants must have 'dining'
  brunchDescription?: string; // Specific description for brunch vibe
  happyHourDescription?: string; // Specific description for happy hour vibe
  happyHourDeal?: string; // "2-for-1 drinks" instead of percentage
  brunchTimeSlots?: any[]; // Time slots specific to brunch
  happyHourTimeSlots?: any[]; // Time slots specific to happy hour
  brunchDiscountPercentage?: number; // Specific discount for brunch
}

// Time slot structure
export interface TimeSlot {
  id: string;
  restaurantId: string;
  time: string; // "18:00", "18:30", etc.
  date: string; // "2024-01-15"
  isAvailable: boolean;
  maxGuests: number;
  currentBookings: number;
}

// Booking structure
export interface Booking {
  id: string;
  bookingNumber?: string; // User-friendly booking number like "VB-2025-345637"
  restaurantId: string;
  restaurantName: string;
  restaurantLocation?: string; // From Firebase data
  userId: string;
  userEmail: string;
  date: string;
  time: string;
  guestCount: number;
  discountPercentage: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  commission: number; // $3 flat rate
  createdAt: Date;
  updatedAt: Date;
}

// Get all active restaurants
export const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    console.log('🔍 Fetching restaurants from Firebase...');
    
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(
      restaurantsRef,
      where('isActive', '==', true)
      // Removed orderBy to avoid indexing issues
    );
    
    const querySnapshot = await getDocs(q);
    const restaurants: Restaurant[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Found restaurant:', doc.id, doc.data());
      restaurants.push({
        id: doc.id,
        ...doc.data()
      } as Restaurant);
    });
    
    console.log('✅ Loaded', restaurants.length, 'restaurants from Firebase');
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    return [];
  }
};

// Get restaurants by cuisine
export const getRestaurantsByCuisine = async (cuisine: string): Promise<Restaurant[]> => {
  try {
    console.log('🔍 Fetching restaurants by cuisine:', cuisine);
    
    // First, try to get restaurants with primary cuisine match
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(
      restaurantsRef,
      where('isActive', '==', true),
      where('cuisine', '==', cuisine)
    );
    
    const querySnapshot = await getDocs(q);
    const restaurants: Restaurant[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Found restaurant by primary cuisine:', doc.id, doc.data());
      restaurants.push({
        id: doc.id,
        ...doc.data()
      } as Restaurant);
    });
    
    // Also check for restaurants with this cuisine in their cuisines array
    // Note: We'll need to fetch all restaurants and filter client-side for cuisines array
    // since Firestore doesn't easily support complex array queries
    const allRestaurantsRef = collection(db, 'restaurants');
    const allQ = query(
      allRestaurantsRef,
      where('isActive', '==', true)
    );
    
    const allQuerySnapshot = await getDocs(allQ);
    
    allQuerySnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if this restaurant has the cuisine in its cuisines array
      if (data.cuisines && Array.isArray(data.cuisines) && data.cuisines.includes(cuisine)) {
        // Only add if not already in the list (avoid duplicates)
        const existingRestaurant = restaurants.find(r => r.id === doc.id);
        if (!existingRestaurant) {
          console.log('📄 Found restaurant by cuisines array:', doc.id, data);
          restaurants.push({
            id: doc.id,
            ...data
          } as Restaurant);
        }
      }
    });
    
    console.log('✅ Loaded', restaurants.length, 'restaurants for cuisine:', cuisine);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants by cuisine:', error);
    return [];
  }
};

// Get restaurants by vibe
export const getRestaurantsByVibe = async (vibe: string): Promise<Restaurant[]> => {
  try {
    console.log('🔍 Fetching restaurants by vibe:', vibe);
    
    const restaurantsRef = collection(db, 'restaurants');
    let q;
    
    if (vibe === 'dining') {
      // For dining, get ALL active restaurants (since all should have 'dining' vibe)
      q = query(
        restaurantsRef,
        where('isActive', '==', true)
      );
    } else {
      // For brunch and happy-hour, filter by specific vibe
      q = query(
        restaurantsRef,
        where('isActive', '==', true),
        where('vibes', 'array-contains', vibe)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const restaurants: Restaurant[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Found restaurant by vibe:', doc.id, doc.data());
      restaurants.push({
        id: doc.id,
        ...(doc.data() as any)
      } as Restaurant);
    });
    
    console.log('✅ Loaded', restaurants.length, 'restaurants for vibe:', vibe);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants by vibe:', error);
    return [];
  }
};

// Get restaurant by ID
export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
  try {
    console.log('🔍 Fetching restaurant by ID:', restaurantId);
    
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (restaurantDoc.exists()) {
      const data = restaurantDoc.data();
      console.log('✅ Found restaurant:', data);
      return {
        id: restaurantDoc.id,
        ...(data as any)
      } as Restaurant;
    } else {
      console.log('❌ Restaurant not found:', restaurantId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching restaurant by ID:', error);
    return null;
  }
};

// Get user bookings
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    console.log('🔍 Fetching bookings for user:', userId);
    
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Found booking:', doc.id, doc.data());
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...(data as any),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Booking);
    });
    
    // Sort by createdAt in descending order (newest first) on the client side
    bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log('✅ Loaded', bookings.length, 'bookings for user:', userId);
    return bookings;
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    return [];
  }
};

// Get time slots for a restaurant
export const getTimeSlots = async (restaurantId: string, date: string): Promise<TimeSlot[]> => {
  try {
    const timeSlotsRef = collection(db, 'timeSlots');
    const q = query(
      timeSlotsRef,
      where('restaurantId', '==', restaurantId),
      where('date', '==', date),
      where('isAvailable', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const timeSlots: TimeSlot[] = [];
    
    querySnapshot.forEach((doc) => {
      timeSlots.push({
        id: doc.id,
        ...(doc.data() as any)
      } as TimeSlot);
    });
    
    return timeSlots.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return [];
  }
};

// Create a new booking
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const newBooking = {
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(bookingsRef, newBooking);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
}; 