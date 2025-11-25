import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectAttributes {
  id: number;
  projectCode: string;
  projectName: string;
  clientName?: string;
  projectOverview?: string;
  projectType?: string;
  valueProposition?: string;
  problemToSolve?: string;
  experienceProvided?: string;
  plannedRevenue?: number;
  plannedExpense?: number;
  actualRevenue?: number;
  actualExpense?: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  plannedDurationMonths?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  progress: number;
  reviewResult?: string;
  reviewDate?: Date;
  reviewer?: string;
  reviewNotes?: string;
  organizationalImprovement?: string;
  knowledgeAccumulation?: string;
  attachments?: any;
  notes?: string;
  projectFolderPath?: string;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'status' | 'progress'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public projectCode!: string;
  public projectName!: string;
  public clientName?: string;
  public projectOverview?: string;
  public projectType?: string;
  public valueProposition?: string;
  public problemToSolve?: string;
  public experienceProvided?: string;
  public plannedRevenue?: number;
  public plannedExpense?: number;
  public actualRevenue?: number;
  public actualExpense?: number;
  public plannedStartDate?: Date;
  public plannedEndDate?: Date;
  public plannedDurationMonths?: number;
  public actualStartDate?: Date;
  public actualEndDate?: Date;
  public status!: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  public progress!: number;
  public reviewResult?: string;
  public reviewDate?: Date;
  public reviewer?: string;
  public reviewNotes?: string;
  public organizationalImprovement?: string;
  public knowledgeAccumulation?: string;
  public attachments?: any;
  public notes?: string;
  public projectFolderPath?: string;
  public createdBy?: number;
  public updatedBy?: number;
  public deletedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    projectCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    projectName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    projectOverview: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    projectType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    valueProposition: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    problemToSolve: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    experienceProvided: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    plannedRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    plannedExpense: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    actualRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    actualExpense: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    plannedStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    plannedEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    plannedDurationMonths: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actualStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    actualEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled'),
      allowNull: false,
      defaultValue: 'planning'
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
    reviewResult: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    reviewer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    organizationalImprovement: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    knowledgeAccumulation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    projectFolderPath: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    paranoid: true
  }
);

export default Project;
