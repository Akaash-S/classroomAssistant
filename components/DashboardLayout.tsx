'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Unauthenticated → back to landing
    if (!user) {
      router.replace('/');
      return;
    }

    // Role-based route guard
    if (role === 'student' && pathname.startsWith('/dashboard/teacher')) {
      router.replace('/dashboard/student');
      return;
    }
    if ((role === 'teacher' || role === 'admin') && pathname.startsWith('/dashboard/student')) {
      router.replace('/dashboard/teacher');
      return;
    }
  }, [user, role, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!text-sm !font-medium',
          success: { iconTheme: { primary: '#4f46e5', secondary: 'white' } },
        }}
      />
    </div>
  );
}
