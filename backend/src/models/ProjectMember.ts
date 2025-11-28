import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectMemberAttributes {
  id: number;
  projectId: number;
  role: string; // PPM, PMO, PD, PM, CREW, etc.
  memberName: string; // 別名
  memberEmail?: string; // 自動產生的 Email
  memberClass?: string; // Level/Class
  hourlyRate?: number;
  plannedHours?: number; // 預計投入工數
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectMemberCreationAttributes extends Optional<ProjectMemberAttributes, 'id' | 'sortOrder'> {}

class ProjectMember extends Model<ProjectMemberAttributes, ProjectMemberCreationAttributes> implements ProjectMemberAttributes {
  public id!: number;
  public projectId!: number;
  public role!: string;
  public memberName!: string;
  public memberEmail?: string;
  public memberClass?: string;
  public hourlyRate?: number;
  public plannedHours?: number;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectMember.init(
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
    role: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    memberName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    memberEmail: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    memberClass: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    plannedHours: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: 'project_members',
    timestamps: true,
    underscored: true
  }
);

export default ProjectMember;
