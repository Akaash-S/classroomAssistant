'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, db, isConfigValid } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: 'teacher' | 'student' | 'admin' | null;
  loading: boolean;
  isConfigured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'teacher' | 'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState(isConfigValid);

  useEffect(() => {
    if (!isConfigValid || !auth || !db) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            const defaultRole = 'student';
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              role: defaultRole,
              createdAt: new Date().toISOString(),
            });
            setRole(defaultRole);
          }
        } catch (err) {
          console.error("Error fetching user role", err);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!auth || !googleProvider) {
      alert("Firebase is not fully configured. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in the Secrets panel.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/configuration-not-found') {
        alert("Firebase Auth configuration not found. Please ensure:\n1. Google Sign-In is enabled in the Firebase Console.\n2. Your API Key is correct.\n3. The Auth Domain is correct.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`This domain is not authorized for Firebase Auth. Please add "${window.location.hostname}" to the "Authorized domains" list in the Firebase Console (Authentication > Settings).`);
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, isConfigured: isConfigValid }}>
      {!isConfigValid && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Firebase Not Configured</h2>
            <p className="text-slate-600">
              This app requires Firebase for authentication and database. 
              Please add your Firebase configuration to the environment variables (Secrets panel).
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-left text-xs font-mono space-y-1">
              <p className="font-bold text-slate-400 mb-2 uppercase tracking-wider">Required Variables:</p>
              <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
              <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
              <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
              <p className="pt-2 font-bold text-slate-400 mb-2 uppercase tracking-wider">Server-side (Optional but recommended):</p>
              <p>FIREBASE_SERVICE_ACCOUNT_KEY</p>
            </div>
            <div className="text-sm text-slate-500 space-y-2">
              <p>1. Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Firebase Console</a></p>
              <p>2. Create a project and add a Web App</p>
              <p>3. Enable <b>Google Sign-In</b> in Authentication &gt; Sign-in method</p>
              <p>4. Add your app&apos;s domain to <b>Authorized domains</b></p>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
