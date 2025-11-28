import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TaskWorkHourAttributes {
  id: number;
  taskId: number;
  workerName: string; // 執行者別名
  workDate: string; // YYYY-MM-DD
  hours: number;
  description?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskWorkHourCreationAttributes extends Optional<TaskWorkHourAttributes, 'id' | 'description' | 'createdBy'> {}

class TaskWorkHour extends Model<TaskWorkHourAttributes, TaskWorkHourCreationAttributes> implements TaskWorkHourAttributes {
  public id!: number;
  public taskId!: number;
  public workerName!: string;
  public workDate!: string;
  public hours!: number;
  public description?: string;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TaskWorkHour.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_tasks',
        key: 'id'
      }
    },
    workerName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    workDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'task_work_hours',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['task_id', 'work_date']
      },
      {
        fields: ['worker_name']
      }
    ]
  }
);

export default TaskWorkHour;
