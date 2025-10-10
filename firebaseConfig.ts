import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyDCz3HhZPHkr-ezteZ4MBC7vXwf41rDn1k",
  authDomain: "dreampilot-b8533.firebaseapp.com",
  projectId: "dreampilot-b8533",
  storageBucket: "dreampilot-b8533.firebasestorage.app",
  messagingSenderId: "940001232665",
  appId: "1:940001232665:web:37931fdc682b2cae9ee788",
  measurementId: "G-305ZMGY397"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;


