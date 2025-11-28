import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware';
import { ActivityLog, User } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.use(authenticate);

// Get activity logs (admin only)
router.get('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate as string);
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'alias', 'email', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
});

// Get distinct action types
router.get('/actions', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const actions = await ActivityLog.findAll({
      attributes: ['action'],
      group: ['action'],
      order: [['action', 'ASC']]
    });

    res.json({
      success: true,
      data: actions.map(a => a.action)
    });
  } catch (error) {
    console.error('Get action types error:', error);
    res.status(500).json({ error: 'Failed to get action types' });
  }
});

// Get distinct entity types
router.get('/entity-types', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const entityTypes = await ActivityLog.findAll({
      attributes: ['entityType'],
      group: ['entityType'],
      order: [['entityType', 'ASC']]
    });

    res.json({
      success: true,
      data: entityTypes.map(e => e.entityType)
    });
  } catch (error) {
    console.error('Get entity types error:', error);
    res.status(500).json({ error: 'Failed to get entity types' });
  }
});

export default router;
