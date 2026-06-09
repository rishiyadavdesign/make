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
import { dashboardRouter, makeResourceRouter } from './routes/resourceRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();
await connectDB();

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

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/config', (_req, res) => res.json({ uploadStorage: uploadStorageMode }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
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

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`BPS API running on ${port}`));
