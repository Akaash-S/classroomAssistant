import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

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
    const { approved } = await req.json();
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: '"approved" must be a boolean' }, { status: 400 });
    }

    // ── Fetch task & verify ownership ─────────────────────────────────────
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskSnap.data()!;
    if (taskData.teacherId !== uid) {
      return NextResponse.json({ error: 'Forbidden — not your task' }, { status: 403 });
    }

    // ── Update + broadcast notification ───────────────────────────────────
    const batch = adminDb.batch();

    batch.update(taskRef, { approved });

    if (approved) {
      batch.set(adminDb.collection('notifications').doc(), {
        userId: 'all',
        message: `📌 New assignment: "${taskData.title}" — Due ${taskData.dueDate || taskData.due_date || 'TBD'}`,
        type: 'task_approved',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, approved });

  } catch (error: any) {
    console.error('[tasks/approve]', error?.message ?? error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
