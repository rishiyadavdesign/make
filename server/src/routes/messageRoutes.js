import express from 'express';
import { listContacts, listConversation, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/contacts', listContacts);
router.get('/:userId', listConversation);
router.post('/', sendMessage);

export default router;
