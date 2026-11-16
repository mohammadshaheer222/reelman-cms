import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';
import { isValidObjectId, handleApiError } from '@/lib/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Note exceeds maximum permitted length (5000 characters)' },
        { status: 400 }
      );
    }

    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    client.notes.push({
      _id: new mongoose.Types.ObjectId(),
      content,
      createdBy: new mongoose.Types.ObjectId(user!.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await client.save();

    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'note_added',
      description: 'Note added to client',
    });

    const updated = await Client.findById(id).populate('notes.createdBy', 'name');
    return NextResponse.json({ data: updated?.notes }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to add note');
  }
}
