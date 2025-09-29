import { NextRequest, NextResponse } from 'next/server';
import { approveAgentRequest, denyAgentRequest } from '@/firebase/users/service';

export async function POST(req: NextRequest, context: { params: Promise<{id: string}>}) {
  try {
    const params = await context.params;
    const { id } = params
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
    console.error(`Error processing agent request ${req}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
