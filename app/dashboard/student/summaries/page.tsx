'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { GraduationCap, FileText, ChevronDown, ChevronUp, Lightbulb, BookOpen, Music } from 'lucide-react';

interface Summary {
  id: string;
  lectureId: string;
  shortSummary: string;
  keyPoints: string[];
  examNotes: string[];
  createdAt: any;
  subject?: string;
  audioUrl?: string;
}

const StudentSummaries = () => {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db!, 'summaries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Summary));

      // Enrich with subject name from the parent lecture
      const enriched = await Promise.all(
        raw.map(async (s) => {
          try {
            const lectureSnap = await getDoc(doc(db!, 'lectures', s.lectureId));
            return {
              ...s,
              subject: lectureSnap.exists() ? lectureSnap.data()?.subject : 'Unknown',
              audioUrl: lectureSnap.exists() ? lectureSnap.data()?.audioUrl : undefined
            };
          } catch {
            return { ...s, subject: 'Unknown' };
          }
        })
      );
      setSummaries(enriched);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Lecture Summaries</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">AI-generated summaries, key points &amp; exam notes.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summaries.length > 0 ? summaries.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
                      {s.subject}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">
                    {s.shortSummary}
                  </p>
                </div>

                {/* Expandable details */}
                <button
                  onClick={() => toggle(s.id)}
                  className="w-full px-6 py-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-b-2xl"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap size={16} />
                    {expanded === s.id ? 'Hide Details' : 'View Key Points & Exam Notes'}
                  </span>
                  {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expanded === s.id && (
                  <div className="px-6 pb-6 space-y-5 border-t border-slate-50 dark:border-slate-700">
                    {/* Audio Player */}
                    {s.audioUrl && (
                      <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Music className="text-indigo-600" size={16} />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Listen to Lecture</span>
                        </div>
                        <audio controls src={s.audioUrl} className="w-full h-8" />
                      </div>
                    )}

                    {/* Key Points */}
                    {s.keyPoints?.length > 0 && (
                      <div className="mt-5">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                          <Lightbulb size={14} className="text-amber-500" /> Key Points
                        </h4>
                        <ul className="space-y-2">
                          {s.keyPoints.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exam Notes */}
                    {s.examNotes?.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                          <BookOpen size={14} className="text-emerald-600" /> Exam Notes
                        </h4>
                        <ul className="space-y-2">
                          {s.examNotes.map((n, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="col-span-full bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 text-center text-slate-400">
                No summaries available yet. Check back after a lecture is processed.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentSummaries;
