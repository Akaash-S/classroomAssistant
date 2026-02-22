'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon, CheckCircle, Clock, GraduationCap, Bell } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for approved tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('approved', '==', true),
      orderBy('dueDate', 'asc')
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeNotifications();
    };
  }, [user]);

  const calendarEvents = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.dueDate,
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hello, {user?.displayName?.split(' ')[0]}!</h1>
            <p className="text-slate-500 mt-1">You have {tasks.length} upcoming assignments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Calendar & Tasks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Calendar Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <CalendarIcon className="text-indigo-600" size={20} />
                <h2 className="font-bold text-lg text-slate-900">Task Calendar</h2>
              </div>
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                  }}
                  height="auto"
                />
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h2 className="font-bold text-lg text-slate-900">Upcoming Assignments</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {tasks.length > 0 ? tasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock size={14} />
                            Due: {task.dueDate}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            <GraduationCap size={14} />
                            {task.subject}
                          </div>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-emerald-500 transition-colors">
                        <CheckCircle size={24} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-slate-400">No upcoming assignments. Enjoy your free time!</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Content: Notifications & Summaries */}
          <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900">Notifications</h2>
                <Bell size={18} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 ${notif.read ? 'opacity-60' : 'bg-indigo-50/30'}`}>
                    <p className="text-sm text-slate-800">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400 text-sm">No new notifications.</div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
              <h3 className="font-bold text-lg mb-2">Study Smarter</h3>
              <p className="text-indigo-100 text-sm mb-4">Access AI-generated summaries and exam notes for all your lectures.</p>
              <button className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                View Summaries
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }
        .fc .fc-button-primary {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: capitalize;
        }
        .fc .fc-button-primary:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #f1f5f9;
        }
        .fc .fc-daygrid-day-number {
          font-size: 0.875rem;
          color: #64748b;
          padding: 8px;
        }
        .fc .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentDashboard;
