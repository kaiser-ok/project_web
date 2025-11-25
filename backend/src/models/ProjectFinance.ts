import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectFinanceAttributes {
  id: number;
  projectId: number;
  yearMonth: string; // YYYY-MM format
  plannedRevenue: number;
  actualRevenue: number;
  plannedExpense: number;
  actualExpense: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectFinanceCreationAttributes extends Optional<ProjectFinanceAttributes, 'id' | 'plannedRevenue' | 'actualRevenue' | 'plannedExpense' | 'actualExpense'> {}

class ProjectFinance extends Model<ProjectFinanceAttributes, ProjectFinanceCreationAttributes> implements ProjectFinanceAttributes {
  public id!: number;
  public projectId!: number;
  public yearMonth!: string;
  public plannedRevenue!: number;
  public actualRevenue!: number;
  public plannedExpense!: number;
  public actualExpense!: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectFinance.init(
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
    yearMonth: {
      type: DataTypes.STRING(7), // YYYY-MM
      allowNull: false
    },
    plannedRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    actualRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    plannedExpense: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    actualExpense: {
      type: DataTypes.DECIMAL(15, 2),
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
    tableName: 'project_finances',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'year_month']
      }
    ]
  }
);

export default ProjectFinance;
