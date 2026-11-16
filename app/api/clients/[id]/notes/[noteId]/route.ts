import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';
import { isValidObjectId, handleApiError } from '@/lib/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { id, noteId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(noteId)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const note = client.notes.id(noteId);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    // Authorization: only the author or an admin can edit this note
    const isAuthor = note.createdBy && note.createdBy.toString() === user!.userId;
    const isAdmin = user!.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit notes you created' },
        { status: 403 }
      );
    }

    note.content = content;
    note.updatedAt = new Date();
    await client.save();

    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'note_edited',
      description: 'Note edited',
    });

    return NextResponse.json({ data: note });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to update note');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { id, noteId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(noteId)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const note = client.notes.id(noteId);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    // Authorization: only the author or an admin can delete this note
    const isAuthor = note.createdBy && note.createdBy.toString() === user!.userId;
    const isAdmin = user!.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete notes you created' },
        { status: 403 }
      );
    }

    client.notes.pull({ _id: noteId });
    await client.save();

    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'note_deleted',
      description: 'Note deleted',
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to delete note');
  }
}
