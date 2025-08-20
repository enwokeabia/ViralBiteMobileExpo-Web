import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    // Try to read from a test document
    const testDocRef = doc(db, 'test', 'connection');
    const testDoc = await getDoc(testDocRef);
    console.log('✅ Firestore read test passed');
    
    // Try to write a test document
    await setDoc(testDocRef, {
      test: true,
      timestamp: new Date(),
      message: 'Firestore connection test'
    });
    console.log('✅ Firestore write test passed');
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message
    });
    return false;
  }
};

export const testUserCollectionAccess = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing users collection access...');
    
    // Try to read from users collection
    const testUserRef = doc(db, 'users', 'test-user');
    const testUserDoc = await getDoc(testUserRef);
    console.log('✅ Users collection read test passed');
    
    // Try to write to users collection
    await setDoc(testUserRef, {
      uid: 'test-user',
      email: 'test@example.com',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        notifications: true,
        locationServices: true,
      },
      stats: {
        totalBookings: 0,
        totalSaved: 0,
      },
    });
    console.log('✅ Users collection write test passed');
    
    return true;
  } catch (error) {
    console.error('❌ Users collection access test failed:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message
    });
    return false;
  }
};
