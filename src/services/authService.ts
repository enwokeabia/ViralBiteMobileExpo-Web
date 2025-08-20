import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, updateLastLogin, ensureUserProfile } from './userService';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure user profile exists (create if it doesn't)
    await ensureUserProfile(userCredential.user);
    
    // Update last login time in Firestore
    await updateLastLogin(userCredential.user.uid);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = 'Sign in failed. Please try again.';
    
    switch (authError.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore - this is critical
    console.log('🔄 Creating user profile for:', userCredential.user.uid);
    const profileCreated = await createUserProfile(userCredential.user);
    if (!profileCreated) {
      console.error('❌ Failed to create user profile in Firestore');
      // Delete the auth user since profile creation failed
      try {
        await userCredential.user.delete();
        console.log('🗑️ Deleted auth user due to profile creation failure');
      } catch (deleteError) {
        console.error('❌ Failed to delete auth user after profile creation failure:', deleteError);
      }
      
      return {
        success: false,
        error: 'Account creation failed. Please try again.'
      };
    }
    
    console.log('✅ User profile created successfully');
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = 'Sign up failed. Please try again.';
    
    switch (authError.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Sign out failed. Please try again.'
    };
  }
};

export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    let errorMessage = 'Password reset failed. Please try again.';
    
    switch (authError.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
