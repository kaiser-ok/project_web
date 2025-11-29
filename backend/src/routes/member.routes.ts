import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { ProjectMember, ProjectWorkHour } from '../models';

const router = Router();

router.use(authenticate);

// Get members for a project
router.get('/project/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const members = await ProjectMember.findAll({
      where: { projectId },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    // Calculate total work hours for each member
    const membersWithHours = await Promise.all(
      members.map(async (member) => {
        const workHours = await ProjectWorkHour.findAll({
          where: { memberId: member.id }
        });

        const totalPlannedHours = workHours.reduce(
          (sum, wh) => sum + Number(wh.plannedHours || 0),
          0
        );
        const totalActualHours = workHours.reduce(
          (sum, wh) => sum + Number(wh.actualHours || 0),
          0
        );

        return {
          ...member.toJSON(),
          plannedHours: totalPlannedHours,
          actualHours: totalActualHours
        };
      })
    );

    res.json({ success: true, data: membersWithHours });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Create member
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const member = await ProjectMember.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await ProjectMember.findByPk(id);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    await member.update(req.body);
    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete member
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await ProjectMember.findByPk(id);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    // Also delete associated work hours
    await ProjectWorkHour.destroy({ where: { memberId: id } });
    await member.destroy();
    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
