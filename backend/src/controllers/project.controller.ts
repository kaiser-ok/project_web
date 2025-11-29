import { Response } from 'express';
import { Op } from 'sequelize';
import Project from '../models/Project';
import ProjectMember from '../models/ProjectMember';
import User from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity, ActivityActions, EntityTypes } from '../services/activityLog.service';

// Project type to code mapping
const PROJECT_TYPE_CODES: Record<string, string> = {
  '客戶需求導向': 'C',
  '公司策略導向': 'S',
  '內部專案': 'I',
};

// Generate project code based on type and current week
const generateProjectCode = async (projectType: string): Promise<string> => {
  const typeCode = PROJECT_TYPE_CODES[projectType] || 'X';

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // YY

  // Calculate week number (ISO week)
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7).toString().padStart(2, '0'); // WW

  const prefix = `${typeCode}${year}${week}`;

  // Find existing projects with the same prefix to determine sequence
  const existingProjects = await Project.findAll({
    where: {
      projectCode: {
        [Op.like]: `${prefix}-%`
      }
    },
    order: [['projectCode', 'DESC']],
    limit: 1,
    paranoid: false // Include soft-deleted records
  });

  let seq = 1;
  if (existingProjects.length > 0) {
    const lastCode = existingProjects[0].projectCode;
    const lastSeq = parseInt(lastCode.split('-')[1] || '0', 10);
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(3, '0')}`;
};

// Get all projects
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, clientName, page = 1, limit = 10 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (clientName) {
      where.clientName = { $iLike: `%${clientName}%` };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: projects, count } = await Project.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

// Get single project
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get project' });
    }
  }
};

// Helper function to sanitize date fields (convert empty strings to null)
const sanitizeDateFields = (data: any): any => {
  const dateFields = ['plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate', 'reviewDate'];
  const sanitized = { ...data };

  for (const field of dateFields) {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  }

  return sanitized;
};

// Create project
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sanitizedData = sanitizeDateFields(req.body);
    const projectData = {
      ...sanitizedData,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    };

    const project = await Project.create(projectData);

    // Automatically add the creator as PM member
    if (req.user?.id) {
      const creator = await User.findByPk(req.user.id);
      if (creator) {
        await ProjectMember.create({
          projectId: project.id,
          role: 'PM',
          memberName: creator.alias || creator.username,
          memberEmail: creator.email,
          hourlyRate: creator.hourlyRate || undefined,
          sortOrder: 0
        });
      }
    }

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.PROJECT_CREATE,
      entityType: EntityTypes.PROJECT,
      entityId: project.id,
      entityName: project.projectName,
      details: { projectCode: project.projectCode },
      req
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.message });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Project code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create project', details: error.message });
    }
  }
};

// Update project
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const sanitizedData = sanitizeDateFields(req.body);
    const updateData = {
      ...sanitizedData,
      updatedBy: req.user?.id
    };

    await project.update(updateData);

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.PROJECT_UPDATE,
      entityType: EntityTypes.PROJECT,
      entityId: project.id,
      entityName: project.projectName,
      details: { projectCode: project.projectCode },
      req
    });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
};

// Delete project (soft delete)
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const projectName = project.projectName;
    const projectCode = project.projectCode;

    await project.destroy();

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.PROJECT_DELETE,
      entityType: EntityTypes.PROJECT,
      entityId: parseInt(id),
      entityName: projectName,
      details: { projectCode },
      req
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
};

// Generate next project code
export const getNextProjectCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectType } = req.query;

    if (!projectType || typeof projectType !== 'string') {
      res.status(400).json({ error: 'projectType is required' });
      return;
    }

    const projectCode = await generateProjectCode(projectType);

    res.json({
      success: true,
      data: { projectCode }
    });
  } catch (error) {
    console.error('Generate project code error:', error);
    res.status(500).json({ error: 'Failed to generate project code' });
  }
};
