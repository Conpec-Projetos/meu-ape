import { NextRequest, NextResponse } from 'next/server';
import { listAgentRequests } from '@/firebase/users/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'denied' | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitSize = parseInt(searchParams.get('limit') || '20', 10);

    if (!status) {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
    }

    const { requests, totalPages, total } = await listAgentRequests(status, page, limitSize);

    return NextResponse.json({ requests, totalPages, total });
  } catch (error) {
    console.error('Error fetching agent requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
