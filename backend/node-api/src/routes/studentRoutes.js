import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createStudent, listStudents } from '../controllers/studentController.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('admin', 'faculty'), createStudent);
router.get('/', protect, authorizeRoles('admin', 'faculty'), listStudents);

export default router;
