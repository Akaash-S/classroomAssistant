import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { extractLectureData } from '@/lib/gemini';
import axios from 'axios';
import { FieldValue } from 'firebase-admin/firestore';

const PLACEHOLDER_TRANSCRIPT =
  'This is a placeholder transcript. In a real lecture, we would discuss the importance of network protocols like TCP and UDP. Your assignment is to solve chapter 3 problems by March 20th 2026.';

export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // ── Input validation ──────────────────────────────────────────────────
    const { audioUrl, subject, teacherId } = await req.json();

    if (!audioUrl || !subject || !teacherId) {
      return NextResponse.json({ error: 'audioUrl, subject, and teacherId are required' }, { status: 400 });
    }
    if (uid !== teacherId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 1. Speech-to-Text ─────────────────────────────────────────────────
    let transcript = PLACEHOLDER_TRANSCRIPT;
    if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST) {
      try {
        const url = `https://${process.env.RAPIDAPI_HOST}/transcribe?url=${encodeURIComponent(audioUrl)}&lang=en&task=transcribe`;

        const sttRes = await axios.post(
          url,
          {}, // Empty payload as requested
          {
            headers: {
              'x-rapidapi-key': process.env.RAPIDAPI_KEY,
              'x-rapidapi-host': process.env.RAPIDAPI_HOST,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 120_000,
          }
        );
        transcript = sttRes.data?.text || sttRes.data?.transcript || sttRes.data?.results?.[0]?.transcript || PLACEHOLDER_TRANSCRIPT;
      } catch (sttErr: any) {
        console.error('[STT Failure] RapidAPI responded with an error:', sttErr.response?.status, sttErr.response?.data || sttErr.message);
        console.warn('[STT] Falling back to placeholder transcript.');
      }
    }

    // ── 2. Gemini AI extraction ───────────────────────────────────────────
    const aiData = await extractLectureData(transcript);

    // ── 3. Persist to Firestore ───────────────────────────────────────────
    const lectureRef = await adminDb.collection('lectures').add({
      teacherId,
      subject,
      audioUrl,
      transcript,
      createdAt: new Date().toISOString(),
    });
    const lectureId = lectureRef.id;

    // Summary
    await adminDb.collection('summaries').doc(lectureId).set({
      lectureId,
      shortSummary: aiData.summary ?? '',
      keyPoints: aiData.key_points ?? [],
      examNotes: aiData.exam_notes ?? [],
      createdAt: new Date().toISOString(),
    });

    // Tasks + one notification per task
    const taskDocs = (aiData.tasks ?? []).map((task: any) => ({
      ...task,
      dueDate: task.due_date ?? task.dueDate ?? '',
      lectureId,
      teacherId,
      approved: false,
      createdAt: new Date().toISOString(),
    }));

    const batch = adminDb.batch();
    for (const task of taskDocs) {
      batch.set(adminDb.collection('tasks').doc(), task);
    }

    // Broadcast notification to all students (userId = 'all')
    if (taskDocs.length > 0) {
      batch.set(adminDb.collection('notifications').doc(), {
        userId: 'all',
        message: `New lecture processed: "${subject}" — ${taskDocs.length} task(s) pending approval.`,
        type: 'lecture_processed',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      lectureId,
      transcript,
      summary: aiData.summary,
      tasksCount: taskDocs.length,
    });

  } catch (error: any) {
    console.error('[process-lecture] GLOBAL ERROR:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
