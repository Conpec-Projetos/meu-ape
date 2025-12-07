import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/services/usersService';

export async function PUT(req: NextRequest, context: { params: Promise<{id: string}>}) {
  try {
    const params = await context.params;
    const { id } = params
    const userData = await req.json();
    const updatedUser = await updateUser(id, userData);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${req}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{id: string}>}) {
  try {
    const params = await context.params;
    const { id } = params
    await deleteUser(id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user ${req}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
