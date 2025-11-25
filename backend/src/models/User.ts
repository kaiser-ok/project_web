import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  passwordHash?: string;
  fullName?: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  googleId?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public passwordHash?: string;
  public fullName?: string;
  public role!: 'admin' | 'manager' | 'member' | 'viewer';
  public googleId?: string;
  public avatar?: string;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to check password
  public async comparePassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }

  // Method to hash password
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Remove sensitive data
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'member', 'viewer'),
      allowNull: false,
      defaultValue: 'member'
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true
  }
);

export default User;
