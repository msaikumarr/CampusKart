const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const JWT_SECRET = requireEnv('JWT_SECRET');
const MONGODB_URI = requireEnv('MONGODB_URI');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
if (isProduction && !process.env.SERVER_URL) {
  throw new Error('Missing required environment variable in production: SERVER_URL');
}

const rawClientOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || '';
const CLIENT_ORIGINS = rawClientOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && CLIENT_ORIGINS.length === 0) {
  throw new Error('Missing required environment variable in production: CLIENT_URL or CLIENT_URLS');
}

const CLIENT_URL = CLIENT_ORIGINS[0] || 'http://localhost:5173';

module.exports = {
  isProduction,
  JWT_SECRET,
  MONGODB_URI,
  SERVER_URL,
  CLIENT_URL,
  CLIENT_ORIGINS,
};
