'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, db, isConfigValid } from '@/lib/firebase';
import { doc, getDoc, getDocFromCache, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

type Role = 'teacher' | 'student' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  isConfigured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pages where we must NOT redirect (landing + role selection)
const PUBLIC_PATHS = ['/', '/select-role'];

const ROLE_REDIRECTS: Record<string, string> = {
  teacher: '/dashboard/teacher',
  student: '/dashboard/student',
  admin: '/dashboard/teacher', // admins use teacher view
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(isConfigValid);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isConfigValid || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Try cache first (instant, never fails offline), then network
          let userDoc;
          try {
            userDoc = await getDocFromCache(doc(db!, 'users', firebaseUser.uid));
          } catch {
            // Cache miss or not yet initialized — fall back to network
            userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
          }

          let resolvedRole: Role;
          if (userDoc?.exists()) {
            resolvedRole = userDoc.data().role as Role;

            // ── Auto-redirect returning users based on their saved role ──
            if (PUBLIC_PATHS.includes(pathname)) {
              const target = ROLE_REDIRECTS[resolvedRole as string] ?? '/dashboard/student';
              router.replace(target);
            }
          } else {
            // New user — send them to the role selection page
            resolvedRole = null;
            if (pathname !== '/select-role') {
              router.replace('/select-role');
            }
          }

          setRole(resolvedRole);

        } catch (err) {
          console.error('[Auth] Error fetching user role:', err);
          setRole('student'); // safe fallback
        }
      } else {
        setRole(null);
        // If on a protected page, redirect to landing
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.replace('/');
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — pathname changes are intentionally excluded

  const login = async () => {
    if (!auth || !googleProvider) {
      alert('Firebase is not configured. Please add Firebase env vars.');
      return;
    }
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      setLoading(false);
      console.error('Login failed', error);
      if (error.code === 'auth/popup-closed-by-user') return;
      if (error.code === 'auth/configuration-not-found') {
        alert('Firebase Auth not configured. Enable Google Sign-In in the Firebase Console.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`Add "${window.location.hostname}" to Authorized domains in Firebase Console.`);
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, isConfigured: isConfigValid }}>
      {!isConfigValid ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Firebase Not Configured</h2>
            <p className="text-slate-600">
              Add your Firebase configuration to the environment variables.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-left text-xs font-mono space-y-1">
              <p className="font-bold text-slate-400 mb-2 uppercase tracking-wider">Required Variables:</p>
              <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
              <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
              <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        // Full-screen loading spinner while auth state resolves
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-900">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading…</p>
        </div>
      ) : (
        children
      )}
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
