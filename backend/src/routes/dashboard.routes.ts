import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { Project, ProjectMember, ProjectTask, User } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.use(authenticate);

// Get dashboard data for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch full user info from database
    const currentUser = await User.findByPk(req.user?.id);
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userAlias = currentUser.alias || currentUser.fullName || currentUser.username;

    // Find projects where the user is a member (by alias/name)
    const memberProjects = await ProjectMember.findAll({
      where: {
        memberName: userAlias
      },
      attributes: ['projectId', 'role', 'plannedHours']
    });

    const projectIds = memberProjects.map(m => m.projectId);

    // Get projects with their tasks
    const projects = await Project.findAll({
      where: {
        id: { [Op.in]: projectIds }
      },
      order: [['updatedAt', 'DESC']]
    });

    // Get all tasks for these projects
    const tasks = await ProjectTask.findAll({
      where: {
        projectId: { [Op.in]: projectIds }
      },
      order: [['endDate', 'ASC']]
    });

    // Get tasks assigned to this user
    const myTasks = await ProjectTask.findAll({
      where: {
        assignee: userAlias
      },
      order: [['endDate', 'ASC']]
    });

    // Calculate statistics
    const totalProjects = projects.length;
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    const totalTasks = myTasks.length;
    const pendingTasks = myTasks.filter(t => t.status === 'not_started' || t.status === 'in_progress').length;
    const delayedTasks = myTasks.filter(t => t.status === 'delayed').length;
    const completedTasks = myTasks.filter(t => t.status === 'completed').length;

    // Format projects with additional info
    const projectsWithInfo = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const memberInfo = memberProjects.find(m => m.projectId === project.id);

      // Calculate overall progress
      const totalProgress = projectTasks.length > 0
        ? Math.round(projectTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / projectTasks.length)
        : 0;

      // Count task statuses
      const taskStats = {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.status === 'completed').length,
        inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
        delayed: projectTasks.filter(t => t.status === 'delayed').length,
      };

      return {
        id: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        clientName: project.clientName,
        status: project.status,
        plannedStartDate: project.plannedStartDate,
        plannedEndDate: project.plannedEndDate,
        myRole: memberInfo?.role,
        myPlannedHours: memberInfo?.plannedHours,
        progress: totalProgress,
        taskStats,
        updatedAt: project.updatedAt
      };
    });

    // Get upcoming deadlines (tasks due in next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingDeadlines = myTasks
      .filter(t => {
        if (!t.endDate || t.status === 'completed') return false;
        const endDate = new Date(t.endDate);
        return endDate >= today && endDate <= nextWeek;
      })
      .map(t => ({
        id: t.id,
        taskName: t.taskName,
        projectId: t.projectId,
        projectName: projects.find(p => p.id === t.projectId)?.projectName,
        endDate: t.endDate,
        progress: t.progress,
        status: t.status
      }));

    // Get overdue tasks
    const overdueTasks = myTasks
      .filter(t => {
        if (!t.endDate || t.status === 'completed') return false;
        const endDate = new Date(t.endDate);
        return endDate < today;
      })
      .map(t => ({
        id: t.id,
        taskName: t.taskName,
        projectId: t.projectId,
        projectName: projects.find(p => p.id === t.projectId)?.projectName,
        endDate: t.endDate,
        progress: t.progress,
        status: t.status
      }));

    res.json({
      success: true,
      data: {
        statistics: {
          totalProjects,
          inProgressProjects,
          completedProjects,
          totalTasks,
          pendingTasks,
          delayedTasks,
          completedTasks
        },
        projects: projectsWithInfo,
        myTasks: myTasks.map(t => ({
          id: t.id,
          taskName: t.taskName,
          projectId: t.projectId,
          projectName: projects.find(p => p.id === t.projectId)?.projectName,
          startDate: t.startDate,
          endDate: t.endDate,
          progress: t.progress,
          status: t.status
        })),
        upcomingDeadlines,
        overdueTasks
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

export default router;
