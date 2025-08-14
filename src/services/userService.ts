import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt: Date;
  // Add more fields as needed
  phoneNumber?: string;
  preferences?: {
    notifications: boolean;
    locationServices: boolean;
  };
  stats?: {
    totalBookings: number;
    totalSaved: number;
  };
}

export const createUserProfile = async (user: User): Promise<boolean> => {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
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
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ User profile created in Firestore:', user.uid);
    return true;
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    return false;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      lastLoginAt: new Date(),
    });
    console.log('✅ User profile updated:', uid);
    return true;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return false;
  }
};

export const updateLastLogin = async (uid: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastLoginAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('❌ Error updating last login:', error);
    return false;
  }
};
