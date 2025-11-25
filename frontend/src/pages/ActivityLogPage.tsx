import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Space,
  Tag,
  Avatar,
  Typography,
  message,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../lib/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName?: string;
    alias?: string;
    email: string;
    avatar?: string;
  };
}

interface User {
  id: number;
  username: string;
  fullName?: string;
  alias?: string;
}

const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  login: { label: '登入', color: 'green', icon: <LoginOutlined /> },
  logout: { label: '登出', color: 'default', icon: <LogoutOutlined /> },
  project_create: { label: '建立專案', color: 'blue', icon: <FileAddOutlined /> },
  project_update: { label: '更新專案', color: 'orange', icon: <EditOutlined /> },
  project_delete: { label: '刪除專案', color: 'red', icon: <DeleteOutlined /> },
  project_view: { label: '檢視專案', color: 'cyan', icon: <EyeOutlined /> },
  task_create: { label: '建立任務', color: 'blue', icon: <FileAddOutlined /> },
  task_update: { label: '更新任務', color: 'orange', icon: <EditOutlined /> },
  task_delete: { label: '刪除任務', color: 'red', icon: <DeleteOutlined /> },
  member_create: { label: '新增成員', color: 'blue', icon: <FileAddOutlined /> },
  member_update: { label: '更新成員', color: 'orange', icon: <EditOutlined /> },
  member_delete: { label: '刪除成員', color: 'red', icon: <DeleteOutlined /> },
  finance_update: { label: '更新財務', color: 'orange', icon: <EditOutlined /> },
  workhour_update: { label: '更新工時', color: 'orange', icon: <EditOutlined /> },
  user_update: { label: '更新使用者', color: 'orange', icon: <EditOutlined /> },
  user_role_change: { label: '變更角色', color: 'purple', icon: <UserOutlined /> },
};

const entityTypeLabels: Record<string, string> = {
  user: '使用者',
  project: '專案',
  task: '任務',
  member: '成員',
  finance: '財務',
  workhour: '工時',
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });
  const [filters, setFilters] = useState<{
    userId?: number;
    action?: string;
    entityType?: string;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  }>({});

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pagination.pageSize };

      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].startOf('day').toISOString();
        params.endDate = filters.dateRange[1].endOf('day').toISOString();
      }

      const response = await api.get('/activity-logs', { params });
      const data = response.data?.data;
      setLogs(data?.logs || []);
      setPagination({
        ...pagination,
        current: data?.pagination?.page || 1,
        total: data?.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      message.error('載入操作紀錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [filters]);

  const handleTableChange = (paginationConfig: any) => {
    fetchLogs(paginationConfig.current);
  };

  const columns: ColumnsType<ActivityLog> = [
    {
      title: '時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'),
    },
    {
      title: '使用者',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar src={record.user.avatar} icon={<UserOutlined />} size="small" />
          <Text>{record.user.alias || record.user.fullName || record.user.username}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const actionInfo = actionLabels[action] || { label: action, color: 'default', icon: null };
        return (
          <Tag color={actionInfo.color} icon={actionInfo.icon}>
            {actionInfo.label}
          </Tag>
        );
      },
    },
    {
      title: '類型',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 100,
      render: (entityType: string) => entityTypeLabels[entityType] || entityType,
    },
    {
      title: '目標',
      key: 'entity',
      width: 200,
      render: (_, record) => {
        if (record.entityName) {
          return <Text>{record.entityName}</Text>;
        }
        if (record.entityId) {
          return <Text type="secondary">ID: {record.entityId}</Text>;
        }
        return '-';
      },
    },
    {
      title: '詳細資訊',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details) => {
        if (!details) return '-';
        try {
          const detailStr = Object.entries(details)
            .filter(([key]) => key !== 'changes')
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', ');
          return <Text type="secondary" ellipsis={{ tooltip: true }}>{detailStr || '-'}</Text>;
        } catch {
          return '-';
        }
      },
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (value) => <Text type="secondary">{value || '-'}</Text>,
    },
  ];

  const actionOptions = Object.entries(actionLabels).map(([value, { label }]) => ({
    value,
    label,
  }));

  const entityTypeOptions = Object.entries(entityTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={4} style={{ marginBottom: 16 }}>操作紀錄</Title>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <Select
                placeholder="全部使用者"
                style={{ width: 180 }}
                allowClear
                value={filters.userId}
                onChange={(value) => setFilters({ ...filters, userId: value })}
              >
                <Select.Option value={undefined}>全部使用者</Select.Option>
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.alias || user.fullName || user.username}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="全部操作"
                style={{ width: 150 }}
                allowClear
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
              >
                <Select.Option value={undefined}>全部操作</Select.Option>
                {actionOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="全部類型"
                style={{ width: 130 }}
                allowClear
                value={filters.entityType}
                onChange={(value) => setFilters({ ...filters, entityType: value })}
              >
                <Select.Option value={undefined}>全部類型</Select.Option>
                {entityTypeOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] })}
                placeholder={['開始日期', '結束日期']}
              />
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: (total) => `共 ${total} 筆紀錄`,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="small"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
