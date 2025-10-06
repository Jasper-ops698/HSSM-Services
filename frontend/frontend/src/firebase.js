// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const runtimeFirebaseConfig =
  typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
    ? window.__FIREBASE_CONFIG__
    : {};

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY || runtimeFirebaseConfig.apiKey,
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || runtimeFirebaseConfig.authDomain,
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || runtimeFirebaseConfig.projectId,
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || runtimeFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    runtimeFirebaseConfig.messagingSenderId,
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID || runtimeFirebaseConfig.appId,
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ||
    runtimeFirebaseConfig.measurementId,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingRequiredKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingRequiredKeys.length) {
  const message = [
    'Firebase configuration incomplete.',
    `Missing required keys: ${missingRequiredKeys.join(', ')}.`,
    'Ensure REACT_APP_FIREBASE_* values are defined before building or provide a window.__FIREBASE_CONFIG__ runtime fallback (see public/firebase-config.js).',
  ].join(' ');
  throw new Error(message);
}

const optionalKeys = ['storageBucket', 'messagingSenderId', 'measurementId'];
const missingOptionalKeys = optionalKeys.filter((key) => !firebaseConfig[key]);

if (missingOptionalKeys.length) {
  console.warn(
    `Firebase configuration missing optional keys: ${missingOptionalKeys.join(
      ', '
    )}. Some features may be unavailable.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

export default app;
