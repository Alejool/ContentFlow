import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
  Auth,
  UserCredential,
  User,
  NextOrObserver,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID,
};

console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

// For local development, determine if we are on localhost
const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Configure providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure additional scopes
googleProvider.addScope("profile");
googleProvider.addScope("email");

facebookProvider.addScope("public_profile");
facebookProvider.addScope("email");

// Sign in with email and password
const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInWithEmail(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error signing in with email and password:", error);
    throw error;
  }
};

// Sign out
const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Listen for authentication state changes
const onAuthChanged = (callback: NextOrObserver<User>): any => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Sign in with Google
const signInWithGoogle = async (): Promise<UserCredential | true | null> => {
  try {
    if (isLocalHost) {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } else {
      await signInWithRedirect(auth, googleProvider);
      return true;
    }
  } catch (error) {
    console.error("Error during Google authentication:", error);
    throw error;
  }
};

// Sign in with Facebook
const signInWithFacebook = async (): Promise<UserCredential | true | null> => {
  try {
    if (isLocalHost) {
      const result = await signInWithPopup(auth, facebookProvider);
      return result;
    } else {
      await signInWithRedirect(auth, facebookProvider);
      return true;
    }
  } catch (error) {
    console.error("Error during Facebook authentication:", error);
    throw error;
  }
};

// Get redirect result
const getAuthResult = async (): Promise<UserCredential | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error getting authentication result:", error);
    throw error;
  }
};

// Register with email and password
const registerWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential;
  } catch (error) {
    console.error("Error registering with email and password:", error);
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (
  user: User,
  profileData: { displayName?: string; photoURL?: string }
): Promise<User> => {
  try {
    await updateProfile(user, profileData);
    return user;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

const loginAnonymously = async (): Promise<{ user: User }> => {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    return { user };
  } catch (error) {
    console.error("Error during anonymous authentication:", error);
    throw error;
  }
};

export {
  app,
  getCurrentUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthChanged,
  registerWithEmailAndPassword,
  updateUserProfile,
  auth,
  googleProvider,
  facebookProvider,
  signInWithGoogle,
  signInWithFacebook,
  getAuthResult,
  loginAnonymously,
};
