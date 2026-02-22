import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  try {
    const { lectureId } = await params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const summary = await adminDb.collection('summaries').doc(lectureId).get();

    if (!summary.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ id: summary.id, ...summary.data() });
  } catch (error: any) {
    console.error('[summary/lectureId]', error?.message ?? error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
