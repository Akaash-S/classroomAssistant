'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const StudentCalendar = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('approved', '==', true),
      orderBy('dueDate', 'asc')
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribeTasks();
  }, [user]);

  const calendarEvents = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.dueDate,
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    extendedProps: {
      subject: task.subject,
      description: task.description
    }
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Calendar</h1>
          <p className="text-slate-500 mt-1">Keep track of all your assignments and deadlines.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="700px"
          />
        </div>
      </div>
      
      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc .fc-toolbar-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
        .fc .fc-button-primary {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
        }
        .fc .fc-button-primary:hover { background-color: #f1f5f9; color: #0f172a; }
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
        .fc .fc-daygrid-day-number { font-weight: 600; color: #64748b; padding: 12px; }
        .fc .fc-event {
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentCalendar;
