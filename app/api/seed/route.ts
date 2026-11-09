import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Status from '@/models/Status';

const DEFAULT_STATUSES = [
  { name: 'New', color: '#6366f1', order: 1, isDefault: true },
  { name: 'Active', color: '#22c55e', order: 2, isDefault: true },
  { name: 'Pending', color: '#f59e0b', order: 3, isDefault: true },
  { name: 'Follow-up', color: '#8b5cf6', order: 4, isDefault: true },
  { name: 'Confirmed', color: '#06b6d4', order: 5, isDefault: true },
  { name: 'In Progress', color: '#3b82f6', order: 6, isDefault: true },
  { name: 'Completed', color: '#10b981', order: 7, isDefault: true },
  { name: 'Payment Pending', color: '#f97316', order: 8, isDefault: true },
  { name: 'Cancelled', color: '#ef4444', order: 9, isDefault: true },
  { name: 'On Hold', color: '#6b7280', order: 10, isDefault: true },
];

export async function GET() {
  try {
    await connectDB();
    const count = await Status.countDocuments();
    if (count === 0) {
      await Status.insertMany(DEFAULT_STATUSES);
      return NextResponse.json({ message: 'Statuses seeded successfully', seeded: true });
    }
    return NextResponse.json({ message: 'Already seeded', seeded: false });
  } catch {
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}

