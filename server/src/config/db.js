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

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
