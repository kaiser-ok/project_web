import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Button,
  Space,
  message,
  Spin,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FileTextOutlined,
  ProjectOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import api from '../lib/axios';
import DashboardLayout from '../components/DashboardLayout';
import ProjectPlanTab from '../components/project/ProjectPlanTab';
import ProjectManagementTab from '../components/project/ProjectManagementTab';
import ProjectReportTab from '../components/project/ProjectReportTab';

export interface ProjectData {
  id?: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  projectOverview: string;
  projectType: string;
  valueProposition: string;
  problemToSolve: string;
  experienceProvided: string;
  plannedRevenue: number;
  plannedExpense: number;
  actualRevenue: number;
  actualExpense: number;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDurationMonths: number;
  actualStartDate: string;
  actualEndDate: string;
  status: string;
  progress: number;
  reviewResult: string;
  reviewDate: string;
  reviewer: string;
  reviewNotes: string;
  organizationalImprovement: string;
  knowledgeAccumulation: string;
  notes: string;
  projectFolderPath: string;
  createdAt?: string;
  updatedAt?: string;
}

const initialProjectData: ProjectData = {
  projectCode: '',
  projectName: '',
  clientName: '',
  projectOverview: '',
  projectType: '客戶需求導向',
  valueProposition: '',
  problemToSolve: '',
  experienceProvided: '',
  plannedRevenue: 0,
  plannedExpense: 0,
  actualRevenue: 0,
  actualExpense: 0,
  plannedStartDate: '',
  plannedEndDate: '',
  plannedDurationMonths: 0,
  actualStartDate: '',
  actualEndDate: '',
  status: 'planning',
  progress: 0,
  reviewResult: '',
  reviewDate: '',
  reviewer: '',
  reviewNotes: '',
  organizationalImprovement: '',
  knowledgeAccumulation: '',
  notes: '',
  projectFolderPath: '',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [project, setProject] = useState<ProjectData>(initialProjectData);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('plan');

  useEffect(() => {
    if (!isNew && id) {
      fetchProject();
    }
  }, [id, isNew]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.data || response.data);
    } catch (error) {
      message.error('專案讀取失敗');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project.projectCode || !project.projectName) {
      message.error('專案編號和專案名稱為必填欄位');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const response = await api.post('/projects', project);
        message.success('專案建立成功');
        navigate(`/projects/${response.data.data?.id || response.data.id}`);
      } else {
        await api.put(`/projects/${id}`, project);
        message.success('專案儲存成功');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProjectData, value: any) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

  const tabItems = [
    {
      key: 'plan',
      label: (
        <span>
          <FileTextOutlined />
          專案計劃書
        </span>
      ),
      children: (
        <ProjectPlanTab
          project={project}
          onChange={handleChange}
          isNew={isNew}
        />
      ),
    },
    {
      key: 'management',
      label: (
        <span>
          <ProjectOutlined />
          進度
        </span>
      ),
      children: (
        <ProjectManagementTab
          projectId={project.id}
          plannedStartDate={project.plannedStartDate}
          plannedEndDate={project.plannedEndDate}
        />
      ),
      disabled: isNew,
    },
    {
      key: 'report',
      label: (
        <span>
          <BarChartOutlined />
          專案報告書
        </span>
      ),
      children: (
        <ProjectReportTab
          project={project}
          onChange={handleChange}
        />
      ),
      disabled: isNew,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            { title: '首頁', href: '/dashboard' },
            { title: '專案管理', href: '/projects' },
            { title: isNew ? '新增專案' : project.projectName || project.projectCode },
          ]}
        />

        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/projects')}
              >
                返回
              </Button>
              <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                {isNew ? '新增專案' : `${project.projectCode} - ${project.projectName}`}
              </span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              儲存
            </Button>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ marginTop: -12 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
