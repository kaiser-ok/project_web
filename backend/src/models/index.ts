import User from './User';
import Project from './Project';
import ProjectTask from './ProjectTask';
import ProjectMember from './ProjectMember';
import ProjectFinance from './ProjectFinance';
import ProjectWorkHour from './ProjectWorkHour';
import ActivityLog from './ActivityLog';

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

ProjectMember.hasMany(ProjectWorkHour, { foreignKey: 'memberId', as: 'workHours' });
ProjectWorkHour.belongsTo(ProjectMember, { foreignKey: 'memberId', as: 'member' });

export {
  User,
  Project,
  ProjectTask,
  ProjectMember,
  ProjectFinance,
  ProjectWorkHour,
  ActivityLog
};
