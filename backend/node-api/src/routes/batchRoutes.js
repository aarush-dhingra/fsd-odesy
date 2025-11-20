import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { listBatches, getBatchDetails, uploadBatch, deleteBatch } from '../controllers/batchController.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('faculty', 'admin'), listBatches);
router.get('/:id', protect, authorizeRoles('faculty', 'admin'), getBatchDetails);
router.post('/upload', protect, authorizeRoles('faculty', 'admin'), upload.single('file'), uploadBatch);
router.delete('/:id', protect, authorizeRoles('faculty', 'admin'), deleteBatch);

export default router;
