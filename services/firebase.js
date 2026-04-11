import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // We'll need this soon!

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2sdTf7Y0R6UJ38mfRkbhZ2fGO8s9Zi_c",
  authDomain: "siderun-app.firebaseapp.com",
  projectId: "siderun-app",
  storageBucket: "siderun-app.firebasestorage.app",
  messagingSenderId: "347276054970",
  appId: "1:347276054970:web:04d2e2e91756af8b398d83",
  measurementId: "G-ZKLQD9433V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
