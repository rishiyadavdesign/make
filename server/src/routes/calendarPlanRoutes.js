import express from 'express';
import {
  createCalendarPlan,
  deleteCalendarPlan,
  listCalendarPlans,
  updateCalendarPlan
} from '../controllers/calendarPlanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(listCalendarPlans).post(createCalendarPlan);
router.route('/:id').put(updateCalendarPlan).delete(deleteCalendarPlan);

export default router;
