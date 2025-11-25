import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import api from '../lib/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title } = Typography;

interface Project {
  id: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  status: string;
  progress: number;
  plannedRevenue: number;
  plannedExpense: number;
  plannedStartDate: string;
  plannedEndDate: string;
  createdAt: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  planning: { color: 'blue', text: '計劃中' },
  in_progress: { color: 'processing', text: '進行中' },
  completed: { color: 'success', text: '已完成' },
  on_hold: { color: 'warning', text: '暫停' },
  cancelled: { color: 'error', text: '已取消' },
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects');
      // Backend returns { success: true, data: { projects: [...], pagination: {...} } }
      const projectsData = response.data?.data?.projects || response.data?.data || response.data || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('專案載入失敗');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      message.success('專案已刪除');
      fetchProjects();
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: '專案編號',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 140,
      fixed: 'left',
    },
    {
      title: '專案名稱',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '客戶',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '進度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '計劃收入',
      dataIndex: 'plannedRevenue',
      key: 'plannedRevenue',
      width: 120,
      align: 'right',
      render: (value: number) => value?.toLocaleString() || '-',
    },
    {
      title: '開始日期',
      dataIndex: 'plannedStartDate',
      key: 'plannedStartDate',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('zh-TW') : '-',
    },
    {
      title: '結束日期',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('zh-TW') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/projects/${record.id}/edit`)}
          />
          <Popconfirm
            title="確定要刪除這個專案嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="刪除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchSearch =
      !searchText ||
      project.projectCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      project.projectName?.toLowerCase().includes(searchText.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || project.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>專案列表</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/projects/new')}
            >
              新增專案
            </Button>
          </div>

          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="搜尋..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="狀態篩選"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="planning">計劃中</Select.Option>
              <Select.Option value="in_progress">進行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="on_hold">暫停</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1300 }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 筆`,
            }}
            onRow={(record) => ({
              onDoubleClick: () => navigate(`/projects/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
