import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectWorkHourAttributes {
  id: number;
  projectId: number;
  memberId: number;
  yearMonth: string; // YYYY-MM format
  plannedHours: number;
  actualHours: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectWorkHourCreationAttributes extends Optional<ProjectWorkHourAttributes, 'id' | 'plannedHours' | 'actualHours'> {}

class ProjectWorkHour extends Model<ProjectWorkHourAttributes, ProjectWorkHourCreationAttributes> implements ProjectWorkHourAttributes {
  public id!: number;
  public projectId!: number;
  public memberId!: number;
  public yearMonth!: string;
  public plannedHours!: number;
  public actualHours!: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectWorkHour.init(
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
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_members',
        key: 'id'
      }
    },
    yearMonth: {
      type: DataTypes.STRING(7), // YYYY-MM
      allowNull: false
    },
    plannedHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    actualHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'project_work_hours',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'member_id', 'year_month']
      }
    ]
  }
);

export default ProjectWorkHour;
