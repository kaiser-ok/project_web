import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectReport, Project } from '../models';
import { AppError } from '../middleware/error.middleware';
import { logActivity, ActivityActions, EntityTypes } from '../services/activityLog.service';

// Get all reports for a project
export const getProjectReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const reports = await ProjectReport.findAll({
      where: { projectId },
      order: [['reportDate', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get project reports error:', error);
    res.status(500).json({ error: 'Failed to get project reports' });
  }
};

// Get single report
export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await ProjectReport.findByPk(id, {
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'projectCode', 'projectName', 'clientName']
      }]
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get report' });
    }
  }
};

// Create report
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reportData = {
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id
    };

    const report = await ProjectReport.create(reportData);

    // Get project info for logging
    const project = await Project.findByPk(report.projectId, {
      attributes: ['projectName', 'projectCode']
    });

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.REPORT_CREATE,
      entityType: EntityTypes.PROJECT_REPORT,
      entityId: report.id,
      entityName: `${project?.projectName || 'Unknown'} - ${report.reportType}`,
      details: {
        projectId: report.projectId,
        projectCode: project?.projectCode,
        reportType: report.reportType,
        reportDate: report.reportDate
      },
      req
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Create report error:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
};

// Update report
export const updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await ProjectReport.findByPk(id);

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    await report.update(updateData);

    // Get project info for logging
    const project = await Project.findByPk(report.projectId, {
      attributes: ['projectName', 'projectCode']
    });

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.REPORT_UPDATE,
      entityType: EntityTypes.PROJECT_REPORT,
      entityId: report.id,
      entityName: `${project?.projectName || 'Unknown'} - ${report.reportType}`,
      details: {
        projectId: report.projectId,
        projectCode: project?.projectCode,
        reportType: report.reportType
      },
      req
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update report' });
    }
  }
};

// Delete report
export const deleteReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await ProjectReport.findByPk(id);

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Get project info for logging
    const project = await Project.findByPk(report.projectId, {
      attributes: ['projectName', 'projectCode']
    });

    const reportType = report.reportType;
    const projectName = project?.projectName || 'Unknown';

    await report.destroy();

    // Log activity
    await logActivity({
      userId: req.user!.id,
      action: ActivityActions.REPORT_DELETE,
      entityType: EntityTypes.PROJECT_REPORT,
      entityId: parseInt(id),
      entityName: `${projectName} - ${reportType}`,
      details: {
        projectId: report.projectId,
        projectCode: project?.projectCode,
        reportType
      },
      req
    });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
};

// Get report summary for a project (latest reports)
export const getProjectReportSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const [planningReport, interimReport, finalReport] = await Promise.all([
      ProjectReport.findOne({
        where: { projectId, reportType: 'planning' },
        order: [['reportDate', 'DESC']]
      }),
      ProjectReport.findOne({
        where: { projectId, reportType: 'interim' },
        order: [['reportDate', 'DESC']]
      }),
      ProjectReport.findOne({
        where: { projectId, reportType: 'final' },
        order: [['reportDate', 'DESC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        planning: planningReport,
        interim: interimReport,
        final: finalReport
      }
    });
  } catch (error) {
    console.error('Get project report summary error:', error);
    res.status(500).json({ error: 'Failed to get project report summary' });
  }
};
