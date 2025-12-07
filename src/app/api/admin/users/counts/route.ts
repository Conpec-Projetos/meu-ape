import { NextResponse } from 'next/server';
import { getUserCounts } from '@/services/usersService';

export async function GET() {
  try {
    const counts = await getUserCounts();
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Failed to get user counts:', error);
    return NextResponse.json({ error: 'Failed to get user counts' }, { status: 500 });
  }
}
