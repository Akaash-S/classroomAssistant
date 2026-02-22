'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, ArrowRight, Mic } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { login, user, role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">EduAI</span>
        </div>
        
        {user ? (
          <a 
            href={role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Go to Dashboard
          </a>
        ) : (
          <button 
            onClick={login}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Sign In
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            AI-Powered Learning Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Transform Lectures into <span className="text-indigo-600">Actionable Insights.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            EduAI automatically records, transcribes, and extracts assignments from your lectures using advanced Gemini AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={login}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 group"
            >
              Get Started for Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Mic size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Smart Recording</h3>
            <p className="text-slate-600 leading-relaxed">Record lectures directly in your browser. Our AI handles the transcription automatically.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <GraduationCap size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">AI Summaries</h3>
            <p className="text-slate-600 leading-relaxed">Get concise summaries and key points from every lecture, perfect for exam prep.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <ArrowRight size={24} />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-3">Task Extraction</h3>
            <p className="text-slate-600 leading-relaxed">Assignments and deadlines are automatically extracted and added to your calendar.</p>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-sm border-t border-slate-100 mt-24">
        &copy; 2026 EduAI Classroom Assistant. Powered by Gemini AI.
      </footer>
    </div>
  );
}
