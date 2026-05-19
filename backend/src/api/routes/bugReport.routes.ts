import express from 'express';
import {
  submitBugReport,
  getAllBugReports,
  updateBugReportStatus,
  deleteBugReport,
} from '../controllers/bugReport.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Submit bug report (any authenticated user)
router.post('/submit', submitBugReport);

// Get all bug reports (admin only)
router.get('/all', getAllBugReports);

// Update bug report status (admin only)
router.patch('/:reportId/status', updateBugReportStatus);

// Delete bug report (admin only)
router.delete('/:reportId', deleteBugReport);

export default router;
