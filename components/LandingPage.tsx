'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, ArrowRight, Mic, BookOpen, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { login, user, role, loading } = useAuth();

  // If user already signed in, show a minimal redirect screen
  // (AuthContext will route them away; this is just in case of a brief delay)
  if (user && role) {
    const dest = role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-900">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
          Welcome back, {user.displayName?.split(' ')[0]}! Redirecting…
        </p>
        <a
          href={dest}
          className="text-sm text-indigo-600 hover:underline font-semibold"
        >
          Click here if not redirected →
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Navbar */}
      <nav className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={22} />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900">EduAI</span>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-8 border border-indigo-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
            AI-Powered Learning Assistant
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Transform Lectures into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
              Actionable Insights.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            EduAI automatically records, transcribes, and extracts assignments from your
            lectures using Gemini AI — for teachers and students alike.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={login}
              disabled={loading}
              className="group flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Get Started Free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-sm text-slate-400">
            Sign in with Google — no password needed.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          {[
            {
              icon: <Mic size={24} />,
              color: 'bg-indigo-50 text-indigo-600',
              title: 'Smart Recording',
              desc: 'Record lectures in your browser or upload existing audio files. Supports MP3, WAV, WebM.',
            },
            {
              icon: <BookOpen size={24} />,
              color: 'bg-emerald-50 text-emerald-600',
              title: 'AI Summaries',
              desc: 'Concise summaries, key points, and exam notes generated from every lecture automatically.',
            },
            {
              icon: <ClipboardList size={24} />,
              color: 'bg-amber-50 text-amber-600',
              title: 'Task Extraction',
              desc: 'Assignments and deadlines are automatically extracted and added to the student calendar.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-6`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-sm border-t border-slate-100 mt-24">
        © 2026 EduAI Classroom Assistant. Powered by Gemini AI.
      </footer>
    </div>
  );
}
