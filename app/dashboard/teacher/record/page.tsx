'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mic, Square, Save, Trash2, Loader2, Music } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const RecordLecture = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subject, setSubject] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Recording stopped');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!audioBlob || !subject) {
      toast.error('Please provide a subject and record audio');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `lectures/${user?.uid}/${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('lectures')
        .upload(fileName, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('lectures')
        .getPublicUrl(fileName);

      // Call backend to process
      const idToken = await user?.getIdToken();
      const response = await axios.post('/api/process-lecture', {
        audioUrl: publicUrl,
        subject,
        teacherId: user?.uid
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      toast.success('Lecture processed successfully!');
      router.push('/dashboard/teacher');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to process lecture');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Record New Lecture</h1>
          <p className="text-slate-500 mt-2">Record your lecture and let AI handle the notes and assignments.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
          {/* Subject Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Lecture Subject</label>
            <input 
              type="text" 
              placeholder="e.g. Computer Networks - Chapter 3"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Recording Interface */}
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            {isRecording ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                  <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200">
                    <Mic size={40} />
                  </div>
                </div>
                <div className="text-4xl font-mono font-bold text-slate-900 tracking-wider">
                  {formatTime(recordingTime)}
                </div>
                <button 
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all"
                >
                  <Square size={20} fill="white" />
                  Stop Recording
                </button>
              </div>
            ) : audioBlob ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Music size={40} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">Recording Complete</p>
                  <p className="text-sm text-slate-500">Audio is ready for processing</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setAudioBlob(null)}
                    className="flex items-center gap-2 text-slate-600 px-6 py-2 rounded-xl font-semibold hover:bg-slate-100 transition-all"
                  >
                    <Trash2 size={18} />
                    Discard
                  </button>
                  <button 
                    onClick={startRecording}
                    className="flex items-center gap-2 text-indigo-600 px-6 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
                  >
                    <Mic size={18} />
                    Record Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Mic size={40} />
                </div>
                <p className="text-slate-500 font-medium">Click the button below to start recording</p>
                <button 
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  <Mic size={20} />
                  Start Recording
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button 
            disabled={!audioBlob || !subject || isUploading}
            onClick={handleUpload}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all shadow-lg shadow-slate-300"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing with AI...
              </>
            ) : (
              <>
                <Save size={20} />
                Save & Process Lecture
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecordLecture;
