import express from 'express';
import { createAppNote, deleteAppNote, listAppNotes, updateAppNote } from '../controllers/appNoteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(listAppNotes).post(createAppNote);
router.route('/:id').put(updateAppNote).delete(deleteAppNote);

export default router;
