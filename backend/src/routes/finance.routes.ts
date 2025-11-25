import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ProjectFinance } from '../models';

const router = Router();

router.use(authenticate);

// Get finances for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const finances = await ProjectFinance.findAll({
      where: { projectId },
      order: [['yearMonth', 'ASC']]
    });
    res.json({ success: true, data: finances });
  } catch (error) {
    console.error('Get finances error:', error);
    res.status(500).json({ error: 'Failed to get finances' });
  }
});

// Create or update finance record (upsert by yearMonth)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, yearMonth, ...data } = req.body;
    const [finance, created] = await ProjectFinance.upsert({
      projectId,
      yearMonth,
      ...data
    });
    res.status(created ? 201 : 200).json({ success: true, data: finance });
  } catch (error) {
    console.error('Create/update finance error:', error);
    res.status(500).json({ error: 'Failed to create/update finance record' });
  }
});

// Bulk update finances
router.put('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { finances } = req.body;
    for (const finance of finances) {
      await ProjectFinance.upsert(finance);
    }
    res.json({ success: true, message: 'Finances updated' });
  } catch (error) {
    console.error('Bulk update finances error:', error);
    res.status(500).json({ error: 'Failed to update finances' });
  }
});

// Delete finance record
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const finance = await ProjectFinance.findByPk(id);
    if (!finance) {
      res.status(404).json({ error: 'Finance record not found' });
      return;
    }
    await finance.destroy();
    res.json({ success: true, message: 'Finance record deleted' });
  } catch (error) {
    console.error('Delete finance error:', error);
    res.status(500).json({ error: 'Failed to delete finance record' });
  }
});

export default router;
