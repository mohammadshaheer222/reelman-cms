import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Requirement from '@/models/Requirement';

const DEFAULT_REQUIREMENTS = [
  'Cinematic Wedding Film',
  'Candid Photography',
  'Traditional Photography',
  'Traditional Videography',
  'Pre-Wedding Shoot',
  'Drone Cinematography',
  'Wedding Teaser & Reels',
  'Premium Photo Album',
  'Live Streaming / LED Wall',
];

export async function GET() {
  try {
    await connectDB();
    let list = await Requirement.find({}).sort({ order: 1, createdAt: 1 });

    if (list.length === 0) {
      const docs = DEFAULT_REQUIREMENTS.map((name, idx) => ({
        name,
        order: idx + 1,
        isDefault: true,
      }));
      await Requirement.insertMany(docs);
      list = await Requirement.find({}).sort({ order: 1, createdAt: 1 });
    }

    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch requirements';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Requirement name is required' },
        { status: 400 }
      );
    }

    const existing = await Requirement.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const count = await Requirement.countDocuments();
    const newReq = await Requirement.create({
      name,
      order: count + 1,
      isDefault: false,
    });

    return NextResponse.json({ success: true, data: newReq }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create requirement';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
