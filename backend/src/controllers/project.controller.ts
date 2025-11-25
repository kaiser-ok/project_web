import { Response } from 'express';
import Project from '../models/Project';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

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

// Create project
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    };

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.message });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Project code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create project' });
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

    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    await project.update(updateData);

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

    await project.destroy();

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
