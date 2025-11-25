import { ActivityLog } from '../models';
import { Request } from 'express';

interface LogActivityParams {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  details?: object;
  req?: Request;
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  details,
  req
}: LogActivityParams): Promise<void> {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress: req?.ip || req?.headers['x-forwarded-for']?.toString() || undefined,
      userAgent: req?.headers['user-agent']
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export const ActivityActions = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Project
  PROJECT_CREATE: 'project_create',
  PROJECT_UPDATE: 'project_update',
  PROJECT_DELETE: 'project_delete',
  PROJECT_VIEW: 'project_view',

  // Task
  TASK_CREATE: 'task_create',
  TASK_UPDATE: 'task_update',
  TASK_DELETE: 'task_delete',

  // Member
  MEMBER_CREATE: 'member_create',
  MEMBER_UPDATE: 'member_update',
  MEMBER_DELETE: 'member_delete',

  // Finance
  FINANCE_UPDATE: 'finance_update',

  // Work Hour
  WORKHOUR_UPDATE: 'workhour_update',

  // User Management
  USER_UPDATE: 'user_update',
  USER_ROLE_CHANGE: 'user_role_change'
};

export const EntityTypes = {
  USER: 'user',
  PROJECT: 'project',
  TASK: 'task',
  MEMBER: 'member',
  FINANCE: 'finance',
  WORKHOUR: 'workhour'
};
