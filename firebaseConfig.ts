import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;