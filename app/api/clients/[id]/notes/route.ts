import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    client.notes.push({
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

