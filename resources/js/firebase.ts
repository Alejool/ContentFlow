import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  NextOrObserver,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  signOut as firebaseSignOut,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
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
  console.log("isLocalHost" + isLocalHost);
  console.log(googleProvider);
  console.log(auth);
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

// Importar GoogleAuthProvider si no está ya en el scope de la función
// import { GoogleAuthProvider, User, UserCredential } from "firebase/auth";

// ... (El resto de tu código de Firebase/auth)

/**
 * Extrae los datos esenciales del usuario (email, nombre) de un resultado de Google Auth.
 * * @param result El resultado de signInWithPopup o getAuthResult.
 * @returns Un objeto con los datos esenciales del usuario.
 */
const extractGoogleUserData = async (
  result: UserCredential
): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
}> => {
  const user: User = result.user;

  // 1. Intentar obtener el perfil directamente del credential (método más fiable)
  let email: string = user.email || "";
  let name: string = user.displayName || "User";

  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (credential && credential.profile) {
    // Si tenemos acceso al perfil de Google
    email = credential.profile.email || email;
    name = credential.profile.name || name;
  }

  // 2. Si el email aún falta, intentar con las claims (aunque es menos común)
  if (!email) {
    try {
      const idTokenResult = await user.getIdTokenResult();
      email = (idTokenResult.claims.email as string) || email;
      name = (idTokenResult.claims.name as string) || name;
    } catch (e) {
      console.warn("Could not retrieve ID Token claims.", e);
    }
  }

  return {
    uid: user.uid,
    email: email,
    displayName: name,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
};

export {
  app,
  auth,
  extractGoogleUserData,
  facebookProvider,
  getAuthResult,
  getCurrentUser,
  googleProvider,
  loginAnonymously,
  onAuthChanged,
  registerWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithFacebook,
  signInWithGoogle,
  signOut,
  updateUserProfile,
};
