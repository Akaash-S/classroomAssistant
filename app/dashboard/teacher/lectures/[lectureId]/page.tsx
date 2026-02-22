'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, FileText, Lightbulb, GraduationCap, ClipboardList, Download, Play, Pause, Music } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const LectureDetail = () => {
  const { user } = useAuth();
  const params = useParams();
  const lectureId = params.lectureId as string;

  const [lecture, setLecture] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db || !lectureId) return;

    const fetchData = async () => {
      const firestore = db!;
      try {
        const [lectureSnap, summarySnap] = await Promise.all([
          getDoc(doc(firestore, 'lectures', lectureId)),
          getDoc(doc(firestore, 'summaries', lectureId)),
        ]);
        if (lectureSnap.exists()) setLecture({ id: lectureSnap.id, ...lectureSnap.data() });
        if (summarySnap.exists()) setSummary({ id: summarySnap.id, ...summarySnap.data() });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, lectureId]);

  const handleDownloadNotes = () => {
    if (!lecture || !summary) return;
    const content = [
      `# ${lecture.subject}`,
      `Date: ${new Date(lecture.createdAt).toLocaleString()}`,
      '',
      '## Summary',
      summary.shortSummary,
      '',
      '## Key Points',
      ...(summary.keyPoints || []).map((p: string) => `- ${p}`),
      '',
      '## Exam Notes',
      ...(summary.examNotes || []).map((n: string) => `- ${n}`),
      '',
      '## Transcript',
      lecture.transcript,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lecture.subject.replace(/\s+/g, '_')}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!lecture) {
    return (
      <DashboardLayout>
        <div className="text-center py-24 text-slate-400">
          Lecture not found.{' '}
          <Link href="/dashboard/teacher/lectures" className="text-indigo-600 underline">Go back</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/teacher/lectures"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-500"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lecture.subject}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {new Date(lecture.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadNotes}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all text-sm"
          >
            <Download size={16} /> Download Notes
          </button>
        </div>

        {/* Audio Player */}
        {lecture.audioUrl && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                <Music size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider text-slate-500">Lecture Audio</h2>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Listen to recording</p>
              </div>
            </div>
            <audio
              controls
              src={lecture.audioUrl}
              className="w-full h-10"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Summary Card */}
        {summary && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-indigo-600" size={20} />
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Lecture Summary</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{summary.shortSummary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Key Points */}
          {summary?.keyPoints?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="text-amber-500" size={20} />
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Key Points</h2>
              </div>
              <ul className="space-y-2">
                {summary.keyPoints.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exam Notes */}
          {summary?.examNotes?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-emerald-600" size={20} />
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Exam Notes</h2>
              </div>
              <ul className="space-y-2">
                {summary.examNotes.map((note: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Transcript */}
        {lecture.transcript && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-slate-500" size={20} />
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Transcript</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {lecture.transcript}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LectureDetail;
