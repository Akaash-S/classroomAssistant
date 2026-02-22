import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isConfigValid =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'undefined' &&
  !!firebaseConfig.authDomain &&
  firebaseConfig.authDomain !== 'undefined' &&
  !!firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'undefined';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (typeof window !== 'undefined' && isConfigValid) {
  try {
    const isNewApp = getApps().length === 0;
    app = isNewApp ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Use initializeFirestore (not getFirestore + enableMultiTabIndexedDb...)
    // so that offline persistence is configured SYNCHRONOUSLY before any reads.
    // This eliminates the race condition that causes "client is offline" errors.
    if (isNewApp) {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      // App was already initialized (e.g. HMR in dev) — just get existing instance
      db = getFirestore(app);
    }
  } catch (error) {
    console.error('Firebase initialization failed', error);
  }
}

export { auth, db, googleProvider };
