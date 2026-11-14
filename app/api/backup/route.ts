import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const collections = await db.listCollections().toArray();

    const backupData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      database: db.databaseName,
      collections: {},
      summary: {},
    };

    const collMap: Record<string, unknown[]> = {};
    const summaryMap: Record<string, number> = {};

    for (const col of collections) {
      const name = col.name;
      if (name.startsWith('system.')) continue;

      let docs = await db.collection(name).find({}).toArray();

      // Mask passwordHash from users for security
      if (name === 'users') {
        docs = docs.map((u) => {
          const { passwordHash, ...rest } = u;
          return rest;
        });
      }

      collMap[name] = docs;
      summaryMap[name] = docs.length;
    }

    backupData.collections = collMap;
    backupData.summary = summaryMap;

    const jsonStr = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `reelman_backup_${dateStr}.json`;

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    console.error('Backup API error:', err);
    const msg = err instanceof Error ? err.message : 'Backup generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
