import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Use temporary memory storage to hold buffered file data
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const uploadPropertyImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      req.imageUrls = [];
      return next();
    }

    // Map through files and upload buffers directly into Cloudinary stream
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'property_platform_listings' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    req.imageUrls = uploadedUrls.filter((url) => typeof url === 'string' && url.startsWith('https://'));
    next();
  } catch (error) {
    res.status(500).json({ message: 'Media stream upload failed', error: error.message });
  }
};

export { upload, uploadPropertyImages };