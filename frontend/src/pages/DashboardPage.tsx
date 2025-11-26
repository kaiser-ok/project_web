import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Progress,
  Space,
  Badge,
  Empty,
  Spin,
  Alert,
  message,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Input,
  Button,
  Tooltip,
  Popconfirm,
  Select,
} from 'antd';
import {
  ProjectOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import DashboardLayout from '../components/DashboardLayout';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;
const { Content } = Layout;

interface ProjectInfo {
  id: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  status: string;
  plannedStartDate: string;
  plannedEndDate: string;
  myRole: string;
  myPlannedHours: number;
  progress: number;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    delayed: number;
  };
  updatedAt: string;
}

interface TaskInfo {
  id: number;
  taskName: string;
  projectId: number;
  projectName: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
}

interface TaskWorkHour {
  id?: number;
  taskId: number;
  workerName: string;
  workDate: string;
  hours: number;
  description?: string;
}

interface ProjectMember {
  id: number;
  memberName: string;
  role: string;
}

interface DashboardData {
  statistics: {
    totalProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    totalTasks: number;
    pendingTasks: number;
    delayedTasks: number;
    completedTasks: number;
  };
  projects: ProjectInfo[];
  myTasks: TaskInfo[];
  upcomingDeadlines: TaskInfo[];
  overdueTasks: TaskInfo[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  planning: { label: '規劃中', color: 'processing' },
  in_progress: { label: '進行中', color: 'blue' },
  on_hold: { label: '暫停', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: '未開始', color: 'default' },
  in_progress: { label: '進行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  delayed: { label: '延遲', color: 'error' },
};

const roleColors: Record<string, string> = {
  PPM: 'red',
  PMO: 'orange',
  PD: 'green',
  PM: 'blue',
  CREW: 'purple',
};

// PM roles that can select other workers
const pmRoles = ['PPM', 'PMO', 'PD', 'PM'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [workHourModalVisible, setWorkHourModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInfo | null>(null);
  const [taskWorkHours, setTaskWorkHours] = useState<TaskWorkHour[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isPM, setIsPM] = useState(false);
  const [workHourForm] = Form.useForm();

  // Get user's display name
  const getUserDisplayName = () => {
    return user?.alias || user?.fullName || user?.username || '';
  };

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      message.error('載入儀表板資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Fetch work hours for a specific task
  const fetchTaskWorkHours = async (taskId: number) => {
    try {
      const response = await api.get(`/task-work-hours/task/${taskId}`);
      setTaskWorkHours(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch task work hours:', error);
    }
  };

  // Fetch project members
  const fetchProjectMembers = async (projectId: number) => {
    try {
      const response = await api.get(`/members/project/${projectId}`);
      setProjectMembers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch project members:', error);
      setProjectMembers([]);
    }
  };

  // Open work hour modal for a task
  const openWorkHourModal = async (task: TaskInfo) => {
    setSelectedTask(task);
    await fetchTaskWorkHours(task.id);

    // Find the project and check if user has PM role
    const project = data?.projects?.find(p => p.id === task.projectId);
    const userRole = project?.myRole || '';
    const hasPMRole = pmRoles.includes(userRole.toUpperCase());
    setIsPM(hasPMRole);

    // If PM, fetch project members for selection
    if (hasPMRole) {
      await fetchProjectMembers(task.projectId);
    }

    workHourForm.resetFields();
    workHourForm.setFieldsValue({
      workerName: getUserDisplayName(),
      workDate: dayjs(),
    });
    setWorkHourModalVisible(true);
  };

  // Add work hour entry
  const handleAddWorkHour = async () => {
    if (!selectedTask?.id) return;
    try {
      const values = await workHourForm.validateFields();
      await api.post(`/task-work-hours/task/${selectedTask.id}`, {
        ...values,
        workDate: values.workDate.format('YYYY-MM-DD'),
      });
      message.success('工時已記錄');
      await fetchTaskWorkHours(selectedTask.id);
      workHourForm.resetFields();
      workHourForm.setFieldsValue({
        workDate: dayjs(),
      });
    } catch (error) {
      console.error('Failed to add work hour:', error);
      message.error('記錄工時失敗');
    }
  };

  // Delete work hour entry
  const handleDeleteWorkHour = async (id: number) => {
    try {
      await api.delete(`/task-work-hours/${id}`);
      message.success('工時已刪除');
      if (selectedTask?.id) {
        await fetchTaskWorkHours(selectedTask.id);
      }
    } catch (error) {
      console.error('Failed to delete work hour:', error);
      message.error('刪除工時失敗');
    }
  };

  const projectColumns: ColumnsType<ProjectInfo> = [
    {
      title: '專案編號',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 120,
      render: (code: string, record) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{code}</a>
      ),
    },
    {
      title: '專案名稱',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
    },
    {
      title: '客戶',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '我的角色',
      dataIndex: 'myRole',
      key: 'myRole',
      width: 100,
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>{role}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '進度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '任務統計',
      key: 'taskStats',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Tag color="default">{record.taskStats.total} 總計</Tag>
          {record.taskStats.delayed > 0 && (
            <Tag color="error">{record.taskStats.delayed} 延遲</Tag>
          )}
          {record.taskStats.inProgress > 0 && (
            <Tag color="blue">{record.taskStats.inProgress} 進行</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '預計結束',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      width: 110,
      render: (date: string) => date ? dayjs(date).format('YYYY/MM/DD') : '-',
    },
  ];

  const taskColumns: ColumnsType<TaskInfo> = [
    {
      title: '任務名稱',
      dataIndex: 'taskName',
      key: 'taskName',
      ellipsis: true,
    },
    {
      title: '所屬專案',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      ellipsis: true,
      render: (name: string, record) => (
        <a onClick={() => navigate(`/projects/${record.projectId}`)}>{name}</a>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const config = taskStatusConfig[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
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
      title: '截止日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
      render: (date: string) => {
        if (!date) return '-';
        const endDate = dayjs(date);
        const today = dayjs();
        const isOverdue = endDate.isBefore(today, 'day');
        return (
          <Text type={isOverdue ? 'danger' : undefined}>
            {endDate.format('YYYY/MM/DD')}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_, record) => (
        <Tooltip title="記錄工時">
          <Button
            type="text"
            icon={<ClockCircleOutlined />}
            onClick={() => openWorkHourModal(record)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" tip="載入中..." />
        </Content>
      </DashboardLayout>
    );
  }

  const stats = data?.statistics;

  return (
    <DashboardLayout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>我的儀表板</Title>

        {/* 統計卡片 */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="參與專案"
                value={stats?.totalProjects || 0}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="進行中專案"
                value={stats?.inProgressProjects || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待處理任務"
                value={stats?.pendingTasks || 0}
                prefix={<UnorderedListOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="延遲任務"
                value={stats?.delayedTasks || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: stats?.delayedTasks ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 提醒區域 */}
        {(data?.overdueTasks?.length || 0) > 0 && (
          <Alert
            message="注意：您有逾期的任務"
            description={
              <Space direction="vertical" size={4}>
                {data?.overdueTasks?.map(task => (
                  <div key={task.id}>
                    <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    <Text strong>{task.taskName}</Text>
                    <Text type="secondary"> - {task.projectName}</Text>
                    <Text type="danger"> (截止: {dayjs(task.endDate).format('MM/DD')})</Text>
                  </div>
                ))}
              </Space>
            }
            type="error"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}

        {(data?.upcomingDeadlines?.length || 0) > 0 && (
          <Alert
            message="即將到期的任務 (7天內)"
            description={
              <Space direction="vertical" size={4}>
                {data?.upcomingDeadlines?.map(task => (
                  <div key={task.id}>
                    <CalendarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <Text strong>{task.taskName}</Text>
                    <Text type="secondary"> - {task.projectName}</Text>
                    <Text type="warning"> (截止: {dayjs(task.endDate).format('MM/DD')})</Text>
                  </div>
                ))}
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {/* 我的專案 */}
        <Card
          title={
            <Space>
              <ProjectOutlined />
              <span>我參與的專案</span>
              <Badge count={data?.projects?.length || 0} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          style={{ marginTop: 24 }}
        >
          {data?.projects && data.projects.length > 0 ? (
            <Table
              columns={projectColumns}
              dataSource={data.projects}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1000 }}
            />
          ) : (
            <Empty description="您目前沒有參與任何專案" />
          )}
        </Card>

        {/* 我的任務 */}
        <Card
          title={
            <Space>
              <UnorderedListOutlined />
              <span>我的任務</span>
              <Badge count={data?.myTasks?.length || 0} style={{ backgroundColor: '#722ed1' }} />
            </Space>
          }
          style={{ marginTop: 16 }}
        >
          {data?.myTasks && data.myTasks.length > 0 ? (
            <Table
              columns={taskColumns}
              dataSource={data.myTasks}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty description="您目前沒有被指派的任務" />
          )}
        </Card>

        {/* Work Hour Modal */}
        <Modal
          title={
            <Space>
              <ClockCircleOutlined />
              記錄工時 - {selectedTask?.taskName}
            </Space>
          }
          open={workHourModalVisible}
          onCancel={() => setWorkHourModalVisible(false)}
          footer={null}
          width={650}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            專案：{selectedTask?.projectName}
          </Text>

          <Form
            form={workHourForm}
            layout="inline"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="workerName"
              label="執行者"
              rules={[{ required: true, message: '請選擇執行者' }]}
            >
              {isPM ? (
                <Select style={{ width: 120 }} placeholder="選擇執行者" showSearch>
                  {projectMembers.map(member => (
                    <Select.Option key={member.id} value={member.memberName}>
                      {member.memberName}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Input style={{ width: 100 }} disabled />
              )}
            </Form.Item>
            <Form.Item
              name="workDate"
              label="日期"
              rules={[{ required: true, message: '請選擇日期' }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              name="hours"
              label="工時"
              rules={[{ required: true, message: '請輸入工時' }]}
            >
              <InputNumber min={0.5} max={24} step={0.5} placeholder="小時" style={{ width: 80 }} />
            </Form.Item>
            <Form.Item name="description" label="說明">
              <Input placeholder="工作內容" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddWorkHour}>
                新增
              </Button>
            </Form.Item>
          </Form>

          <Table
            dataSource={taskWorkHours}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: '日期',
                dataIndex: 'workDate',
                key: 'workDate',
                width: 110,
                render: (v: string) => dayjs(v).format('YYYY-MM-DD')
              },
              { title: '執行者', dataIndex: 'workerName', key: 'workerName', width: 80 },
              {
                title: '工時',
                dataIndex: 'hours',
                key: 'hours',
                width: 70,
                render: (v: number) => `${v} h`
              },
              { title: '說明', dataIndex: 'description', key: 'description', ellipsis: true },
              {
                title: '操作',
                key: 'action',
                width: 60,
                render: (_, record: TaskWorkHour) => (
                  <Popconfirm title="確定刪除?" onConfirm={() => handleDeleteWorkHour(record.id!)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                )
              }
            ]}
            summary={() => (
              <Table.Summary.Row style={{ background: '#fafafa' }}>
                <Table.Summary.Cell index={0}><Text strong>小計</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong>{taskWorkHours.reduce((sum, wh) => sum + Number(wh.hours), 0)} h</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={2}></Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Modal>
      </Content>
    </DashboardLayout>
  );
}
