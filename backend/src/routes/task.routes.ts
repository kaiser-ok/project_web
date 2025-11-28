import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ProjectTask } from '../models';

const router = Router();

router.use(authenticate);

// Get tasks for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const tasks = await ProjectTask.findAll({
      where: { projectId },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create task
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // 驗證預計工時必填
    if (!req.body.estimatedHours || req.body.estimatedHours <= 0) {
      res.status(400).json({ error: '預計工時為必填欄位，且必須大於 0' });
      return;
    }

    const task = await ProjectTask.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // 如果更新包含預計工時，驗證其有效性
    if (req.body.estimatedHours !== undefined && req.body.estimatedHours <= 0) {
      res.status(400).json({ error: '預計工時必須大於 0' });
      return;
    }

    await task.update(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await ProjectTask.findByPk(id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Bulk update tasks (for reordering)
router.put('/bulk/update', async (req: AuthRequest, res: Response) => {
  try {
    const { tasks } = req.body;
    for (const task of tasks) {
      await ProjectTask.update(
        { sortOrder: task.sortOrder },
        { where: { id: task.id } }
      );
    }
    res.json({ success: true, message: 'Tasks updated' });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

export default router;
