'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Mic, Upload, CheckCircle, Clock, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ lectures: 0, pendingTasks: 0 });
  const [recentLectures, setRecentLectures] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for lectures
    const lecturesQuery = query(
      collection(db, 'lectures'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeLectures = onSnapshot(lecturesQuery, (snapshot) => {
      setRecentLectures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, lectures: snapshot.size }));
    });

    // Real-time listener for pending tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('teacherId', '==', user.uid),
      where('approved', '==', false)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setPendingTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, pendingTasks: snapshot.size }));
    });

    return () => {
      unsubscribeLectures();
      unsubscribeTasks();
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, Prof. {user?.displayName?.split(' ')[1]}</h1>
            <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your classes today.</p>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/dashboard/teacher/record"
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Mic size={20} />
              Record Lecture
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Lectures</p>
            <p className="text-2xl font-bold text-slate-900">{stats.lectures}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle size={24} />
            </div>
            <p className="text-slate-500 text-sm font-medium">Tasks Approved</p>
            <p className="text-2xl font-bold text-slate-900">24</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Lectures */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Recent Lectures</h2>
              <Link href="/dashboard/teacher/lectures" className="text-indigo-600 text-sm font-semibold hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentLectures.length > 0 ? recentLectures.map((lecture) => (
                <div key={lecture.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{lecture.subject}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(lecture.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                      Processed
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">No lectures recorded yet.</div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="font-bold text-lg text-slate-900">Pending Task Approvals</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingTasks.length > 0 ? pendingTasks.map((task) => (
                <div key={task.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600">Due: {task.dueDate}</span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 rounded text-indigo-600">{task.subject}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">No pending tasks.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
