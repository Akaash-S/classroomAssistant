'use client';

import { AuthProvider } from '@/context/AuthContext';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
}
