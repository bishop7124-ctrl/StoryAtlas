import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── SETUP REQUIRED ──────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com and create a project
// 2. In the project, click "Add app" → Web (</>) and register it
// 3. Copy the firebaseConfig object below and replace the placeholder values
// 4. In the Firebase console: Authentication → Sign-in method
//    Enable: Google (easy), Microsoft (needs Azure app), Facebook (needs FB app)
// 5. In the Firebase console: Firestore Database → Create database (start in test mode)
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
export const microsoftProvider = new OAuthProvider('microsoft.com')
export const facebookProvider = new FacebookAuthProvider()
