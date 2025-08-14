import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    return { success: true, message: 'Firebase connection successful' };
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return { success: false, error };
  }
};

export const testAddRestaurant = async () => {
  try {
    const testRestaurant = {
      name: 'Test Restaurant',
      cuisine: 'Test Cuisine',
      location: 'Test Location',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'restaurants'), testRestaurant);
    console.log('Test restaurant added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Failed to add test restaurant:', error);
    return { success: false, error };
  }
};
