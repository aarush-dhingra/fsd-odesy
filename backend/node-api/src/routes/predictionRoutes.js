import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  createSinglePrediction,
  uploadBatch,
  listPredictions,
  saveUserPrediction,
  getUserPredictions,
} from '../controllers/predictionController.js';

const router = express.Router();

// Route order matters - more specific routes first
router.post('/single', protect, authorizeRoles('student', 'faculty', 'admin'), createSinglePrediction);
router.post(
  '/batch',
  protect,
  authorizeRoles('faculty', 'admin'),
  upload.single('file'),
  uploadBatch
);
router.get('/all', protect, authorizeRoles('faculty', 'admin'), listPredictions); // Get all predictions (admin/faculty only)
router.get('/', protect, getUserPredictions); // Get user's own predictions

// Save user prediction - This route handles POST /api/predictions
router.post('/', protect, (req, res, next) => {
  console.log('POST /api/predictions route hit');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  saveUserPrediction(req, res, next);
});

export default router;
