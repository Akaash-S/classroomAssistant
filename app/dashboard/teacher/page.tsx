'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Mic, CheckCircle, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [recentLectures, setRecentLectures] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    // Real-time: lectures for this teacher — sort client-side (no composite index needed)
    const lecturesQuery = query(
      collection(db!, 'lectures'),
      where('teacherId', '==', user.uid)
    );
    const unsubLectures = onSnapshot(lecturesQuery, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      setRecentLectures(all.slice(0, 5));
    });

    // Real-time: pending tasks
    const pendingQuery = query(
      collection(db!, 'tasks'),
      where('teacherId', '==', user.uid),
      where('approved', '==', false)
    );
    const unsubPending = onSnapshot(pendingQuery, (snap) => {
      setPendingTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Real-time: approved task count
    const approvedQuery = query(
      collection(db!, 'tasks'),
      where('teacherId', '==', user.uid),
      where('approved', '==', true)
    );
    const unsubApproved = onSnapshot(approvedQuery, (snap) => {
      setApprovedCount(snap.size);
    });

    return () => {
      unsubLectures();
      unsubPending();
      unsubApproved();
    };
  }, [user]);

  const handleTaskAction = async (taskId: string, approve: boolean) => {
    setActionLoading(taskId + (approve ? '-approve' : '-reject'));
    try {
      const idToken = await user?.getIdToken();
      await axios.put(`/api/tasks/approve/${taskId}`, { approved: approve }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      toast.success(approve ? 'Task approved!' : 'Task rejected.');
    } catch {
      toast.error('Action failed. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] ?? 'Professor';
  const totalLectures = recentLectures.length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, Prof. {firstName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here&apos;s what&apos;s happening with your classes today.
            </p>
          </div>
          <Link
            href="/dashboard/teacher/record"
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Mic size={20} />
            Record Lecture
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Lectures', value: totalLectures, icon: FileText, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Pending Approvals', value: pendingTasks.length, icon: Clock, bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Tasks Approved', value: approvedCount, icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={24} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Lectures */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Recent Lectures</h2>
              <Link href="/dashboard/teacher/lectures" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {recentLectures.length > 0 ? recentLectures.map((lecture) => (
                <Link
                  key={lecture.id}
                  href={`/dashboard/teacher/lectures/${lecture.id}`}
                  className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lecture.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(lecture.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                    Processed
                  </span>
                </Link>
              )) : (
                <div className="p-12 text-center text-slate-400">
                  No lectures recorded yet.{' '}
                  <Link href="/dashboard/teacher/record" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Record one →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Pending Task Approvals</h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
              {pendingTasks.length > 0 ? pendingTasks.map((task) => (
                <div key={task.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                          Due: {task.dueDate || task.due_date || 'TBD'}
                        </span>
                        {task.subject && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400">
                            {task.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTaskAction(task.id, true)}
                        disabled={!!actionLoading}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50"
                        title="Approve"
                      >
                        {actionLoading === task.id + '-approve'
                          ? <Loader2 size={20} className="animate-spin" />
                          : <CheckCircle size={20} />}
                      </button>
                      <button
                        onClick={() => handleTaskAction(task.id, false)}
                        disabled={!!actionLoading}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                        title="Reject"
                      >
                        {actionLoading === task.id + '-reject'
                          ? <Loader2 size={20} className="animate-spin" />
                          : <XCircle size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">No pending tasks. All clear! ✓</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
