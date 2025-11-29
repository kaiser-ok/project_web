import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ProjectWorkHour, ProjectMember } from '../models';
import { logActivity, ActivityActions, EntityTypes } from '../services/activityLog.service';

const router = Router();

router.use(authenticate);

// Get work hours for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const workHours = await ProjectWorkHour.findAll({
      where: { projectId },
      include: [{ model: ProjectMember, as: 'member' }],
      order: [['memberId', 'ASC'], ['yearMonth', 'ASC']]
    });
    res.json({ success: true, data: workHours });
  } catch (error) {
    console.error('Get work hours error:', error);
    res.status(500).json({ error: 'Failed to get work hours' });
  }
});

// Get work hours for a specific member
router.get('/member/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const workHours = await ProjectWorkHour.findAll({
      where: { memberId },
      order: [['yearMonth', 'ASC']]
    });
    res.json({ success: true, data: workHours });
  } catch (error) {
    console.error('Get member work hours error:', error);
    res.status(500).json({ error: 'Failed to get work hours' });
  }
});

// Create or update work hour record (upsert)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, memberId, yearMonth, ...data } = req.body;
    const [workHour, created] = await ProjectWorkHour.upsert({
      projectId,
      memberId,
      yearMonth,
      ...data
    });
    res.status(created ? 201 : 200).json({ success: true, data: workHour });
  } catch (error) {
    console.error('Create/update work hour error:', error);
    res.status(500).json({ error: 'Failed to create/update work hour' });
  }
});

// Bulk update work hours
router.put('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { workHours } = req.body;

    // Track affected members and projects for logging
    const affectedMembers = new Set<number>();
    const affectedProjects = new Set<number>();
    let totalPlannedHours = 0;
    let totalActualHours = 0;

    // Update work hours and collect statistics
    for (const wh of workHours) {
      await ProjectWorkHour.upsert(wh);

      if (wh.memberId) affectedMembers.add(wh.memberId);
      if (wh.projectId) affectedProjects.add(wh.projectId);

      totalPlannedHours += Number(wh.plannedHours || 0);
      totalActualHours += Number(wh.actualHours || 0);
    }

    // Calculate total planned hours for each affected member
    const memberSummaries: Record<number, { memberName: string; totalPlanned: number; totalActual: number }> = {};

    for (const memberId of affectedMembers) {
      const member = await ProjectMember.findByPk(memberId);
      if (!member) continue;

      // Get all work hours for this member across all months
      const allWorkHours = await ProjectWorkHour.findAll({
        where: { memberId }
      });

      const totalPlanned = allWorkHours.reduce((sum, wh) => sum + Number(wh.plannedHours || 0), 0);
      const totalActual = allWorkHours.reduce((sum, wh) => sum + Number(wh.actualHours || 0), 0);

      memberSummaries[memberId] = {
        memberName: member.memberName,
        totalPlanned,
        totalActual
      };
    }

    // Log activity for each affected project
    for (const projectId of affectedProjects) {
      await logActivity({
        userId: req.user!.id,
        action: ActivityActions.WORKHOUR_UPDATE,
        entityType: EntityTypes.WORKHOUR,
        entityId: projectId,
        entityName: `專案 #${projectId} 工時更新`,
        details: {
          projectId,
          affectedMembers: Array.from(affectedMembers),
          memberSummaries,
          updatedRecords: workHours.length,
          totalPlannedHours,
          totalActualHours
        },
        req
      });
    }

    res.json({
      success: true,
      message: 'Work hours updated',
      data: {
        updatedCount: workHours.length,
        memberSummaries
      }
    });
  } catch (error) {
    console.error('Bulk update work hours error:', error);
    res.status(500).json({ error: 'Failed to update work hours' });
  }
});

// Delete work hour record
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const workHour = await ProjectWorkHour.findByPk(id);
    if (!workHour) {
      res.status(404).json({ error: 'Work hour record not found' });
      return;
    }
    await workHour.destroy();
    res.json({ success: true, message: 'Work hour record deleted' });
  } catch (error) {
    console.error('Delete work hour error:', error);
    res.status(500).json({ error: 'Failed to delete work hour' });
  }
});

export default router;
