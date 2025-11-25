import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Empty,
  Table,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Space,
  message,
  Popconfirm,
  Progress,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../lib/axios';

const { Text } = Typography;

interface Props {
  projectId?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

interface SystemUser {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  alias?: string;
}

interface Task {
  id?: number;
  projectId: number;
  taskName: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  sortOrder: number;
  isNew?: boolean;
}

interface Member {
  id?: number;
  projectId: number;
  role: string;
  memberName: string;
  memberClass?: string;
  hourlyRate?: number;
  sortOrder: number;
  isNew?: boolean;
}

interface Finance {
  id?: number;
  projectId: number;
  yearMonth: string;
  plannedRevenue: number;
  actualRevenue: number;
  plannedExpense: number;
  actualExpense: number;
  notes?: string;
  isNew?: boolean;
}

interface WorkHour {
  id?: number;
  projectId: number;
  memberId: number;
  yearMonth: string;
  plannedHours: number;
  actualHours: number;
  notes?: string;
}

const roleOptions = [
  { label: 'PPM', value: 'PPM' },
  { label: 'PMO', value: 'PMO' },
  { label: 'PD', value: 'PD' },
  { label: 'PM', value: 'PM' },
  { label: 'CREW', value: 'CREW' },
];

const statusOptions = [
  { label: '未開始', value: 'not_started', color: '#d9d9d9' },
  { label: '進行中', value: 'in_progress', color: '#1890ff' },
  { label: '已完成', value: 'completed', color: '#52c41a' },
  { label: '延遲', value: 'delayed', color: '#ff4d4f' },
];

// Generate month columns based on project dates
function generateMonthColumns(startDate?: string, endDate?: string): string[] {
  if (!startDate || !endDate) {
    // Default: current month + 11 months
    const months: string[] = [];
    const now = dayjs();
    for (let i = 0; i < 12; i++) {
      months.push(now.add(i, 'month').format('YYYY-MM'));
    }
    return months;
  }

  const months: string[] = [];
  let current = dayjs(startDate).startOf('month');
  const end = dayjs(endDate).endOf('month');

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    months.push(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }

  return months;
}

export default function ProjectManagementTab({ projectId, plannedStartDate, plannedEndDate }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);
  const [savingFinances, setSavingFinances] = useState(false);
  const [savingWorkHours, setSavingWorkHours] = useState(false);

  const months = generateMonthColumns(plannedStartDate, plannedEndDate);

