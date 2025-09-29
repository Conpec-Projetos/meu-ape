import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/firebase/users/service';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const userData = await req.json();
    const updatedUser = await updateUser(id, userData);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await deleteUser(id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
