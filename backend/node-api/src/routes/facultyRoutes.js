import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { facultyDashboard } from '../controllers/facultyController.js';

const router = express.Router();

router.get('/dashboard', protect, authorizeRoles('faculty', 'admin'), facultyDashboard);

export default router;
