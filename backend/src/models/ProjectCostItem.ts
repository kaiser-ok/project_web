import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectCostItemAttributes {
  id: number;
  projectId: number;
  date: Date;
  month: string; // YYYY-MM format
  category: 'EQUIPMENT' | 'CONSUMABLE' | 'TRAVEL' | 'OTHER';
  amount: number;
  description: string;
  vendor?: string;
  invoiceNo?: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCostItemCreationAttributes extends Optional<ProjectCostItemAttributes, 'id'> {}

class ProjectCostItem extends Model<ProjectCostItemAttributes, ProjectCostItemCreationAttributes> implements ProjectCostItemAttributes {
  public id!: number;
  public projectId!: number;
  public date!: Date;
  public month!: string;
  public category!: 'EQUIPMENT' | 'CONSUMABLE' | 'TRAVEL' | 'OTHER';
  public amount!: number;
  public description!: string;
  public vendor?: string;
  public invoiceNo?: string;
  public createdBy?: number;
  public updatedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectCostItem.init(
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
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '成本發生日'
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      comment: '對應月份 YYYY-MM'
    },
    category: {
      type: DataTypes.ENUM('EQUIPMENT', 'CONSUMABLE', 'TRAVEL', 'OTHER'),
      allowNull: false,
      field: 'category'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '金額'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '說明'
    },
    vendor: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '供應商'
    },
    invoiceNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '單據編號'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'project_cost_items',
    timestamps: true,
    underscored: true
  }
);

export default ProjectCostItem;
