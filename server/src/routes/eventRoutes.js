import express from 'express';
import { createEvent, deleteEvent, getEvent, listEvents, pinEvent, updateEvent } from '../controllers/eventController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(listEvents).post(authorize('Boss/Admin'), createEvent);
router.patch('/:id/pin', authorize('Boss/Admin', 'Project Manager'), pinEvent);
router.route('/:id').get(getEvent).put(authorize('Boss/Admin', 'Project Manager'), updateEvent).delete(authorize('Boss/Admin'), deleteEvent);

export default router;
