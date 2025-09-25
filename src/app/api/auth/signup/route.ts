import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/firebase-admin-config';
import { signupSchema } from '@/schemas/signupSchema';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = signupSchema.parse(body);

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      fullName,
      email,
      role: 'client',
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos', errors: error.flatten() }, { status: 400 });
    }

    // Check for Firebase errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/email-already-exists') {
            return NextResponse.json({ message: 'Email já cadastrado.' }, { status: 409 });
        }
    }

    return NextResponse.json({ message: 'Algo deu errado' }, { status: 500 });
  }
}
