import { collection, getDocs, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// Restaurant data structure with intuitive field names
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  address: string;
  description: string;
  discountPercentage: number; // e.g., 30 for 30% off
  videoUrl: string;
  imageUrl: string;
  rating: number; // 1-5 stars
  priceRange: string; // "$", "$$", "$$$"
  isActive: boolean;
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
  restaurantId: string;
  restaurantName: string;
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
    
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(
      restaurantsRef,
      where('isActive', '==', true),
      where('cuisine', '==', cuisine)
      // Removed orderBy to avoid indexing issues
    );
    
    const querySnapshot = await getDocs(q);
    const restaurants: Restaurant[] = [];
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Found restaurant by cuisine:', doc.id, doc.data());
      restaurants.push({
        id: doc.id,
        ...doc.data()
      } as Restaurant);
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
        ...doc.data()
      } as Restaurant);
    });
    
    console.log('✅ Loaded', restaurants.length, 'restaurants for vibe:', vibe);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants by vibe:', error);
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
        ...doc.data()
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