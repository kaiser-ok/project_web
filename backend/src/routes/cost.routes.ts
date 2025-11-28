import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ProjectCostItem } from '../models';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const router = Router();

router.use(authenticate);

// Get all cost items for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, category } = req.query;

    const where: any = { projectId: parseInt(projectId) };

    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Filter by category
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const costItems = await ProjectCostItem.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: costItems
    });
  } catch (error) {
    console.error('Get cost items error:', error);
    res.status(500).json({ error: 'Failed to get cost items' });
  }
});

// Get cost summary by category for a project
router.get('/project/:projectId/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { month } = req.query;

    const where: any = { projectId: parseInt(projectId) };

    if (month) {
      where.month = month;
    }

    const costItems = await ProjectCostItem.findAll({ where });

    // Calculate summary by category
    const summary = {
      EQUIPMENT: 0,
      CONSUMABLE: 0,
      TRAVEL: 0,
      OTHER: 0,
      total: 0
    };

    costItems.forEach(item => {
      const amount = parseFloat(item.amount.toString());
      summary[item.category] += amount;
      summary.total += amount;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get cost summary error:', error);
    res.status(500).json({ error: 'Failed to get cost summary' });
  }
});

// Create a new cost item
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, date, category, amount, description, vendor, invoiceNo } = req.body;

    // Validation
    if (!projectId || !date || !category || !amount || !description) {
      res.status(400).json({ error: '專案、日期、類別、金額、說明為必填欄位' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: '金額必須大於 0' });
      return;
    }

    // Calculate month from date
    const month = dayjs(date).format('YYYY-MM');

    const costItem = await ProjectCostItem.create({
      projectId,
      date,
      month,
      category,
      amount,
      description,
      vendor,
      invoiceNo,
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: costItem
    });
  } catch (error) {
    console.error('Create cost item error:', error);
    res.status(500).json({ error: 'Failed to create cost item' });
  }
});

// Update a cost item
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, category, amount, description, vendor, invoiceNo } = req.body;

    const costItem = await ProjectCostItem.findByPk(id);

    if (!costItem) {
      res.status(404).json({ error: 'Cost item not found' });
      return;
    }

    // Validation
    if (amount && amount <= 0) {
      res.status(400).json({ error: '金額必須大於 0' });
      return;
    }

    // Calculate month if date is updated
    const updates: any = {
      category,
      amount,
      description,
      vendor,
      invoiceNo,
      updatedBy: req.user?.id
    };

    if (date) {
      updates.date = date;
      updates.month = dayjs(date).format('YYYY-MM');
    }

    await costItem.update(updates);

    res.json({
      success: true,
      data: costItem
    });
  } catch (error) {
    console.error('Update cost item error:', error);
    res.status(500).json({ error: 'Failed to update cost item' });
  }
});

// Delete a cost item
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const costItem = await ProjectCostItem.findByPk(id);

    if (!costItem) {
      res.status(404).json({ error: 'Cost item not found' });
      return;
    }

    await costItem.destroy();

    res.json({
      success: true,
      message: 'Cost item deleted successfully'
    });
  } catch (error) {
    console.error('Delete cost item error:', error);
    res.status(500).json({ error: 'Failed to delete cost item' });
  }
});

export default router;
