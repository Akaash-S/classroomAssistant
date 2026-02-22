'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { GraduationCap, FileText, Download, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const StudentSummaries = () => {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // In a real app, you'd filter by student's enrolled subjects
    const q = query(
      collection(db, 'summaries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSummaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lecture Summaries</h1>
          <p className="text-slate-500 mt-1">Review AI-generated summaries and exam notes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {summaries.length > 0 ? summaries.map((summary) => (
            <div key={summary.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <Download size={20} />
                </button>
              </div>
              
              <h3 className="font-bold text-xl text-slate-900 mb-2">Lecture Summary</h3>
              <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                {summary.shortSummary}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Ready</span>
                </div>
                <button className="flex items-center gap-1 text-indigo-600 text-sm font-bold group-hover:gap-2 transition-all">
                  Read More
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
              No summaries available yet.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSummaries;
