const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function getCredential(name, fallback) {
  const argNameMap = {
    ADMIN_EMAIL: 'email',
    ADMIN_USERNAME: 'username',
    ADMIN_PASSWORD: 'password',
  };

  return process.env[name] || getArg(argNameMap[name] || name.toLowerCase()) || fallback;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  const email = (getCredential('ADMIN_EMAIL', 'admin@campuskart.com') || '').toLowerCase();
  const username = getCredential('ADMIN_USERNAME', 'admin');
  const password = getCredential('ADMIN_PASSWORD', 'Admin@12345!');

  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash(password, 10);
  const update = {
    username,
    email,
    password: hashedPassword,
    isAdmin: true,
    isVerified: true,
    verificationStatus: 'approved',
    verificationDate: new Date(),
  };

  const result = await User.findOneAndUpdate(
    { email },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Admin account is ready:');
  console.log(`email: ${result.email}`);
  console.log(`username: ${result.username}`);
  console.log(`password: ${password}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Failed to create admin account:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});