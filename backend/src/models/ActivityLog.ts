import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ActivityLogAttributes {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id'> {}

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public userId!: number;
  public action!: string;
  public entityType!: string;
  public entityId?: number;
  public entityName?: string;
  public details?: object;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    entityName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'activity_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity_type'] },
      { fields: ['created_at'] }
    ]
  }
);

export default ActivityLog;
