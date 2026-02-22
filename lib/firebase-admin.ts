import * as admin from 'firebase-admin';

let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey && serviceAccountKey !== "undefined") {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminAuth = admin.auth();
      adminDb = admin.firestore();
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing. Server-side Firebase features will be disabled.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  adminAuth = admin.auth();
  adminDb = admin.firestore();
}

export { adminAuth, adminDb };
