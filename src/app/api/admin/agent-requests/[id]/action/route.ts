import { NextRequest, NextResponse } from 'next/server';
import { approveAgentRequest, denyAgentRequest } from '@/firebase/users/service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { action, adminMsg } = await req.json();

    if (!action || (action === 'deny' && !adminMsg)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (action === 'approve') {
      await approveAgentRequest(id);
      return NextResponse.json({ message: 'Agent request approved successfully' });
    } else if (action === 'deny') {
      await denyAgentRequest(id, adminMsg);
      return NextResponse.json({ message: 'Agent request denied successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(`Error processing agent request ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
