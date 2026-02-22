'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { BookOpen, FileText, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const TeacherLectures = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'lectures'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLectures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Lectures</h1>
          <p className="text-slate-500 mt-1">Manage and review all your recorded lectures.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {lectures.length > 0 ? lectures.map((lecture) => (
            <div key={lecture.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{lecture.subject}</h3>
                    <p className="text-sm text-slate-500">{new Date(lecture.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                    <Download size={18} />
                    Notes
                  </button>
                  <Link 
                    href={`/dashboard/teacher/lectures/${lecture.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                  >
                    <ExternalLink size={18} />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
              No lectures found. Start by recording your first lecture!
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherLectures;
