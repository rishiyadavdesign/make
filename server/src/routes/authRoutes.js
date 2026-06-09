import express from 'express';
import { accessCodeLogin, completeFirstLogin, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/login', login);
router.post('/access-code-login', accessCodeLogin);
router.get('/me', protect, me);
router.post('/first-login', protect, completeFirstLogin);

export default router;
