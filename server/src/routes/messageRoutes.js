import express from 'express';
import { listContacts, listConversation, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);
router.get('/contacts', listContacts);
router.get('/:userId', listConversation);
router.post('/', upload.array('files', 5), sendMessage);

export default router;
