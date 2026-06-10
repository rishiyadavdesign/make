import express from 'express';
import { accessCodeLogin, changePassword, completeFirstLogin, login, me, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/login', login);
router.post('/access-code-login', accessCodeLogin);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/first-login', protect, completeFirstLogin);

export default router;
