// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import  ReactNativeAsyncStorage  from '@react-native-async-storage/async-storage'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAepiFXvHMaFBlo5ZSW1BTaRrazJp9Jmow",
  authDomain: "casaco-30741.firebaseapp.com",
  projectId: "casaco-30741",
  storageBucket: "casaco-30741.firebasestorage.app",
  messagingSenderId: "667912949754",
  appId: "1:667912949754:web:00a0b2a5a740730fef5e43"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app,{
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);

