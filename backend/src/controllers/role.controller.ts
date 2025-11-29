import { Response } from 'express';
import Role from '../models/Role';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity, ActivityActions, EntityTypes } from '../services/activityLog.service';

// Get all roles
export const getRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await Role.findAll({
      order: [['code', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

// Update role (mainly for isActive toggle)
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    const oldValue = role.isActive;
    role.isActive = isActive;
    await role.save();

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.ROLE_UPDATE,
      entityType: EntityTypes.ROLE,
      entityId: role.id,
      entityName: role.name,
      details: {
        action: isActive ? '啟用' : '停用',
        oldValue: { isActive: oldValue },
        newValue: { isActive: isActive }
      },
      req
    });

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

// Batch update roles
export const batchUpdateRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      throw new AppError('Invalid roles data', 400);
    }

    const updatedRoles = [];
    for (const roleData of roles) {
      const role = await Role.findByPk(roleData.id);
      if (role && role.isActive !== roleData.isActive) {
        const oldValue = role.isActive;
        role.isActive = roleData.isActive;
        await role.save();
        updatedRoles.push(role);

        // Log activity
        await logActivity({
          userId: req.user!.id,
          action: ActivityActions.ROLE_UPDATE,
          entityType: EntityTypes.ROLE,
          entityId: role.id,
          entityName: role.name,
          details: {
            action: roleData.isActive ? '啟用' : '停用',
            oldValue: { isActive: oldValue },
            newValue: { isActive: roleData.isActive }
          },
          req
        });
      }
    }

    res.json({
      success: true,
      data: updatedRoles
    });
  } catch (error) {
    console.error('Batch update roles error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to batch update roles' });
    }
  }
};
