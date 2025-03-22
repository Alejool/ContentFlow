import { initializeApp } from 'firebase/app';
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
    signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';



const firebaseConfig = {
  // Tu configuración de Firebase aquí
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VUE_APP_FIREBASE_APP_ID,
    measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Para desarrollo local, determinar si estamos en localhost
const isLocalHost = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1";

// Configurar proveedores
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configurar ámbitos (scopes) adicionales si es necesario
googleProvider.addScope('profile');
googleProvider.addScope('email');

facebookProvider.addScope('public_profile');
facebookProvider.addScope('email');



// Sign in with email and password
const signInWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await firebaseSignInWithEmail(auth, email, password);
        return userCredential;
    } catch (error) {
        console.error("Error signing in with email and password:", error);
        throw error;
    }
};

// Sign out
const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};
// Listen for authentication state changes
const onAuthChanged = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Get current user
const getCurrentUser = () => {
    return auth.currentUser;
};

// Función para iniciar sesión con Google
const signInWithGoogle = async () => {
  try {
    // Usar signInWithPopup para local y signInWithRedirect para producción
    if (isLocalHost) {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } else {
      await signInWithRedirect(auth, googleProvider);
      return true;
    }
  } catch (error) {
    console.error("Error durante la autenticación con Google:", error);
    throw error;
  }
};

// Función para iniciar sesión con Facebook
const signInWithFacebook = async () => {
  try {
    // Usar signInWithPopup para local y signInWithRedirect para producción
    if (isLocalHost) {
      const result = await signInWithPopup(auth, facebookProvider);
      return result;
    } else {
      await signInWithRedirect(auth, facebookProvider);
      return true;
    }
  } catch (error) {
    console.error("Error durante la autenticación con Facebook:", error);
    throw error;
  }
};

// Función para obtener el resultado de la redirección
const getAuthResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error obteniendo resultado de autenticación:", error);
    throw error;
  }
};


// Register with email and password
const registerWithEmailAndPassword = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        console.error("Error registering with email and password:", error);
        throw error;
    }
};

// Update user profile
const updateUserProfile = async (user, profileData) => {
    try {
        await updateProfile(user, profileData);
        return user;
    } catch (error) {
        console.error("Error updating user profile:", error);
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
  getAuthResult
};