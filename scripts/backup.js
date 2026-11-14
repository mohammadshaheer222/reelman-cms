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

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const backupData = {
    exportedAt: new Date().toISOString(),
    database: db.databaseName,
    collections: {},
    summary: {},
  };

  console.log(`📦 Exporting ${collections.length} collections...`);

  for (const col of collections) {
    const name = col.name;
    // Skip internal system collections
    if (name.startsWith('system.')) continue;

    let docs = await db.collection(name).find({}).toArray();

    // Sanitize user password hashes from backup if any
    if (name === 'users') {
      docs = docs.map((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      });
    }

    backupData.collections[name] = docs;
    backupData.summary[name] = docs.length;
    console.log(`  ✓ ${name}: ${docs.length} records`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n✅ Backup successfully created at:\n   ${backupFile}`);
  console.log(`📊 Total collections: ${Object.keys(backupData.collections).length}`);

  await mongoose.disconnect();
}

runBackup().catch((err) => {
  console.error('❌ Backup failed:', err.message);
  process.exit(1);
});
