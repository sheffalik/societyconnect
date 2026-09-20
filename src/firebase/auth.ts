import { initializeAuth, reactNativeLocalPersistence } from "firebase/auth";
import app from "./firebaseConfig";

export const auth = initializeAuth(app, {
  persistence: reactNativeLocalPersistence,
});