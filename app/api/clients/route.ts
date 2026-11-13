import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/apiMiddleware';
import { generateId } from '@/lib/utils';
import { z } from 'zod';

const createClientSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  date: z.string().optional(),
  dates: z.array(z.string()).optional(),
  location: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  packageDetails: z.string().optional(),
  noteContent: z.string().optional(),
  statusId: z.string().optional(),
  workPrice: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
  advancePaid: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
  paymentStatus: z
    .enum(['unpaid', 'advance-received', 'partially-paid', 'fully-paid'])
    .optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const statusId = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'newest';
    const archived = searchParams.get('archived') === 'true';

    const query: Record<string, unknown> = { isArchived: archived };
    if (statusId) {
      if (statusId.includes(',')) {
        const ids = statusId.split(',').map((s) => s.trim()).filter(Boolean);
        if (ids.length > 0) query.status = { $in: ids };
      } else {
        query.status = statusId;
      }
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { requirements: { $in: [new RegExp(search, 'i')] } },
        { 'notes.content': { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> =
      sort === 'oldest'
        ? { createdAt: 1 }
        : sort === 'updated'
        ? { updatedAt: -1 }
        : sort === 'alpha'
        ? { name: 1 }
        : { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('status', 'name color whatsappMessage')
        .populate('createdBy', 'name')
        .lean(),
      Client.countDocuments(query),
    ]);
    return NextResponse.json({
      data: clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const {
      name,
      phone,
      date,
      dates,
      location,
      requirements,
      packageDetails,
      noteContent,
      statusId,
      workPrice,
      advancePaid,
      paymentStatus,
    } = parsed.data;

    let statusDoc = statusId ? await Status.findById(statusId) : null;
    if (!statusDoc) statusDoc = await Status.findOne({ name: 'New' });
    if (!statusDoc) statusDoc = await Status.findOne().sort({ order: 1 });
    if (!statusDoc) {
      return NextResponse.json(
        { error: 'No statuses found. Please visit /api/seed first.' },
        { status: 400 }
      );
    }

    const clientId = generateId('RC');
    const initialNotes = noteContent?.trim()
      ? [
          {
            content: noteContent.trim(),
            createdBy: user!.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      : [];

    const effectiveDates = Array.isArray(dates) && dates.length > 0
      ? dates
      : date?.trim()
      ? [date.trim()]
      : [];

    const client = await Client.create({
      clientId,
      name: name?.trim() || undefined,
      phone: phone?.trim() || undefined,
      date: effectiveDates[0] || date?.trim() || undefined,
      dates: effectiveDates,
      location: location?.trim() || undefined,
      requirements: Array.isArray(requirements) ? requirements : [],
      packageDetails: packageDetails?.trim() || undefined,
      workPrice: typeof workPrice === 'number' ? workPrice : 0,
      advancePaid: typeof advancePaid === 'number' ? advancePaid : 0,
      paymentStatus: paymentStatus || (advancePaid && advancePaid > 0 ? 'advance-received' : 'unpaid'),
      notes: initialNotes,
      status: statusDoc._id,
      statusHistory: [
        {
          status: statusDoc._id.toString(),
          statusName: statusDoc.name,
          changedBy: user!.userId,
          changedAt: new Date(),
        },
      ],
      createdBy: user!.userId,
    });

    await Activity.create({
      clientId: client._id,
      userId: user!.userId,
      action: 'client_created',
      description: `Client ${clientId} created`,
    });

    const populated = await Client.findById(client._id)
      .populate('status', 'name color whatsappMessage')
      .populate('createdBy', 'name')
      .lean();
    return NextResponse.json({ data: populated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

