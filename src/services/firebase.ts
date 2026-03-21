import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvCyXVzjiZ10FsBLgYxluJqG-yJmsF7P0",
  authDomain: "app-repertorio-79932.firebaseapp.com",
  projectId: "app-repertorio-79932",
  storageBucket: "app-repertorio-79932.firebasestorage.app",
  messagingSenderId: "46806323954",
  appId: "1:46806323954:web:4c9f9f37ae7cec2552766b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);