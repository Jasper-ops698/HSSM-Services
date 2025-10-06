/*
 * Runtime Firebase configuration fallback.
 * These values are safe to expose and mirror the values used in .env.
 * Update this file if the Firebase project settings change.
 */
const runtimeGlobal = typeof window !== 'undefined' ? window : {};

(function setFirebaseRuntimeConfig(global) {
  if (global.__FIREBASE_CONFIG__) {
    return;
  }

  global.__FIREBASE_CONFIG__ = Object.freeze({
    apiKey: 'AIzaSyAvf-2_mDu-YCgYAW0qVeB1jH8Na0RkR74',
    authDomain: 'hssm-services-1e3d5.firebaseapp.com',
    projectId: 'hssm-services-1e3d5',
    storageBucket: 'hssm-services-1e3d5.firebasestorage.app',
    messagingSenderId: '661426712029',
    appId: '1:661426712029:web:b9b092171ce1ab034ada34',
    measurementId: 'G-5T5JRPWRH1',
  });
})(runtimeGlobal);
