import User from './User';
import Project from './Project';
import ProjectTask from './ProjectTask';
import ProjectMember from './ProjectMember';
import ProjectFinance from './ProjectFinance';
import ProjectWorkHour from './ProjectWorkHour';
import TaskWorkHour from './TaskWorkHour';
import ActivityLog from './ActivityLog';
import ProjectReport from './ProjectReport';
import ProjectCostItem from './ProjectCostItem';
import Role from './Role';

// Define associations
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(ProjectTask, { foreignKey: 'projectId', as: 'tasks' });
ProjectTask.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectFinance, { foreignKey: 'projectId', as: 'finances' });
ProjectFinance.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectWorkHour, { foreignKey: 'projectId', as: 'workHours' });
ProjectWorkHour.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectReport, { foreignKey: 'projectId', as: 'reports' });
ProjectReport.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectCostItem, { foreignKey: 'projectId', as: 'costItems' });
ProjectCostItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

ProjectMember.hasMany(ProjectWorkHour, { foreignKey: 'memberId', as: 'workHours' });
ProjectWorkHour.belongsTo(ProjectMember, { foreignKey: 'memberId', as: 'member' });

ProjectTask.hasMany(TaskWorkHour, { foreignKey: 'taskId', as: 'workHours', onDelete: 'CASCADE' });
TaskWorkHour.belongsTo(ProjectTask, { foreignKey: 'taskId', as: 'task' });

export {
  User,
  Project,
  ProjectTask,
  ProjectMember,
  ProjectFinance,
  ProjectWorkHour,
  TaskWorkHour,
  ActivityLog,
  ProjectReport,
  ProjectCostItem,
  Role
};
