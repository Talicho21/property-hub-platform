import express from 'express';
import { approveLandlord, getPendingLandlords, getAllUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pending-landlords', protect, authorizeRoles('ADMIN'), getPendingLandlords);
router.put('/approve-landlord/:id', protect, authorizeRoles('ADMIN'), approveLandlord);

// User Management Routes
router.get('/users', protect, authorizeRoles('ADMIN'), getAllUsers);
router.put('/users/:id', protect, authorizeRoles('ADMIN'), updateUser);
router.delete('/users/:id', protect, authorizeRoles('ADMIN'), deleteUser);

export default router;