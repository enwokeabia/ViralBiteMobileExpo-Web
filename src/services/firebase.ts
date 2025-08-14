import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyC1zDSWLYeSxm5hpf013TXL6UkdqrzVH4w",
    authDomain: "viralbite-mobile.firebaseapp.com",
    projectId: "viralbite-mobile",
    storageBucket: "viralbite-mobile.firebasestorage.app",
    messagingSenderId: "673595596591",
    appId: "1:673595596591:web:49533090273b042d614bda"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
