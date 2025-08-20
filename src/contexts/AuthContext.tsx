import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, UserProfile } from '../services/userService';
import { testFirestoreConnection, testUserCollectionAccess } from '../utils/testFirestore';

interface BookingState {
  restaurant: any;
  selectedTime: string;
  selectedDate: string;
  guests: number;
  wasRedirectedToAuth: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
  returnToBookingState: BookingState | null;
  setReturnToBookingState: (state: BookingState | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnToBookingState, setReturnToBookingState] = useState<BookingState | null>(null);

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Test Firestore connectivity on app start
    const testFirestore = async () => {
      console.log('🚀 Testing Firestore connectivity on app start...');
      const connectionTest = await testFirestoreConnection();
      const userAccessTest = await testUserCollectionAccess();
      
      if (!connectionTest || !userAccessTest) {
        console.error('❌ Firestore tests failed - this may cause user profile creation issues');
      } else {
        console.log('✅ All Firestore tests passed');
      }
    };
    
    testFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    refreshUserProfile,
    returnToBookingState,
    setReturnToBookingState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
