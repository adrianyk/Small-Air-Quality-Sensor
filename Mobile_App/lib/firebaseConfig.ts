// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiV0u2VfwmtnobfnT1FpmNqVF6OBPsQjI",
  authDomain: "air-quality-a786b.firebaseapp.com",
  projectId: "air-quality-a786b",
  storageBucket: "air-quality-a786b.firebasestorage.app",
  messagingSenderId: "409659419401",
  appId: "1:409659419401:web:61d9dfbaa8e2770c4241d8",
  measurementId: "G-HQRKS38LPW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };