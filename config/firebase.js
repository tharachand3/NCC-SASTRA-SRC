import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyD-aJbc3OsIwfF-p4dFf286rAIKTg6pYDI",
  authDomain: "ncc-sastra-src.firebaseapp.com",
  projectId: "ncc-sastra-src",
  storageBucket: "ncc-sastra-src.firebasestorage.app",
  messagingSenderId: "133145202969",
  appId: "1:133145202969:web:19f65d1ae9dc5b0b3bf588",
  measurementId: "G-YDH4T8LGYW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);