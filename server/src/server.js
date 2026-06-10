import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/error.js';
import { uploadStorageMode } from './utils/fileStorage.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { dashboardRouter, makeResourceRouter } from './routes/resourceRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

try {
  await connectDB();
} catch (err) {
  console.error('Failed to connect to MongoDB during startup:', err);
  // Exit so the host platform knows the service failed to start
  process.exit(1);
}

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const serveClient = process.env.SERVE_CLIENT === 'true';
if (serveClient) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/config', (_req, res) => res.json({ uploadStorage: uploadStorageMode }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', makeResourceRouter('tasks'));
app.use('/api/equipment', makeResourceRouter('equipment'));
app.use('/api/responsibilities', makeResourceRouter('responsibilities'));
app.use('/api/checklist', makeResourceRouter('checklist'));
app.use('/api/notes', makeResourceRouter('notes'));
app.use('/api/notifications', makeResourceRouter('notifications'));
app.use('/api/submissions', makeResourceRouter('submissions'));
app.use('/api/expenses', makeResourceRouter('expenses'));
app.use('/api/dashboard', dashboardRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5001);
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => console.log(`BPS API running on ${host}:${port}`));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Let the process crash in production so the platform can restart it.
  process.exit(1);
});
