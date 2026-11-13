// Quick connection tester for MongoDB Atlas (Zero dependencies)
const fs = require('fs');
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
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const maskedUri = uri.replace(/:[^:@]+@/, ':****@');
console.log('🔄 Testing connection to:', maskedUri);

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 6000 })
  .then(() => {
    console.log('✅ SUCCESS: Successfully authenticated and connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ CONNECTION FAILED:');
    console.error('Error:', err.message);
    if (err.message.includes('bad auth')) {
      console.log('\n👉 Reason: The password in .env.local does NOT match the password set in MongoDB Atlas.');
      console.log('Go to https://cloud.mongodb.com -> Database Access -> Edit user password -> Save -> Paste in .env.local');
    }
    process.exit(1);
  });
