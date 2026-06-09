import mongoose from 'mongoose';

function isValidMongoUri(uri) {
  return typeof uri === 'string' && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));
}

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required. Set MONGO_URI as an environment variable. Example: mongodb+srv://user:password@cluster0.mongodb.net/mydb');
  }

  if (!isValidMongoUri(uri)) {
    throw new Error('Invalid MONGO_URI provided. Expected scheme to start with "mongodb://" or "mongodb+srv://"');
  }

  // Detect common placeholder values that indicate the URI wasn't updated
  const lower = uri.toLowerCase();
  if (/[<>]/.test(uri) || lower.includes('<cluster>') || lower.includes('<password>') || lower.includes('username:password') || lower.includes('your-password') || lower.includes('your-username')) {
    throw new Error('MONGO_URI appears to contain placeholder values (e.g. <cluster>, <password>). Replace placeholders with your real Atlas cluster, username and URL-encoded password.');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
