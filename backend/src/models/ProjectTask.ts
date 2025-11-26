import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectTaskAttributes {
  id: number;
  projectId: number;
  taskName: string;
  assignee?: string;
  startDate?: Date;
  endDate?: Date;
  durationDays?: number;
  estimatedHours: number; // 必填欄位
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectTaskCreationAttributes extends Optional<ProjectTaskAttributes, 'id' | 'progress' | 'status' | 'sortOrder'> {}

class ProjectTask extends Model<ProjectTaskAttributes, ProjectTaskCreationAttributes> implements ProjectTaskAttributes {
  public id!: number;
  public projectId!: number;
  public taskName!: string;
  public assignee?: string;
  public startDate?: Date;
  public endDate?: Date;
  public durationDays?: number;
  public estimatedHours!: number; // 必填欄位
  public progress!: number;
  public status!: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  public notes?: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    taskName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    assignee: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      comment: '預計工時（小時）'
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'delayed'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'project_tasks',
    timestamps: true,
    underscored: true
  }
);

export default ProjectTask;
