const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read MONGODB_URI directly from .env.local
let uri = process.env.MONGODB_URI;
if (!uri && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=')) {
      uri = trimmed.replace('MONGODB_URI=', '').trim();
      break;
    }
  }
}

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local or environment');
  process.exit(1);
}

// Find latest backup or use provided argument
const backupArg = process.argv[2];
let targetFile = backupArg;

if (!targetFile) {
  const backupDir = path.join(process.cwd(), 'backups');
  if (fs.existsSync(backupDir)) {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse();
    if (files.length > 0) {
      targetFile = path.join(backupDir, files[0]);
    }
  }
}

if (!targetFile || !fs.existsSync(targetFile)) {
  console.error('❌ No backup file found. Provide a path or create a backup first:');
  console.error('   npm run backup');
  console.error('   node scripts/restore.js <path-to-backup.json>');
  process.exit(1);
}

console.log(`📂 Using backup file: ${targetFile}`);

async function runRestore() {
  const content = fs.readFileSync(targetFile, 'utf-8');
  const backup = JSON.parse(content);

  if (!backup.collections) {
    console.error('❌ Invalid backup file format: missing "collections"');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  console.log(`📦 Restoring collections from backup (${backup.exportedAt || 'Unknown date'})...\n`);

  for (const [colName, docs] of Object.entries(backup.collections)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;

    const collection = db.collection(colName);
    let restoredCount = 0;

    for (const doc of docs) {
      const { _id, ...rest } = doc;
      const filter = _id
        ? { _id: mongoose.Types.ObjectId.isValid(_id) ? new mongoose.Types.ObjectId(_id) : _id }
        : rest;

      await collection.replaceOne(filter, doc, { upsert: true });
      restoredCount++;
    }

    console.log(`  ✓ Restored/Upserted ${restoredCount} documents in "${colName}"`);
  }

  console.log('\n✅ Database restore completed successfully!');
  await mongoose.disconnect();
}

runRestore().catch((err) => {
  console.error('❌ Restore failed:', err.message);
  process.exit(1);
});
