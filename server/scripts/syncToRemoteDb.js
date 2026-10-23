/**
 * syncToRemoteDb.js — One-Click Local Database to MongoDB Atlas Synchronizer
 * ─────────────────────────────────────────────────────────────────────────
 * Copies all local database collections (admins, theatres, movies, shows, users)
 * directly into your remote production MongoDB Atlas cluster.
 *
 * Usage:
 *   node server/scripts/syncToRemoteDb.js "<YOUR_MONGODB_ATLAS_URI>"
 * Or set TARGET_MONGO_URI in your terminal/environment.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');

async function syncDatabases() {
  const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017/imovies';
  const remoteUri = process.argv[2] || process.env.TARGET_MONGO_URI || process.env.REMOTE_MONGO_URI;

  if (!remoteUri) {
    console.error('\n❌ Please provide your target MongoDB Atlas URI:');
    console.error('Usage: node server/scripts/syncToRemoteDb.js "<YOUR_MONGODB_ATLAS_URI>"\n');
    process.exit(1);
  }

  console.log('\n=========================================================');
  console.log('🚀 Local to Remote MongoDB Atlas Database Sync');
  console.log('=========================================================');
  console.log(`[Source] Connecting to local DB: ${localUri}`);

  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('✅ Connected to local MongoDB.');

  console.log(`[Target] Connecting to remote Atlas DB...`);
  const remoteConn = await mongoose.createConnection(remoteUri).asPromise();
  console.log('✅ Connected to remote MongoDB Atlas.\n');

  const collections = [
    { name: 'Admins', model: localConn.model('Admin', Admin.schema), targetModel: remoteConn.model('Admin', Admin.schema) },
    { name: 'Users', model: localConn.model('User', User.schema), targetModel: remoteConn.model('User', User.schema) },
    { name: 'Theatres', model: localConn.model('Theatre', Theatre.schema), targetModel: remoteConn.model('Theatre', Theatre.schema) },
    { name: 'Movies', model: localConn.model('Movie', Movie.schema), targetModel: remoteConn.model('Movie', Movie.schema) },
    { name: 'Shows', model: localConn.model('Show', Show.schema), targetModel: remoteConn.model('Show', Show.schema) },
  ];

  for (const col of collections) {
    const docs = await col.model.find({}).lean();
    console.log(`Syncing ${docs.length} ${col.name}...`);
    if (docs.length > 0) {
      await col.targetModel.deleteMany({});
      await col.targetModel.insertMany(docs, { ordered: false });
    }
    console.log(`✅ ${col.name} synced to remote database.`);
  }

  console.log('\n🎉 All local data has been successfully copied to your MongoDB Atlas cluster!');
  console.log('=========================================================\n');

  await localConn.close();
  await remoteConn.close();
  process.exit(0);
}

syncDatabases().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
