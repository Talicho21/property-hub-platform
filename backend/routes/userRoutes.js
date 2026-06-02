import express from 'express';
import { getAllUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('ADMIN'), getAllUsers);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateUser);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteUser);

export default router;