import express from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { createUser, deleteUser, generateAccessCode, listUsers, resetPassword, updateUser } from '../controllers/userController.js';

const router = express.Router();
router.use(protect, authorize('Boss/Admin'));
router.route('/').get(listUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);
router.patch('/:id/reset-password', resetPassword);
router.patch('/:id/access-code', generateAccessCode);

export default router;
