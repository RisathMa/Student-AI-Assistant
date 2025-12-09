import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAg7OXa5ALUak2G55tlaiO4g0mBvc9m2d4",
    authDomain: "rmcompany-c4705.firebaseapp.com",
    projectId: "rmcompany-c4705",
    storageBucket: "rmcompany-c4705.firebasestorage.app",
    messagingSenderId: "474034947608",
    appId: "1:474034947608:web:66d6fc74ad73b53cf9656d",
    measurementId: "G-1BN7CYFR96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
