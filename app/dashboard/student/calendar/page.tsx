'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const StudentCalendar = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db!, 'tasks'),
      where('approved', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort client-side so no composite index is required
      all.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
      setTasks(all);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const calendarEvents = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.dueDate || task.due_date,
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    extendedProps: {
      subject: task.subject,
      description: task.description,
    },
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Academic Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Keep track of all your assignments and deadlines.</p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse h-[700px]" />
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth',
              }}
              height="700px"
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc .fc-toolbar-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
        .fc .fc-button-primary {
          background-color: #f8fafc; border-color: #e2e8f0; color: #64748b;
          font-weight: 700; padding: 0.5rem 1rem; border-radius: 0.75rem;
        }
        .fc .fc-button-primary:hover { background-color: #f1f5f9; color: #0f172a; }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #4f46e5; border-color: #4f46e5; color: white; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
        .fc .fc-daygrid-day-number { font-weight: 600; color: #64748b; padding: 12px; }
        .fc .fc-event { border-radius: 6px; padding: 4px 8px; font-size: 0.8rem; font-weight: 600; }

        /* Dark mode */
        .dark .fc .fc-toolbar-title { color: #f1f5f9; }
        .dark .fc .fc-button-primary { background-color: #1e293b; border-color: #334155; color: #94a3b8; }
        .dark .fc .fc-button-primary:hover { background-color: #293548; color: #f1f5f9; }
        .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: #334155; }
        .dark .fc .fc-daygrid-day-number { color: #94a3b8; }
        .dark .fc .fc-daygrid-day.fc-day-today { background-color: rgba(79, 70, 229, 0.1); }
        .dark .fc .fc-col-header-cell-cushion { color: #94a3b8; }
        .dark .fc .fc-daygrid-more-link { color: #818cf8; }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentCalendar;
