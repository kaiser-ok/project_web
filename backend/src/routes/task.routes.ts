import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Placeholder routes - will be implemented later
router.get('/', (req, res) => res.json({ message: 'Get tasks' }));
router.post('/', (req, res) => res.json({ message: 'Create task' }));

export default router;
