import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create user if doesn't exist (though usually handled by client)
      await adminDb.collection('users').doc(uid).set({
        uid,
        email: decodedToken.email,
        name: decodedToken.name,
        role: 'student', // Default
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ role: 'student' });
    }

    return NextResponse.json({ role: userDoc.data()?.role });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
