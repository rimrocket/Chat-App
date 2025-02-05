import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";

// Firebase configuration using Expo constants
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.apiKey,
  authDomain: Constants.expoConfig.extra.authDomain,
  projectId: Constants.expoConfig.extra.projectId,
  storageBucket: Constants.expoConfig.extra.storageBucket,
  messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
  appId: Constants.expoConfig.extra.appId,
  databaseURL: Constants.expoConfig.extra.databaseURL,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
console.log("🔥 Firebase initialized successfully");

// Pass `app` instance to Firestore and Auth
export const auth = getAuth(app);
export const database = getFirestore(app);
console.log(" Auth and Database services exported");

export default app;
