'use client';

// Opt out of static prerendering — this page uses browser-only MediaRecorder API
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mic, Square, Save, Trash2, Loader2, Music, Upload, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

type Tab = 'record' | 'upload';

const RecordLecture = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [subject, setSubject] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
      toast.success('Recording started');
    } catch {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Recording stopped — preview below');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioUrl(url);
    toast.success('Audio file loaded');
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(p => !p);
  };

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleProcess = async () => {
    if (!audioBlob || !subject.trim()) {
      toast.error('Please provide a subject and audio');
      return;
    }
    setIsUploading(true);
    try {
      // Determine file extension and MIME type
      let fileExt = 'webm';
      let mimeType = audioBlob.type;

      if (audioBlob instanceof File) {
        // For uploaded files, get extension from name
        const nameParts = audioBlob.name.split('.');
        if (nameParts.length > 1) fileExt = nameParts.pop()!.toLowerCase();
      } else {
        // For recorded blobs, try to infer from type
        if (mimeType.includes('mp4')) fileExt = 'mp4';
        else if (mimeType.includes('mpeg')) fileExt = 'mp3';
        else if (mimeType.includes('wav')) fileExt = 'wav';
        else if (mimeType.includes('ogg')) fileExt = 'ogg';
      }

      const fileName = `lectures/${user?.uid}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('lectures').upload(fileName, audioBlob, {
        contentType: mimeType,
        upsert: true
      });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('lectures').getPublicUrl(fileName);
      const idToken = await user?.getIdToken();

      await axios.post('/api/process-lecture', {
        audioUrl: publicUrl,
        subject: subject.trim(),
        teacherId: user?.uid,
      }, { headers: { Authorization: `Bearer ${idToken}` } });

      toast.success('Lecture processed successfully!');
      router.push('/dashboard/teacher');
    } catch (err: any) {
      console.error('[Supabase Upload Error]', err);
      if (err.message === 'Failed to fetch') {
        toast.error('Connection failed. Make sure "lectures" bucket exists in Supabase and CORS is configured.');
      } else {
        toast.error(err?.response?.data?.error || err.message || 'Failed to process lecture');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">New Lecture</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Record or upload audio — AI will handle the rest.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Lecture Subject</label>
            <input
              type="text"
              placeholder="e.g. Computer Networks — Chapter 3"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
            {(['record', 'upload'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); discard(); }}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {t === 'record' ? <><Mic className="inline mr-2" size={16} />Record</> : <><Upload className="inline mr-2" size={16} />Upload File</>}
              </button>
            ))}
          </div>

          {/* Record Tab */}
          {tab === 'record' && (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
              {isRecording ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200">
                      <Mic size={40} />
                    </div>
                  </div>
                  <div className="text-4xl font-mono font-bold text-slate-900 dark:text-slate-100">{formatTime(recordingTime)}</div>
                  <button onClick={stopRecording} className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all">
                    <Square size={20} fill="currentColor" /> Stop Recording
                  </button>
                </div>
              ) : audioBlob ? (
                <div className="flex flex-col items-center gap-5 w-full px-6">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                    <Music size={36} />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Recording Ready — Preview below</p>
                  {/* Audio preview */}
                  <audio
                    ref={audioRef}
                    src={audioUrl ?? undefined}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <button
                    onClick={togglePlayback}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play Preview</>}
                  </button>
                  <div className="flex gap-4 mt-2">
                    <button onClick={discard} className="flex items-center gap-2 text-slate-500 px-5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-semibold">
                      <Trash2 size={16} /> Discard
                    </button>
                    <button onClick={startRecording} className="flex items-center gap-2 text-indigo-600 px-5 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-sm font-semibold">
                      <Mic size={16} /> Record Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center">
                    <Mic size={40} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Click to start recording your lecture</p>
                  <button onClick={startRecording} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Mic size={20} /> Start Recording
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
              {audioBlob ? (
                <div className="flex flex-col items-center gap-5 w-full px-6">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                    <Music size={36} />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">File Loaded — Preview below</p>
                  <audio ref={audioRef} src={audioUrl ?? undefined} onEnded={() => setIsPlaying(false)} className="hidden" />
                  <button onClick={togglePlayback} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all">
                    {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play Preview</>}
                  </button>
                  <button onClick={discard} className="flex items-center gap-2 text-slate-500 px-5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-semibold">
                    <Trash2 size={16} /> Remove File
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-6 cursor-pointer">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center">
                    <Upload size={40} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-center">
                    Click to choose an audio file<br />
                    <span className="text-xs text-slate-400">MP3, WAV, WebM, OGG supported</span>
                  </p>
                  <span className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Upload size={20} /> Choose File
                  </span>
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Process Button */}
          <button
            disabled={!audioBlob || !subject.trim() || isUploading}
            onClick={handleProcess}
            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-slate-300 dark:shadow-none"
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={20} /> Processing with AI...</>
            ) : (
              <><Save size={20} /> Save &amp; Process Lecture</>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecordLecture;
