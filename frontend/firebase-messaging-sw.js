// Scripts for Firebase
// IMPORTANT: These scripts should be placed at the end of the body tag

// This script will handle background notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(err) {
      console.log('Service Worker registration failed:', err);
    });
}
