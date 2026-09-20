import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWRU6aGU697D0wuRdzRpM9lnyFTsk_MQo",
  authDomain: "societyconnect-7ba82.firebaseapp.com",
  projectId: "societyconnect-7ba82",
  storageBucket: "societyconnect-7ba82.firebasestorage.app",
  messagingSenderId: "995273288148",
  appId: "1:995273288148:web:a2ee62de3b19d68f340e41",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;