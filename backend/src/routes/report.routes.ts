import { Router } from 'express';
import {
  getProjectReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  getProjectReportSummary
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all reports for a project
router.get('/project/:projectId', getProjectReports);

// Get report summary for a project
router.get('/project/:projectId/summary', getProjectReportSummary);

// Get single report
router.get('/:id', getReport);

// Create report (manager and admin only)
router.post('/', authorize('admin', 'manager'), createReport);

// Update report (manager and admin only)
router.put('/:id', authorize('admin', 'manager'), updateReport);

// Delete report (admin only)
router.delete('/:id', authorize('admin'), deleteReport);

export default router;
