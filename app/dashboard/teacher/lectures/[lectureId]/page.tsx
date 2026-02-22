'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GraduationCap,
  ChevronLeft,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const LectureDetails = () => {
  const { lectureId } = useParams();
  const { user } = useAuth();
  const [lecture, setLecture] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!lectureId) return;
      
      try {
        const lectureDoc = await getDoc(doc(db, 'lectures', lectureId as string));
        const summaryDoc = await getDoc(doc(db, 'summaries', lectureId as string));
        const tasksQuery = query(collection(db, 'tasks'), where('lectureId', '==', lectureId));
        const tasksSnapshot = await getDocs(tasksQuery);

        if (lectureDoc.exists()) setLecture(lectureDoc.data());
        if (summaryDoc.exists()) setSummary(summaryDoc.data());
        setTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load lecture details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lectureId]);

  const toggleTaskApproval = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        approved: !currentStatus
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, approved: !currentStatus } : t));
      toast.success(currentStatus ? 'Task rejected' : 'Task approved');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Clock className="animate-spin text-indigo-600" /></div></DashboardLayout>;
  if (!lecture) return <DashboardLayout>Lecture not found</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/teacher/lectures" className="p-2 hover:bg-slate-100 rounded-lg transition-all">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{lecture.subject}</h1>
              <p className="text-slate-500">{new Date(lecture.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
            <Download size={20} />
            Export PDF Notes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Summary & Transcript */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-indigo-600" size={20} />
                <h2 className="font-bold text-xl text-slate-900">AI Summary</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {summary?.shortSummary}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    Key Points
                  </h3>
                  <ul className="space-y-3">
                    {summary?.keyPoints?.map((point: string, i: number) => (
                      <li key={i} className="text-slate-600 text-sm flex gap-3">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <GraduationCap size={18} className="text-amber-500" />
                    Exam Notes
                  </h3>
                  <ul className="space-y-3">
                    {summary?.examNotes?.map((note: string, i: number) => (
                      <li key={i} className="text-slate-600 text-sm flex gap-3">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0"></span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Transcript Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-indigo-600" size={20} />
                <h2 className="font-bold text-xl text-slate-900">Full Transcript</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                {lecture.transcript}
              </div>
            </div>
          </div>

          {/* Right Column: Tasks */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h2 className="font-bold text-xl text-slate-900">Extracted Tasks</h2>
                <p className="text-xs text-slate-500 mt-1">Approve tasks to share them with students.</p>
              </div>
              <div className="divide-y divide-slate-50">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{task.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Due: {task.dueDate}</span>
                      <button 
                        onClick={() => toggleTaskApproval(task.id, task.approved)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          task.approved 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-red-50 hover:text-red-600' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {task.approved ? 'Approved' : 'Approve Task'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LectureDetails;
