import express from 'express';
import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
} from '../controllers/propertyController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload, uploadPropertyImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const handlePropertyUpload = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || 'Invalid image upload payload',
      });
    }
    next();
  });
};

// Public route to view all listings
router.get('/', protect, authorizeRoles('TENANT', 'LANDLORD', 'ADMIN'), getAllProperties);

router.get('/:id', protect, authorizeRoles('TENANT', 'LANDLORD', 'ADMIN'), getPropertyById);

// Protected multi-tenant route - Max 5 images array upload
router.post(
  '/',
  protect,
  authorizeRoles('LANDLORD', 'ADMIN'),
  handlePropertyUpload,
  uploadPropertyImages,
  createProperty
);

router.put(
  '/:id',
  protect,
  authorizeRoles('LANDLORD', 'ADMIN'),
  handlePropertyUpload,
  uploadPropertyImages,
  updateProperty
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('LANDLORD', 'ADMIN'),
  deleteProperty
);

export default router;