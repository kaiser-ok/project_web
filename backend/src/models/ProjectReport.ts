import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectReportAttributes {
  id: number;
  projectId: number;
  reportType: 'planning' | 'interim' | 'final';
  reportDate: Date;

  // Goal（目標）
  goalValueCreated?: string;                    // 創造的價值
  goalCustomerSatisfaction?: string;            // 顧客滿足
  goalProblemSolved?: string;                   // 解決的問題
  goalMetrics?: any;                            // 目標達成指標 (JSON)

  // Approach（方法）
  approachSolution?: string;                    // 解決方案
  approachMethod?: string;                      // 執行方法
  approachProblemsEncountered?: string;         // 遇到的問題
  approachImprovementMeasures?: string;         // 改善措施
  approachLessonsLearned?: string;              // 經驗教訓
  approachBestPractices?: string;               // 最佳實踐

  // Resource（資源）
  resourceTeamStructure?: any;                  // 團隊結構 (JSON)
  resourceScheduleAssessment?: string;          // 時程評估
  resourceCostAssessment?: string;              // 成本評估
  resourceUtilization?: any;                    // 資源利用率 (JSON)
  resourceConstraints?: string;                 // 資源限制

  // Feedback & Assessment（反饋與評估）
  customerFeedback?: string;                    // 客戶反饋
  customerSatisfactionScore?: number;           // 客戶滿意度評分 (1-5)
  teamFeedback?: string;                        // 團隊反饋
  organizationalImprovement?: string;           // 組織改善

  // Attachments
  attachments?: any;                            // 附件 (JSON)

  createdBy?: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectReportCreationAttributes extends Optional<ProjectReportAttributes, 'id'> {}

class ProjectReport extends Model<ProjectReportAttributes, ProjectReportCreationAttributes> implements ProjectReportAttributes {
  public id!: number;
  public projectId!: number;
  public reportType!: 'planning' | 'interim' | 'final';
  public reportDate!: Date;

  // Goal
  public goalValueCreated?: string;
  public goalCustomerSatisfaction?: string;
  public goalProblemSolved?: string;
  public goalMetrics?: any;

  // Approach
  public approachSolution?: string;
  public approachMethod?: string;
  public approachProblemsEncountered?: string;
  public approachImprovementMeasures?: string;
  public approachLessonsLearned?: string;
  public approachBestPractices?: string;

  // Resource
  public resourceTeamStructure?: any;
  public resourceScheduleAssessment?: string;
  public resourceCostAssessment?: string;
  public resourceUtilization?: any;
  public resourceConstraints?: string;

  // Feedback
  public customerFeedback?: string;
  public customerSatisfactionScore?: number;
  public teamFeedback?: string;
  public organizationalImprovement?: string;

  public attachments?: any;

  public createdBy?: number;
  public updatedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectReport.init(
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
    reportType: {
      type: DataTypes.ENUM('planning', 'interim', 'final'),
      allowNull: false
    },
    reportDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    // Goal（目標）
    goalValueCreated: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'プロジェクトを通じて創出する価値・顧客満足'
    },
    goalCustomerSatisfaction: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '顧客満足の内容'
    },
    goalProblemSolved: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'プロジェクトで行う問題解決'
    },
    goalMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '目標達成指標'
    },

    // Approach（方法）
    approachSolution: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '解決方案'
    },
    approachMethod: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'どのような経験・体験を通じて顧客満足を与えるか'
    },
    approachProblemsEncountered: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'プロジェクト推進で生じた問題'
    },
    approachImprovementMeasures: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '問題に対する改善策'
    },
    approachLessonsLearned: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'プロジェクトの反省・学び'
    },
    approachBestPractices: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '最佳實踐'
    },

    // Resource（資源）
    resourceTeamStructure: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'どのように人材・時間を投入するか'
    },
    resourceScheduleAssessment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '納期は最適だったか'
    },
    resourceCostAssessment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '価値に応じた収益が得られたか、コストは最適だったか'
    },
    resourceUtilization: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '資源利用率'
    },
    resourceConstraints: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '資源限制'
    },

    // Feedback & Assessment
    customerFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'お客様からの評価'
    },
    customerSatisfactionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: '客戶滿意度評分 (1-5)'
    },
    teamFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '團隊反饋'
    },
    organizationalImprovement: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'プロジェクトを通じて組織・個人の能力はどのように向上するか'
    },

    attachments: {
      type: DataTypes.JSONB,
      allowNull: true
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
    tableName: 'project_reports',
    timestamps: true,
    underscored: true
  }
);

export default ProjectReport;
