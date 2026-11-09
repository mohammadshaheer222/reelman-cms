import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  const { id, noteId } = await params;
  try {
    await connectDB();
    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const note = client.notes.id(noteId);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    note.content = content.trim();
    note.updatedAt = new Date();
    await client.save();
    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'note_edited',
      description: 'Note edited',
    });
    return NextResponse.json({ data: note });
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  const { id, noteId } = await params;
  try {
    await connectDB();
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    client.notes.pull({ _id: noteId });
    await client.save();
    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'note_deleted',
      description: 'Note deleted',
    });
    return NextResponse.json({ message: 'Note deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

