import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const client = await Client.findById(id)
      .populate('status', 'name color')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name');
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ data: client });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const { name, phone, statusId, assignedTo, isArchived } = body;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    if (name !== undefined) client.name = name;
    if (phone !== undefined) client.phone = phone;
    if (assignedTo !== undefined) client.assignedTo = assignedTo;
    if (isArchived !== undefined) client.isArchived = isArchived;

    if (statusId && statusId !== client.status.toString()) {
      const newStatus = await Status.findById(statusId);
      if (newStatus) {
        client.status = newStatus._id as mongoose.Types.ObjectId;
        client.statusHistory.push({
          status: newStatus._id.toString(),
          statusName: newStatus.name,
          changedBy: new mongoose.Types.ObjectId(user!.userId),
          changedAt: new Date(),
        });
        await Activity.create({
          clientId: client._id,
          userId: user!.userId,
          action: 'status_changed',
          description: `Status changed to "${newStatus.name}"`,
        });
      }
    }

    await client.save();
    const updated = await Client.findById(id)
      .populate('status', 'name color')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const client = await Client.findByIdAndUpdate(id, { isArchived: true }, { new: true });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'client_archived',
      description: 'Client archived',
    });
    return NextResponse.json({ message: 'Client archived successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to archive client' }, { status: 500 });
  }
}

