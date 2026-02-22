'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Calendar as CalendarIcon, CheckCircle, Clock, GraduationCap, Bell, Filter } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const subjects = ['all', ...Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)))];

  useEffect(() => {
    if (!user || !db) return;

    const tasksQuery = query(
      collection(db!, 'tasks'),
      where('approved', '==', true)
    );
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a: any, b: any) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
      setTasks(all);
      setLoading(false);
    });

    const notifQuery = query(
      collection(db!, 'notifications'),
      where('userId', 'in', [user.uid, 'all'])
    );
    const unsubNotifs = onSnapshot(notifQuery, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      setNotifications(all);
    });

    return () => { unsubTasks(); unsubNotifs(); };
  }, [user]);

  const markAsRead = async (notifId: string) => {
    if (!db) return;
    await updateDoc(doc(db!, 'notifications', notifId), { read: true });
  };

  const filteredTasks = subjectFilter === 'all'
    ? tasks
    : tasks.filter(t => t.subject === subjectFilter);

  const calendarEvents = filteredTasks.map(t => ({
    id: t.id,
    title: t.title,
    start: t.dueDate || t.due_date,
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  }));

  const firstName = user?.displayName?.split(' ')[0] ?? 'Student';
  const unread = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Hello, {firstName}!</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              You have {filteredTasks.length} upcoming assignment{filteredTasks.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Subject filter */}
          {subjects.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Calendar + Tasks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Calendar */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <CalendarIcon className="text-indigo-600" size={20} />
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Task Calendar</h2>
              </div>
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
                height="auto"
              />
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-700">
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Upcoming Assignments</h2>
              </div>
              {loading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-xl" />)}
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                    <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <Clock size={14} />
                              Due: {task.dueDate || task.due_date}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                              <GraduationCap size={14} />
                              {task.subject}
                            </div>
                          </div>
                        </div>
                        <CheckCircle size={24} className="text-slate-200 dark:text-slate-600 flex-shrink-0" />
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-slate-400">
                      {subjectFilter === 'all' ? 'No upcoming assignments. Enjoy your free time!' : `No assignments for "${subjectFilter}".`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Notifications + Study CTA */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Notifications</h2>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} new</span>
                  )}
                  <Bell size={18} className="text-slate-400" />
                </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[380px] overflow-y-auto">
                {notifications.length > 0 ? notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 group ${n.read ? 'opacity-60' : 'bg-indigo-50/40 dark:bg-indigo-900/10'}`}
                  >
                    <p className="text-sm text-slate-800 dark:text-slate-200">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400">
                        {n.createdAt ? new Date(n.createdAt?.seconds * 1000 || n.createdAt).toLocaleTimeString() : ''}
                      </p>
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400 text-sm">No new notifications.</div>
                )}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <h3 className="font-bold text-lg mb-2">Study Smarter</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Access AI-generated summaries and exam notes for all your lectures.
              </p>
              <a
                href="/dashboard/student/summaries"
                className="block w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm text-center hover:bg-indigo-50 transition-colors"
              >
                View Summaries →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
        .fc .fc-button-primary {
          background-color: #f8fafc; border-color: #e2e8f0;
          color: #64748b; font-weight: 600; font-size: 0.875rem; text-transform: capitalize;
        }
        .fc .fc-button-primary:hover { background-color: #f1f5f9; border-color: #cbd5e1; color: #0f172a; }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #4f46e5; border-color: #4f46e5; color: white; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
        .fc .fc-daygrid-day-number { font-size: 0.875rem; color: #64748b; padding: 8px; }
        .fc .fc-event { border-radius: 4px; padding: 2px 4px; font-size: 0.75rem; font-weight: 500; }
        .dark .fc .fc-toolbar-title { color: #f1f5f9; }
        .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: #334155; }
        .dark .fc .fc-daygrid-day-number { color: #94a3b8; }
        .dark .fc .fc-button-primary { background-color: #1e293b; border-color: #334155; color: #94a3b8; }
        .dark .fc .fc-button-primary:hover { background-color: #293548; color: #f1f5f9; }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentDashboard;
