import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { TaskWorkHour, ProjectTask } from '../models';
import { Op, fn, col } from 'sequelize';

const router = Router();

router.use(authenticate);

// Get work hours for a specific task
router.get('/task/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const workHours = await TaskWorkHour.findAll({
      where: { taskId },
      order: [['workDate', 'DESC']]
    });
    res.json({ success: true, data: workHours });
  } catch (error) {
    console.error('Get task work hours error:', error);
    res.status(500).json({ error: 'Failed to get work hours' });
  }
});

// Get work hours summary for a project (aggregated by task and worker)
router.get('/project/:projectId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get all tasks for this project
    const tasks = await ProjectTask.findAll({
      where: { projectId },
      include: [{
        model: TaskWorkHour,
        as: 'workHours'
      }],
      order: [['sortOrder', 'ASC']]
    });

    // Calculate summary per task
    const taskSummary = tasks.map(task => {
      const workHours = (task as any).workHours || [];
      const totalHours = workHours.reduce((sum: number, wh: any) => sum + parseFloat(wh.hours || 0), 0);

      // Group by worker
      const byWorker: Record<string, number> = {};
      workHours.forEach((wh: any) => {
        if (!byWorker[wh.workerName]) {
          byWorker[wh.workerName] = 0;
        }
        byWorker[wh.workerName] += parseFloat(wh.hours || 0);
      });

      return {
        taskId: task.id,
        taskName: task.taskName,
        assignee: task.assignee,
        totalHours,
        byWorker,
        entries: workHours.length
      };
    });

    // Calculate overall summary by worker
    const overallByWorker: Record<string, number> = {};
    taskSummary.forEach(task => {
      Object.entries(task.byWorker).forEach(([worker, hours]) => {
        if (!overallByWorker[worker]) {
          overallByWorker[worker] = 0;
        }
        overallByWorker[worker] += hours;
      });
    });

    const totalProjectHours = taskSummary.reduce((sum, task) => sum + task.totalHours, 0);

    res.json({
      success: true,
      data: {
        tasks: taskSummary,
        overallByWorker,
        totalProjectHours
      }
    });
  } catch (error) {
    console.error('Get project work hours summary error:', error);
    res.status(500).json({ error: 'Failed to get work hours summary' });
  }
});

// Get work hours for a project grouped by month and worker
router.get('/project/:projectId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get all task IDs for this project
    const tasks = await ProjectTask.findAll({
      where: { projectId },
      attributes: ['id']
    });
    const taskIds = tasks.map(t => t.id);

    if (taskIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // Get work hours grouped by month and worker
    const workHours = await TaskWorkHour.findAll({
      where: { taskId: { [Op.in]: taskIds } },
      attributes: [
        'workerName',
        [fn('to_char', col('work_date'), 'YYYY-MM'), 'yearMonth'],
        [fn('SUM', col('hours')), 'totalHours']
      ],
      group: ['workerName', fn('to_char', col('work_date'), 'YYYY-MM')],
      order: [[fn('to_char', col('work_date'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    res.json({ success: true, data: workHours });
  } catch (error) {
    console.error('Get monthly work hours error:', error);
    res.status(500).json({ error: 'Failed to get monthly work hours' });
  }
});

// Add work hour entry for a task
router.post('/task/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { workerName, workDate, hours, description } = req.body;

    // Verify task exists
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const workHour = await TaskWorkHour.create({
      taskId: parseInt(taskId),
      workerName,
      workDate,
      hours,
      description,
      createdBy: req.user?.id
    });

    res.status(201).json({ success: true, data: workHour });
  } catch (error) {
    console.error('Create task work hour error:', error);
    res.status(500).json({ error: 'Failed to create work hour entry' });
  }
});

// Update work hour entry
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { workerName, workDate, hours, description } = req.body;

    const workHour = await TaskWorkHour.findByPk(id);
    if (!workHour) {
      res.status(404).json({ error: 'Work hour entry not found' });
      return;
    }

    await workHour.update({
      workerName,
      workDate,
      hours,
      description
    });

    res.json({ success: true, data: workHour });
  } catch (error) {
    console.error('Update task work hour error:', error);
    res.status(500).json({ error: 'Failed to update work hour entry' });
  }
});

// Delete work hour entry
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workHour = await TaskWorkHour.findByPk(id);
    if (!workHour) {
      res.status(404).json({ error: 'Work hour entry not found' });
      return;
    }

    await workHour.destroy();
    res.json({ success: true, message: 'Work hour entry deleted' });
  } catch (error) {
    console.error('Delete task work hour error:', error);
    res.status(500).json({ error: 'Failed to delete work hour entry' });
  }
});

// Bulk create work hours for a task
router.post('/task/:taskId/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { entries } = req.body;

    // Verify task exists
    const task = await ProjectTask.findByPk(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const workHours = await TaskWorkHour.bulkCreate(
      entries.map((entry: any) => ({
        taskId: parseInt(taskId),
        workerName: entry.workerName,
        workDate: entry.workDate,
        hours: entry.hours,
        description: entry.description,
        createdBy: req.user?.id
      }))
    );

    res.status(201).json({ success: true, data: workHours });
  } catch (error) {
    console.error('Bulk create task work hours error:', error);
    res.status(500).json({ error: 'Failed to create work hour entries' });
  }
});

export default router;
