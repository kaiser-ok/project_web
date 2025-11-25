import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.middleware';
import { User } from '../models';
import { logActivity, ActivityActions, EntityTypes } from '../services/activityLog.service';

const router = Router();

router.use(authenticate);

// Get users list for selection (all authenticated users)
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'alias'],
      where: { isActive: true },
      order: [['alias', 'ASC'], ['fullName', 'ASC'], ['username', 'ASC']]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Failed to get users list' });
  }
});

// Get all users (admin only)
router.get('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'alias', 'role', 'avatar', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Invite/create new user (admin only)
router.post('/invite', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, alias, role } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: '此 Email 已存在' });
      return;
    }

    // Create user with email
    const username = email.split('@')[0];
    const user = await User.create({
      username,
      email,
      fullName: fullName || undefined,
      alias: alias || undefined,
      role: role || 'member',
      isActive: true
    });

    // Log the activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.MEMBER_CREATE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      entityName: user.email,
      details: { role: user.role, invitedBy: req.user!.email },
      req
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Get single user
router.get('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'fullName', 'alias', 'role', 'avatar', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user (admin only)
router.put('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { alias, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const oldRole = user.role;
    const updateData: any = {};

    if (alias !== undefined) {
      updateData.alias = alias;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    await user.update(updateData);

    // Log the activity
    const details: any = { changes: updateData };
    if (role !== undefined && role !== oldRole) {
      details.oldRole = oldRole;
      details.newRole = role;
    }

    await logActivity({
      userId: req.user!.id,
      action: role !== undefined && role !== oldRole ? ActivityActions.USER_ROLE_CHANGE : ActivityActions.USER_UPDATE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      entityName: user.username,
      details,
      req
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get current user profile
router.get('/profile/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'email', 'fullName', 'alias', 'role', 'avatar', 'lastLoginAt', 'createdAt']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
