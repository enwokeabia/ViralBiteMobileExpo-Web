import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

// Sample restaurant data with consistent field names
const sampleRestaurants = [
  {
    name: 'Sage Bistro',
    cuisine: 'Modern American',
    location: 'Downtown DC',
    address: '1234 Pennsylvania Ave NW, Washington, DC 20004',
    description: 'Farm-to-table dining with seasonal ingredients and craft cocktails',
    discountPercentage: 30,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.6,
    priceRange: '$$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Ramen House',
    cuisine: 'Japanese',
    location: 'Georgetown',
    address: '5678 M Street NW, Washington, DC 20007',
    description: 'Authentic Tokyo-style ramen and small plates in a cozy setting',
    discountPercentage: 40,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    rating: 4.4,
    priceRange: '$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Pizza Palace',
    cuisine: 'Italian',
    location: 'Capitol Hill',
    address: '9012 8th Street SE, Washington, DC 20003',
    description: 'Authentic Neapolitan pizza and Italian classics with wood-fired ovens',
    discountPercentage: 25,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.2,
    priceRange: '$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    location: 'Adams Morgan',
    address: '3456 18th Street NW, Washington, DC 20009',
    description: 'Fresh Mexican street food and margaritas with live music',
    discountPercentage: 35,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    rating: 4.3,
    priceRange: '$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Thai Spice',
    cuisine: 'Thai',
    location: 'Dupont Circle',
    address: '7890 Connecticut Ave NW, Washington, DC 20009',
    description: 'Authentic Thai cuisine with bold flavors and traditional recipes',
    discountPercentage: 20,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.5,
    priceRange: '$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Sushi Master',
    cuisine: 'Japanese',
    location: 'Foggy Bottom',
    address: '2345 K Street NW, Washington, DC 20037',
    description: 'Premium sushi and sashimi with omakase experience',
    discountPercentage: 45,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    rating: 4.8,
    priceRange: '$$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Burger Joint',
    cuisine: 'Modern American',
    location: 'Shaw',
    address: '4567 7th Street NW, Washington, DC 20001',
    description: 'Gourmet burgers and craft beer in a hip neighborhood setting',
    discountPercentage: 15,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.1,
    priceRange: '$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Pasta House',
    cuisine: 'Italian',
    location: 'Logan Circle',
    address: '6789 14th Street NW, Washington, DC 20005',
    description: 'Handmade pasta and classic Italian dishes with wine pairings',
    discountPercentage: 28,
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    rating: 4.4,
    priceRange: '$$',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Sample time slots for restaurants
const generateTimeSlots = (restaurantId: string) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const timeSlots: Array<{
    restaurantId: string;
    time: string;
    date: string;
    isAvailable: boolean;
    maxGuests: number;
    currentBookings: number;
  }> = [];
  
  // Today's slots
  ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].forEach(time => {
    timeSlots.push({
      restaurantId,
      time,
      date: today.toISOString().split('T')[0], // YYYY-MM-DD format
      isAvailable: Math.random() > 0.3, // 70% chance of being available
      maxGuests: 6,
      currentBookings: Math.floor(Math.random() * 3),
    });
  });
  
  // Tomorrow's slots
  ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].forEach(time => {
    timeSlots.push({
      restaurantId,
      time,
      date: tomorrow.toISOString().split('T')[0],
      isAvailable: Math.random() > 0.2, // 80% chance of being available
      maxGuests: 6,
      currentBookings: Math.floor(Math.random() * 2),
    });
  });
  
  return timeSlots;
};

// Function to seed the database
export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Add restaurants
    const restaurantIds = [];
    for (const restaurant of sampleRestaurants) {
      const docRef = await addDoc(collection(db, 'restaurants'), restaurant);
      restaurantIds.push(docRef.id);
      console.log(`✅ Added restaurant: ${restaurant.name} (ID: ${docRef.id})`);
    }
    
    // Add time slots for each restaurant
    for (const restaurantId of restaurantIds) {
      const timeSlots = generateTimeSlots(restaurantId);
      for (const timeSlot of timeSlots) {
        await addDoc(collection(db, 'timeSlots'), timeSlot);
      }
      console.log(`✅ Added time slots for restaurant: ${restaurantId}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Added ${sampleRestaurants.length} restaurants and time slots`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Function to clear the database (for testing)
export const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing database...');
    // Note: In production, you'd want to use batch operations
    // This is just for development/testing
    console.log('⚠️ Clear function not implemented - use Firebase console to clear data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
}; 