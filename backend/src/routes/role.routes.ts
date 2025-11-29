import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getRoles, updateRole, batchUpdateRoles } from '../controllers/role.controller';

const router = Router();

router.use(authenticate);

// Get all roles (admin only)
router.get('/', requireRole(['admin']), getRoles);

// Batch update roles (admin only) - must be before /:id route
router.put('/bulk/update', requireRole(['admin']), batchUpdateRoles);

// Update single role (admin only)
router.put('/:id', requireRole(['admin']), updateRole);

export default router;
