'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const TeacherLectures = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    // No orderBy — sort client-side to avoid needing a composite index
    const q = query(
      collection(db!, 'lectures'),
      where('teacherId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      setLectures(all);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">My Lectures</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {loading ? 'Loading…' : `${lectures.length} lecture${lectures.length !== 1 ? 's' : ''} recorded`}
            </p>
          </div>
          <Link
            href="/dashboard/teacher/record"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            + New Lecture
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lectures.length > 0 ? lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{lecture.subject}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(lecture.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/teacher/lectures/${lecture.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-indigo-700 transition-all flex-shrink-0"
                  >
                    <ExternalLink size={16} /> View Details
                  </Link>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 text-center text-slate-400">
                No lectures recorded yet.{' '}
                <Link href="/dashboard/teacher/record" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Record your first lecture →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherLectures;
