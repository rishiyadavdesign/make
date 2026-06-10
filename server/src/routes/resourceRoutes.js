import express from 'express';
import {
  createResource,
  dashboard,
  deleteResource,
  listResource,
  markAllNotificationsRead,
  reviewSubmission,
  reviewExpense,
  updateResource
} from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

export function makeResourceRouter(type) {
  const router = express.Router();
  router.use(protect);
  router.route('/').get(listResource(type)).post(upload.array('files'), createResource(type));
  if (type === 'notifications') router.patch('/read-all', markAllNotificationsRead);
  router.route('/:id').put(upload.array('files'), updateResource(type)).delete(deleteResource(type));
  if (type === 'submissions') router.patch('/:id/review', reviewSubmission);
  if (type === 'expenses') router.patch('/:id/review', reviewExpense);
  return router;
}

export const dashboardRouter = express.Router();
dashboardRouter.get('/', protect, dashboard);