  // Fetch system users for selection
  const fetchSystemUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/list');
      setSystemUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch system users:', error);
    }
  }, []);

  // Get display name for user
  const getUserDisplayName = (user: SystemUser) => {
    return user.alias || user.fullName || user.username;
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [tasksRes, membersRes, financesRes, workHoursRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}`),
        api.get(`/members/project/${projectId}`),
        api.get(`/finances/project/${projectId}`),
        api.get(`/work-hours/project/${projectId}`),
      ]);
      setTasks(tasksRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
      setFinances(financesRes.data?.data || []);
      setWorkHours(workHoursRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch project management data:', error);
      message.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSystemUsers();
    fetchData();
  }, [fetchData, fetchSystemUsers]);

  // Task handlers
  const addTask = () => {
    const newTask: Task = {
      projectId: projectId!,
      taskName: '',
      progress: 0,
      status: 'not_started',
      sortOrder: tasks.length,
      isNew: true,
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };

    // Auto-calculate duration if both dates are set
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : newTasks[index].startDate;
      const end = field === 'endDate' ? value : newTasks[index].endDate;
      if (start && end) {
        newTasks[index].durationDays = dayjs(end).diff(dayjs(start), 'day') + 1;
      }
    }

    setTasks(newTasks);
  };

  const deleteTask = async (index: number) => {
    const task = tasks[index];
    if (task.id) {
      try {
        await api.delete(`/tasks/${task.id}`);
        message.success('任務已刪除');
      } catch (error) {
        message.error('刪除失敗');
        return;
      }
    }
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const saveTasks = async () => {
    setSavingTasks(true);
    try {
      for (const task of tasks) {
        if (task.isNew) {
          const { isNew, ...data } = task;
          await api.post('/tasks', data);
        } else if (task.id) {
          await api.put(`/tasks/${task.id}`, task);
        }
      }
      message.success('任務已儲存');
      fetchData();
    } catch (error) {
      message.error('儲存失敗');
    } finally {
      setSavingTasks(false);
    }
  };

  // Member handlers
  const addMember = () => {
    const newMember: Member = {
      projectId: projectId!,
      role: 'CREW',
      memberName: '',
      sortOrder: members.length,
      isNew: true,
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (index: number, field: keyof Member, value: any) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const deleteMember = async (index: number) => {
    const member = members[index];
    if (member.id) {
      try {
        await api.delete(`/members/${member.id}`);
        message.success('成員已刪除');
      } catch (error) {
        message.error('刪除失敗');
        return;
      }
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const saveMembers = async () => {
    setSavingMembers(true);
    try {
      for (const member of members) {
        if (member.isNew) {
          const { isNew, ...data } = member;
          await api.post('/members', data);
        } else if (member.id) {
          await api.put(`/members/${member.id}`, member);
        }
      }
      message.success('成員已儲存');
      fetchData();
    } catch (error) {
      message.error('儲存失敗');
    } finally {
      setSavingMembers(false);
    }
  };

  // Finance handlers
  const updateFinance = (yearMonth: string, field: keyof Finance, value: any) => {
    const existingIndex = finances.findIndex(f => f.yearMonth === yearMonth);
    if (existingIndex >= 0) {
      const newFinances = [...finances];
      newFinances[existingIndex] = { ...newFinances[existingIndex], [field]: value };
      setFinances(newFinances);
    } else {
      const newFinance: Finance = {
        projectId: projectId!,
        yearMonth,
        plannedRevenue: 0,
        actualRevenue: 0,
        plannedExpense: 0,
        actualExpense: 0,
        isNew: true,
        [field]: value,
      };
      setFinances([...finances, newFinance]);
    }
  };

  const getFinanceValue = (yearMonth: string, field: keyof Finance): number => {
    const finance = finances.find(f => f.yearMonth === yearMonth);
    return Number(finance?.[field]) || 0;
  };

  const saveFinances = async () => {
    setSavingFinances(true);
    try {
      const validFinances = finances.filter(f =>
        f.plannedRevenue > 0 || f.actualRevenue > 0 ||
        f.plannedExpense > 0 || f.actualExpense > 0
      );
      await api.put('/finances/bulk', { finances: validFinances });
      message.success('收支已儲存');
      fetchData();
    } catch (error) {
      message.error('儲存失敗');
    } finally {
      setSavingFinances(false);
    }
  };

  // Work hour handlers
  const getWorkHourKey = (memberId: number, yearMonth: string) => `${memberId}-${yearMonth}`;

  const getWorkHourValue = (memberId: number, yearMonth: string, field: 'plannedHours' | 'actualHours'): number => {
    const wh = workHours.find(w => w.memberId === memberId && w.yearMonth === yearMonth);
    return Number(wh?.[field]) || 0;
  };

  const updateWorkHour = (memberId: number, yearMonth: string, field: 'plannedHours' | 'actualHours', value: number) => {
    const existingIndex = workHours.findIndex(w => w.memberId === memberId && w.yearMonth === yearMonth);
    if (existingIndex >= 0) {
      const newWorkHours = [...workHours];
      newWorkHours[existingIndex] = { ...newWorkHours[existingIndex], [field]: value };
      setWorkHours(newWorkHours);
    } else {
      const newWorkHour: WorkHour = {
        projectId: projectId!,
        memberId,
        yearMonth,
        plannedHours: 0,
        actualHours: 0,
        [field]: value,
      };
      setWorkHours([...workHours, newWorkHour]);
    }
  };

  const saveWorkHours = async () => {
    setSavingWorkHours(true);
    try {
      const validWorkHours = workHours.filter(w => w.plannedHours > 0 || w.actualHours > 0);
      await api.put('/work-hours/bulk', { workHours: validWorkHours });
      message.success('工時已儲存');
      fetchData();
    } catch (error) {
      message.error('儲存失敗');
    } finally {
      setSavingWorkHours(false);
    }
  };

  if (!projectId) {
    return (
      <Empty description="請先儲存專案後才能使用管理表" />
    );
  }

  // Task columns
  const taskColumns: ColumnsType<Task> = [
    {
      title: '任務名稱',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      render: (_, record, index) => (
        <Input
          value={record.taskName}
          onChange={e => updateTask(index, 'taskName', e.target.value)}
          placeholder="輸入任務名稱"
        />
      ),
    },
    {
      title: '負責人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (_, record, index) => (
        <Select
          value={record.assignee}
          onChange={v => updateTask(index, 'assignee', v)}
          placeholder="選擇負責人"
          style={{ width: '100%' }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {systemUsers.map(user => (
            <Select.Option key={user.id} value={getUserDisplayName(user)}>
              {getUserDisplayName(user)}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '開始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 140,
      render: (_, record, index) => (
        <DatePicker
          value={record.startDate ? dayjs(record.startDate) : null}
          onChange={d => updateTask(index, 'startDate', d?.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '結束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 140,
      render: (_, record, index) => (
        <DatePicker
          value={record.endDate ? dayjs(record.endDate) : null}
          onChange={d => updateTask(index, 'endDate', d?.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '天數',
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 80,
      render: (value) => value || '-',
    },
    {
      title: '進度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (_, record, index) => (
        <Space>
          <InputNumber
            value={record.progress}
            onChange={v => updateTask(index, 'progress', v || 0)}
            min={0}
            max={100}
            style={{ width: 60 }}
          />
          <Progress percent={record.progress} size="small" style={{ width: 60 }} showInfo={false} />
        </Space>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record, index) => (
        <Select
          value={record.status}
          onChange={v => updateTask(index, 'status', v)}
          style={{ width: '100%' }}
        >
          {statusOptions.map(opt => (
            <Select.Option key={opt.value} value={opt.value}>
              <span style={{ color: opt.color }}>{opt.label}</span>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, __, index) => (
        <Popconfirm title="確定刪除?" onConfirm={() => deleteTask(index)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Member columns
  const memberColumns: ColumnsType<Member> = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (_, record, index) => (
        <Select
          value={record.role}
          onChange={v => updateMember(index, 'role', v)}
          style={{ width: '100%' }}
        >
          {roleOptions.map(opt => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 150,
      render: (_, record, index) => (
        <Select
          value={record.memberName}
          onChange={v => updateMember(index, 'memberName', v)}
          placeholder="選擇成員"
          style={{ width: '100%' }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {systemUsers.map(user => (
            <Select.Option key={user.id} value={getUserDisplayName(user)}>
              {getUserDisplayName(user)}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '等級',
      dataIndex: 'memberClass',
      key: 'memberClass',
      width: 80,
      render: (_, record, index) => (
        <Input
          value={record.memberClass}
          onChange={e => updateMember(index, 'memberClass', e.target.value)}
          placeholder="等級"
        />
      ),
    },
    {
      title: '時薪',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 100,
      render: (_, record, index) => (
        <InputNumber
          value={record.hourlyRate}
          onChange={v => updateMember(index, 'hourlyRate', v || 0)}
          style={{ width: '100%' }}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => Number(v?.replace(/,/g, '') || 0)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, __, index) => (
        <Popconfirm title="確定刪除?" onConfirm={() => deleteMember(index)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Calculate finance totals
  const financeTotals = {
    plannedRevenue: months.reduce((sum, m) => sum + getFinanceValue(m, 'plannedRevenue'), 0),
    actualRevenue: months.reduce((sum, m) => sum + getFinanceValue(m, 'actualRevenue'), 0),
    plannedExpense: months.reduce((sum, m) => sum + getFinanceValue(m, 'plannedExpense'), 0),
    actualExpense: months.reduce((sum, m) => sum + getFinanceValue(m, 'actualExpense'), 0),
  };
  const plannedProfit = financeTotals.plannedRevenue - financeTotals.plannedExpense;
  const actualProfit = financeTotals.actualRevenue - financeTotals.actualExpense;

  return (
    <div>
      {/* Task Management */}
      <Card
        title="任務管理"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={addTask}>新增任務</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveTasks}
              loading={savingTasks}
            >
              儲存任務
            </Button>
          </Space>
        }
      >
        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey={(r, i) => r.id?.toString() || `new-${i}`}
          pagination={false}
          size="small"
          scroll={{ x: 1100 }}
          loading={loading}
        />
      </Card>

      {/* Finance Management */}
      <Card
        title="收支管理"
        style={{ marginBottom: 16 }}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveFinances}
            loading={savingFinances}
          >
            儲存收支
          </Button>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: months.length * 100 + 200 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 120 }}>項目</th>
                {months.map(m => (
                  <th key={m} style={{ border: '1px solid #d9d9d9', padding: 8, minWidth: 100 }}>
                    {dayjs(m).format('YYYY/MM')}
                  </th>
                ))}
                <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 120, background: '#e6f7ff' }}>合計</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>計劃收入</Text></td>
                {months.map(m => (
                  <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                    <InputNumber
                      value={getFinanceValue(m, 'plannedRevenue')}
                      onChange={v => updateFinance(m, 'plannedRevenue', v || 0)}
                      style={{ width: '100%' }}
                      size="small"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => Number(v?.replace(/,/g, '') || 0)}
                    />
                  </td>
                ))}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong>{financeTotals.plannedRevenue.toLocaleString()}</Text>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>實際收入</Text></td>
                {months.map(m => (
                  <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                    <InputNumber
                      value={getFinanceValue(m, 'actualRevenue')}
                      onChange={v => updateFinance(m, 'actualRevenue', v || 0)}
                      style={{ width: '100%' }}
                      size="small"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => Number(v?.replace(/,/g, '') || 0)}
                    />
                  </td>
                ))}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong>{financeTotals.actualRevenue.toLocaleString()}</Text>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>計劃支出</Text></td>
                {months.map(m => (
                  <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                    <InputNumber
                      value={getFinanceValue(m, 'plannedExpense')}
                      onChange={v => updateFinance(m, 'plannedExpense', v || 0)}
                      style={{ width: '100%' }}
                      size="small"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => Number(v?.replace(/,/g, '') || 0)}
                    />
                  </td>
                ))}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong>{financeTotals.plannedExpense.toLocaleString()}</Text>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>實際支出</Text></td>
                {months.map(m => (
                  <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                    <InputNumber
                      value={getFinanceValue(m, 'actualExpense')}
                      onChange={v => updateFinance(m, 'actualExpense', v || 0)}
                      style={{ width: '100%' }}
                      size="small"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => Number(v?.replace(/,/g, '') || 0)}
                    />
                  </td>
                ))}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong>{financeTotals.actualExpense.toLocaleString()}</Text>
                </td>
              </tr>
              <tr style={{ background: '#f5f5f5' }}>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>計劃損益</Text></td>
                {months.map(m => {
                  const profit = getFinanceValue(m, 'plannedRevenue') - getFinanceValue(m, 'plannedExpense');
                  return (
                    <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                      <Text type={profit >= 0 ? 'success' : 'danger'}>{profit.toLocaleString()}</Text>
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong type={plannedProfit >= 0 ? 'success' : 'danger'}>{plannedProfit.toLocaleString()}</Text>
                </td>
              </tr>
              <tr style={{ background: '#f5f5f5' }}>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>實際損益</Text></td>
                {months.map(m => {
                  const profit = getFinanceValue(m, 'actualRevenue') - getFinanceValue(m, 'actualExpense');
                  return (
                    <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                      <Text type={profit >= 0 ? 'success' : 'danger'}>{profit.toLocaleString()}</Text>
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong type={actualProfit >= 0 ? 'success' : 'danger'}>{actualProfit.toLocaleString()}</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Work Hours Management */}
      <Card
        title="工時管理"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={addMember}>新增成員</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveMembers}
              loading={savingMembers}
            >
              儲存成員
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={saveWorkHours}
              loading={savingWorkHours}
            >
              儲存工時
            </Button>
          </Space>
        }
      >
        {/* Member list */}
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey={(r, i) => r.id?.toString() || `new-${i}`}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
          loading={loading}
        />

        {/* Work hours matrix */}
        {members.filter(m => m.id).length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: months.length * 80 + 300 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 80 }}>角色</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 100 }}>姓名</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 60 }}>類型</th>
                  {months.map(m => (
                    <th key={m} style={{ border: '1px solid #d9d9d9', padding: 8, minWidth: 80 }}>
                      {dayjs(m).format('MM月')}
                    </th>
                  ))}
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 80, background: '#e6f7ff' }}>合計</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(m => m.id).map(member => (
                  <>
                    <tr key={`${member.id}-planned`}>
                      <td rowSpan={2} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>
                        {member.role}
                      </td>
                      <td rowSpan={2} style={{ border: '1px solid #d9d9d9', padding: 8 }}>
                        {member.memberName}
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>計劃</td>
                      {months.map(m => (
                        <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                          <InputNumber
                            value={getWorkHourValue(member.id!, m, 'plannedHours')}
                            onChange={v => updateWorkHour(member.id!, m, 'plannedHours', v || 0)}
                            style={{ width: '100%' }}
                            size="small"
                            min={0}
                          />
                        </td>
                      ))}
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                        {months.reduce((sum, m) => sum + getWorkHourValue(member.id!, m, 'plannedHours'), 0)}
                      </td>
                    </tr>
                    <tr key={`${member.id}-actual`}>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>實際</td>
                      {months.map(m => (
                        <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4 }}>
                          <InputNumber
                            value={getWorkHourValue(member.id!, m, 'actualHours')}
                            onChange={v => updateWorkHour(member.id!, m, 'actualHours', v || 0)}
                            style={{ width: '100%' }}
                            size="small"
                            min={0}
                          />
                        </td>
                      ))}
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                        {months.reduce((sum, m) => sum + getWorkHourValue(member.id!, m, 'actualHours'), 0)}
                      </td>
                    </tr>
                  </>
                ))}
                {/* Totals row */}
                <tr style={{ background: '#f5f5f5' }}>
                  <td colSpan={2} style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>總計</Text></td>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>計劃</td>
                  {months.map(m => {
                    const total = members.filter(mem => mem.id).reduce((sum, mem) =>
                      sum + getWorkHourValue(mem.id!, m, 'plannedHours'), 0
                    );
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text strong>{total}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong>
                      {months.reduce((total, m) =>
                        total + members.filter(mem => mem.id).reduce((sum, mem) =>
                          sum + getWorkHourValue(mem.id!, m, 'plannedHours'), 0
                        ), 0
                      )}
                    </Text>
                  </td>
                </tr>
                <tr style={{ background: '#f5f5f5' }}>
                  <td colSpan={2} style={{ border: '1px solid #d9d9d9', padding: 8 }}></td>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>實際</td>
                  {months.map(m => {
                    const total = members.filter(mem => mem.id).reduce((sum, mem) =>
                      sum + getWorkHourValue(mem.id!, m, 'actualHours'), 0
                    );
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text strong>{total}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong>
                      {months.reduce((total, m) =>
                        total + members.filter(mem => mem.id).reduce((sum, mem) =>
                          sum + getWorkHourValue(mem.id!, m, 'actualHours'), 0
                        ), 0
                      )}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {members.filter(m => m.id).length === 0 && (
          <Empty description="請先新增並儲存成員後，才能填寫工時" />
        )}
      </Card>
    </div>
  );
}
