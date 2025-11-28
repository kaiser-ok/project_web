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
  Modal,
  Form,
  Tooltip,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';

const { Text } = Typography;

// PM roles that can select other workers
const pmRoles = ['PPM', 'PMO', 'PD', 'PM'];

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
  estimatedHours: number; // 必填欄位
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

interface TaskWorkHour {
  id?: number;
  taskId: number;
  workerName: string;
  workDate: string;
  hours: number;
  description?: string;
}

interface TaskWorkHourSummary {
  taskId: number;
  taskName: string;
  assignee?: string;
  totalHours: number;
  byWorker: Record<string, number>;
  entries: number;
}

interface WorkHourSummaryData {
  tasks: TaskWorkHourSummary[];
  overallByWorker: Record<string, number>;
  totalProjectHours: number;
}

interface CostItem {
  id?: number;
  projectId: number;
  date: string;
  month: string;
  category: 'EQUIPMENT' | 'CONSUMABLE' | 'TRAVEL' | 'OTHER';
  amount: number;
  description: string;
  vendor?: string;
  invoiceNo?: string;
  createdAt?: string;
  updatedAt?: string;
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

const categoryOptions = [
  { label: '全部', value: 'ALL' },
  { label: '設備費用', value: 'EQUIPMENT', color: 'blue' },
  { label: '消耗品', value: 'CONSUMABLE', color: 'green' },
  { label: '交通費', value: 'TRAVEL', color: 'orange' },
  { label: '其他', value: 'OTHER', color: 'purple' },
];

const getCategoryLabel = (category: string) => {
  return categoryOptions.find(c => c.value === category)?.label || category;
};

const getCategoryColor = (category: string) => {
  return categoryOptions.find(c => c.value === category)?.color || 'default';
};

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
  const { user } = useAuthStore();
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
  const [taskWorkHourModalVisible, setTaskWorkHourModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskWorkHours, setTaskWorkHours] = useState<TaskWorkHour[]>([]);
  const [taskWorkHourSummary, setTaskWorkHourSummary] = useState<WorkHourSummaryData | null>(null);
  const [taskWorkHourForm] = Form.useForm();

  // Cost management states
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<CostItem | null>(null);
  const [costForm] = Form.useForm();
  const [costFilter, setCostFilter] = useState({
    category: 'ALL',
    startDate: plannedStartDate,
    endDate: plannedEndDate,
  });

  const months = generateMonthColumns(plannedStartDate, plannedEndDate);

  // Get current user's display name
  const getCurrentUserDisplayName = () => {
    return user?.alias || user?.fullName || user?.username || '';
  };

  // Check if current user has PM role in this project
  const isPM = (() => {
    const userDisplayName = getCurrentUserDisplayName();
    const userMember = members.find(m => m.memberName === userDisplayName);
    return userMember ? pmRoles.includes(userMember.role.toUpperCase()) : false;
  })();

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

  // Fetch task work hours summary
  const fetchTaskWorkHourSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await api.get(`/task-work-hours/project/${projectId}/summary`);
      setTaskWorkHourSummary(response.data?.data || null);
    } catch (error) {
      console.error('Failed to fetch task work hour summary:', error);
    }
  }, [projectId]);

  // Fetch work hours for a specific task
  const fetchTaskWorkHours = async (taskId: number) => {
    try {
      const response = await api.get(`/task-work-hours/task/${taskId}`);
      setTaskWorkHours(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch task work hours:', error);
    }
  };

  // Cost management functions
  const fetchCostItems = useCallback(async () => {
    if (!projectId) return;
    try {
      const params: any = {};
      if (costFilter.category !== 'ALL') {
        params.category = costFilter.category;
      }
      if (costFilter.startDate) {
        params.startDate = costFilter.startDate;
      }
      if (costFilter.endDate) {
        params.endDate = costFilter.endDate;
      }
      const response = await api.get(`/costs/project/${projectId}`, { params });
      setCostItems(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch cost items:', error);
    }
  }, [projectId, costFilter]);

  const getCostSummary = () => {
    const summary = {
      EQUIPMENT: 0,
      CONSUMABLE: 0,
      TRAVEL: 0,
      OTHER: 0,
      total: 0,
    };
    costItems.forEach(item => {
      const amount = Number(item.amount) || 0;
      summary[item.category] += amount;
      summary.total += amount;
    });
    return summary;
  };

  const handleAddCost = () => {
    setEditingCost(null);
    costForm.resetFields();
    costForm.setFieldsValue({
      date: dayjs(),
      category: 'EQUIPMENT',
    });
    setCostModalVisible(true);
  };

  const handleEditCost = (cost: CostItem) => {
    setEditingCost(cost);
    costForm.setFieldsValue({
      ...cost,
      date: dayjs(cost.date),
    });
    setCostModalVisible(true);
  };

  const handleSaveCost = async () => {
    try {
      const values = await costForm.validateFields();
      const costData = {
        projectId,
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };

      if (editingCost?.id) {
        await api.put(`/costs/${editingCost.id}`, costData);
        message.success('成本已更新');
      } else {
        await api.post('/costs', costData);
        message.success('成本已新增');
      }

      setCostModalVisible(false);
      fetchCostItems();
    } catch (error) {
      console.error('Failed to save cost:', error);
      message.error('儲存失敗');
    }
  };

  const handleDeleteCost = async (id: number) => {
    try {
      await api.delete(`/costs/${id}`);
      message.success('成本已刪除');
      fetchCostItems();
    } catch (error) {
      console.error('Failed to delete cost:', error);
      message.error('刪除失敗');
    }
  };

  useEffect(() => {
    fetchCostItems();
  }, [fetchCostItems]);

  // Open work hour modal for a task
  const openTaskWorkHourModal = async (task: Task) => {
    if (!task.id) {
      message.warning('請先儲存任務後再記錄工時');
      return;
    }
    setSelectedTask(task);
    await fetchTaskWorkHours(task.id);
    taskWorkHourForm.resetFields();
    // Default to current user's name, PM can change it
    taskWorkHourForm.setFieldsValue({
      workerName: getCurrentUserDisplayName(),
      workDate: dayjs(),
    });
    setTaskWorkHourModalVisible(true);
  };

  // Add work hour entry
  const handleAddTaskWorkHour = async () => {
    if (!selectedTask?.id) return;
    try {
      const values = await taskWorkHourForm.validateFields();

      // Add work hour
      await api.post(`/task-work-hours/task/${selectedTask.id}`, {
        ...values,
        workDate: values.workDate.format('YYYY-MM-DD'),
      });

      message.success('工時已記錄');

      // Refresh work hours
      await fetchTaskWorkHours(selectedTask.id);
      await fetchTaskWorkHourSummary();

      // Auto-update task status if it's not started
      const taskIndex = tasks.findIndex(t => t.id === selectedTask.id);
      if (taskIndex !== -1) {
        const task = tasks[taskIndex];

        // If task is not started and has work hours, change to in_progress
        if (task.status === 'not_started') {
          try {
            await api.put(`/tasks/${selectedTask.id}`, {
              ...task,
              status: 'in_progress'
            });
            message.info('任務狀態已自動更新為「進行中」');
            setSelectedTask({ ...selectedTask, status: 'in_progress' });
          } catch (error) {
            console.error('Failed to auto-update task status:', error);
          }
        }
      }

      await fetchData(); // Refresh task data

      taskWorkHourForm.resetFields();
      taskWorkHourForm.setFieldsValue({
        workerName: getCurrentUserDisplayName(),
        workDate: dayjs(),
      });
    } catch (error) {
      console.error('Failed to add work hour:', error);
      message.error('記錄工時失敗');
    }
  };

  // Update task status and progress from work hour modal
  const handleUpdateTaskFromModal = async () => {
    if (!selectedTask?.id) return;

    const taskIndex = tasks.findIndex(t => t.id === selectedTask.id);
    if (taskIndex === -1) return;

    // Check if progress is 100% but status is not completed
    if (selectedTask.progress === 100 && selectedTask.status !== 'completed') {
      Modal.confirm({
        title: '進度已達 100%',
        content: '是否要將任務狀態改為「已完成」？',
        okText: '是，標記為已完成',
        cancelText: '否，保持目前狀態',
        onOk: async () => {
          try {
            await api.put(`/tasks/${selectedTask.id}`, {
              ...tasks[taskIndex],
              status: 'completed',
              progress: 100
            });
            message.success('任務已標記為已完成');
            setSelectedTask({ ...selectedTask, status: 'completed' });
            await fetchData();
          } catch (error) {
            console.error('Failed to update task:', error);
            message.error('更新任務失敗');
          }
        },
        onCancel: async () => {
          try {
            await api.put(`/tasks/${selectedTask.id}`, {
              ...tasks[taskIndex],
              status: selectedTask.status,
              progress: selectedTask.progress
            });
            message.success('任務已更新');
            await fetchData();
          } catch (error) {
            console.error('Failed to update task:', error);
            message.error('更新任務失敗');
          }
        }
      });
      return;
    }

    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        ...tasks[taskIndex],
        status: selectedTask.status,
        progress: selectedTask.progress
      });
      message.success('任務已更新');
      await fetchData();
    } catch (error) {
      console.error('Failed to update task:', error);
      message.error('更新任務失敗');
    }
  };

  // Calculate suggested progress based on hours
  const calculateSuggestedProgress = (estimatedHours?: number, actualHours?: number): number => {
    if (!estimatedHours || estimatedHours === 0 || !actualHours) return 0;
    const percentage = Math.round((actualHours / estimatedHours) * 100);
    return Math.min(percentage, 100);
  };

  // Get actual hours for selected task
  const getTaskActualHours = (): number => {
    return taskWorkHours.reduce((sum, wh) => sum + Number(wh.hours), 0);
  };

  // Apply suggested progress with auto-status update
  const handleApplySuggestedProgress = () => {
    if (!selectedTask) return;

    const suggestedProgress = calculateSuggestedProgress(
      selectedTask.estimatedHours,
      getTaskActualHours()
    );

    // If suggested progress is 100%, ask if user wants to mark as completed
    if (suggestedProgress === 100 && selectedTask.status !== 'completed') {
      Modal.confirm({
        title: '建議進度已達 100%',
        content: '是否要同時將任務狀態改為「已完成」？',
        okText: '是，標記為已完成',
        cancelText: '否，只更新進度',
        onOk: () => {
          setSelectedTask({
            ...selectedTask,
            progress: suggestedProgress,
            status: 'completed'
          });
          message.success('已套用建議進度並更新狀態為已完成');
        },
        onCancel: () => {
          setSelectedTask({ ...selectedTask, progress: suggestedProgress });
          message.success('已套用建議進度');
        }
      });
    } else {
      setSelectedTask({ ...selectedTask, progress: suggestedProgress });
      message.success('已套用建議進度');
    }
  };

  // Handle status change with progress sync
  const handleStatusChange = (newStatus: 'not_started' | 'in_progress' | 'completed' | 'delayed') => {
    if (!selectedTask) return;

    // If changing to completed and progress is not 100%, ask if user wants to set progress to 100%
    if (newStatus === 'completed' && selectedTask.progress !== 100) {
      Modal.confirm({
        title: '任務即將標記為已完成',
        content: `目前進度為 ${selectedTask.progress}%，是否要同時將進度設為 100%？`,
        okText: '是，設為 100%',
        cancelText: '否，保持目前進度',
        onOk: () => {
          setSelectedTask({
            ...selectedTask,
            status: newStatus,
            progress: 100
          });
          message.success('已更新狀態為已完成，進度設為 100%');
        },
        onCancel: () => {
          setSelectedTask({ ...selectedTask, status: newStatus });
          message.success('已更新狀態為已完成');
        }
      });
    } else {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  // Delete work hour entry
  const handleDeleteTaskWorkHour = async (id: number) => {
    try {
      await api.delete(`/task-work-hours/${id}`);
      message.success('工時已刪除');
      if (selectedTask?.id) {
        await fetchTaskWorkHours(selectedTask.id);
      }
      await fetchTaskWorkHourSummary();
      await fetchData(); // Refresh task data
    } catch (error) {
      console.error('Failed to delete work hour:', error);
      message.error('刪除工時失敗');
    }
  };

  useEffect(() => {
    fetchSystemUsers();
    fetchData();
    fetchTaskWorkHourSummary();
  }, [fetchData, fetchSystemUsers, fetchTaskWorkHourSummary]);

  // Task handlers
  const addTask = () => {
    const newTask: Task = {
      projectId: projectId!,
      taskName: '',
      estimatedHours: 1, // 預設 1 小時
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
    // 驗證所有任務是否有預計工時
    const invalidTasks = tasks.filter(t => !t.estimatedHours || t.estimatedHours <= 0);
    if (invalidTasks.length > 0) {
      message.error('請為所有任務填寫預計工時（必須大於 0）');
      return;
    }

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
      title: <span><Text type="danger">* </Text>預計工時</span>,
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 100,
      render: (_, record, index) => (
        <InputNumber
          value={record.estimatedHours}
          onChange={v => updateTask(index, 'estimatedHours', v || 1)}
          min={0.5}
          step={0.5}
          style={{
            width: '100%',
            borderColor: (!record.estimatedHours || record.estimatedHours <= 0) ? '#ff4d4f' : undefined
          }}
          placeholder="必填"
          status={(!record.estimatedHours || record.estimatedHours <= 0) ? 'error' : undefined}
        />
      ),
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
      width: 100,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="記錄工時">
            <Button
              type="text"
              icon={<ClockCircleOutlined />}
              onClick={() => openTaskWorkHourModal(record)}
            />
          </Tooltip>
          <Popconfirm title="確定刪除?" onConfirm={() => deleteTask(index)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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
      render: (role: string) => {
        const roleColors: Record<string, string> = {
          'PPM': 'red',
          'PMO': 'orange',
          'PD': 'green',
          'PM': 'blue',
          'CREW': 'purple',
        };
        return <Tag color={roleColors[role] || 'default'}>{role}</Tag>;
      },
    },
    {
      title: '姓名',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 150,
    },
    {
      title: '等級',
      dataIndex: 'memberClass',
      key: 'memberClass',
      width: 80,
      render: (value: string) => value || '-',
    },
    {
      title: '時薪',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value ? `¥ ${Number(value).toLocaleString()}` : '-',
    },
  ];

  // Calculate cost by month
  const getCostByMonth = (month: string): number => {
    return costItems
      .filter(item => item.month === month)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  };

  // Calculate total cost
  const totalCost = costItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // Calculate finance totals
  const financeTotals = {
    plannedRevenue: months.reduce((sum, m) => sum + getFinanceValue(m, 'plannedRevenue'), 0),
    actualRevenue: months.reduce((sum, m) => sum + getFinanceValue(m, 'actualRevenue'), 0),
    plannedExpense: months.reduce((sum, m) => sum + getFinanceValue(m, 'plannedExpense'), 0),
    actualExpense: months.reduce((sum, m) => sum + getFinanceValue(m, 'actualExpense'), 0),
    totalCost: totalCost, // 非人力成本總計
  };
  const plannedProfit = financeTotals.plannedRevenue - financeTotals.plannedExpense;
  const actualProfit = financeTotals.actualRevenue - (financeTotals.actualExpense + financeTotals.totalCost);

  // Helper function to determine if a task spans a specific month
  const taskSpansMonth = (task: Task, month: string): boolean => {
    if (!task.startDate || !task.endDate) return false;
    const monthStart = dayjs(month).startOf('month');
    const monthEnd = dayjs(month).endOf('month');
    const taskStart = dayjs(task.startDate);
    const taskEnd = dayjs(task.endDate);

    return taskStart.isBefore(monthEnd) && taskEnd.isAfter(monthStart);
  };

  // Get task bar style for Gantt chart
  const getTaskBarStyle = (task: Task, month: string) => {
    if (!taskSpansMonth(task, month)) return null;

    const monthStart = dayjs(month).startOf('month');
    const monthEnd = dayjs(month).endOf('month');
    const taskStart = dayjs(task.startDate);
    const taskEnd = dayjs(task.endDate);

    // Calculate position and width percentage
    const monthDays = monthEnd.diff(monthStart, 'day') + 1;
    const barStart = taskStart.isBefore(monthStart) ? monthStart : taskStart;
    const barEnd = taskEnd.isAfter(monthEnd) ? monthEnd : taskEnd;

    const daysFromStart = barStart.diff(monthStart, 'day');
    const barDays = barEnd.diff(barStart, 'day') + 1;

    const leftPercent = (daysFromStart / monthDays) * 100;
    const widthPercent = (barDays / monthDays) * 100;

    // Color based on status
    const colors = {
      not_started: '#d9d9d9',
      in_progress: '#1890ff',
      completed: '#52c41a',
      delayed: '#ff4d4f',
    };

    return {
      position: 'absolute' as const,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      height: '20px',
      backgroundColor: colors[task.status],
      borderRadius: '3px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  };

  return (
    <div>
      {/* Project Overview - Matrix View */}
      <Card
        title="專案概覽"
        style={{ marginBottom: 16 }}
      >
        {/* Task Timeline - Gantt Style */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>任務時間軸</Text>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: months.length * 100 + 250 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 200, position: 'sticky', left: 0, background: '#fafafa', zIndex: 1 }}>任務名稱</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 80 }}>天數</th>
                  {months.map(m => (
                    <th key={m} style={{ border: '1px solid #d9d9d9', padding: 8, minWidth: 100 }}>
                      {dayjs(m).format('YYYY/MM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.startDate && t.endDate).length === 0 ? (
                  <tr>
                    <td colSpan={months.length + 2} style={{ padding: 16, textAlign: 'center' }}>
                      <Text type="secondary">尚無任務時間資料，請設定任務的開始與結束日期</Text>
                    </td>
                  </tr>
                ) : (
                  tasks.filter(t => t.startDate && t.endDate).map((task, idx) => (
                    <tr key={task.id || idx}>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                        <Tooltip title={task.assignee ? `負責人: ${task.assignee}` : ''}>
                          <Text ellipsis style={{ maxWidth: 180, display: 'block' }}>{task.taskName || '未命名任務'}</Text>
                        </Tooltip>
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>
                        <Text>{task.durationDays || '-'}</Text>
                      </td>
                      {months.map(m => (
                        <td key={m} style={{ border: '1px solid #d9d9d9', padding: 4, position: 'relative', height: 36 }}>
                          {taskSpansMonth(task, m) && (
                            <div style={getTaskBarStyle(task, m)!}>
                              <Tooltip title={`${task.taskName} (${task.progress}%)`}>
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  color: '#fff',
                                  fontWeight: 'bold'
                                }}>
                                  {task.progress > 0 ? `${task.progress}%` : ''}
                                </div>
                              </Tooltip>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div>
          <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>財務概覽</Text>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: months.length * 100 + 150 }}>
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
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>收入</Text></td>
                  {months.map(m => {
                    const value = getFinanceValue(m, 'actualRevenue');
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text>{value > 0 ? value.toLocaleString() : '-'}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong>{financeTotals.actualRevenue.toLocaleString()}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>人力成本</Text></td>
                  {months.map(m => {
                    const value = getFinanceValue(m, 'actualExpense');
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text>{value > 0 ? value.toLocaleString() : '-'}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong>{financeTotals.actualExpense.toLocaleString()}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong style={{ color: '#fa8c16' }}>非人力成本</Text></td>
                  {months.map(m => {
                    const value = getCostByMonth(m);
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text style={{ color: '#fa8c16' }}>{value > 0 ? value.toLocaleString() : '-'}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong style={{ color: '#fa8c16' }}>{financeTotals.totalCost.toLocaleString()}</Text>
                  </td>
                </tr>
                <tr style={{ background: '#f0f0f0' }}>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>總支出</Text></td>
                  {months.map(m => {
                    const value = getFinanceValue(m, 'actualExpense') + getCostByMonth(m);
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text strong>{value > 0 ? value.toLocaleString() : '-'}</Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong style={{ fontSize: 16 }}>{(financeTotals.actualExpense + financeTotals.totalCost).toLocaleString()}</Text>
                  </td>
                </tr>
                <tr style={{ background: '#f5f5f5' }}>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>損益</Text></td>
                  {months.map(m => {
                    const revenue = getFinanceValue(m, 'actualRevenue');
                    const expense = getFinanceValue(m, 'actualExpense') + getCostByMonth(m);
                    const profit = revenue - expense;
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text strong type={profit >= 0 ? 'success' : 'danger'}>
                          {profit !== 0 ? profit.toLocaleString() : '-'}
                        </Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong style={{ fontSize: 16 }} type={actualProfit >= 0 ? 'success' : 'danger'}>
                      {actualProfit.toLocaleString()}
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>損益率</Text></td>
                  {months.map(m => {
                    const revenue = getFinanceValue(m, 'actualRevenue');
                    const expense = getFinanceValue(m, 'actualExpense') + getCostByMonth(m);
                    const profit = revenue - expense;
                    const profitRate = revenue > 0 ? (profit / revenue) * 100 : 0;
                    return (
                      <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                        <Text type={profitRate >= 0 ? 'success' : 'danger'}>
                          {revenue > 0 ? `${profitRate.toFixed(1)}%` : '-'}
                        </Text>
                      </td>
                    );
                  })}
                  <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                    <Text strong type={(actualProfit / (financeTotals.actualRevenue || 1)) >= 0 ? 'success' : 'danger'}>
                      {financeTotals.actualRevenue > 0 ? `${((actualProfit / financeTotals.actualRevenue) * 100).toFixed(1)}%` : '-'}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Work Hours Summary */}
        {members.filter(m => m.id).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Text strong style={{ fontSize: 16, marginBottom: 8, display: 'block' }}>人力配置</Text>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: months.length * 80 + 200 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 80 }}>角色</th>
                    <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 100 }}>姓名</th>
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
                    <tr key={member.id}>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>
                        <Tag color={
                          member.role === 'PPM' ? 'red' :
                          member.role === 'PMO' ? 'orange' :
                          member.role === 'PD' ? 'green' :
                          member.role === 'PM' ? 'blue' : 'purple'
                        }>
                          {member.role}
                        </Tag>
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>
                        {member.memberName}
                      </td>
                      {months.map(m => {
                        const actualHours = getWorkHourValue(member.id!, m, 'actualHours');
                        return (
                          <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                            <Text>{actualHours > 0 ? actualHours.toFixed(0) : '-'}</Text>
                          </td>
                        );
                      })}
                      <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                        <Text strong>
                          {months.reduce((sum, m) => sum + getWorkHourValue(member.id!, m, 'actualHours'), 0).toFixed(0)}
                        </Text>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan={2} style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>總計</Text></td>
                    {months.map(m => {
                      const total = members.filter(mem => mem.id).reduce((sum, mem) =>
                        sum + getWorkHourValue(mem.id!, m, 'actualHours'), 0
                      );
                      return (
                        <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                          <Text strong>{total > 0 ? total.toFixed(0) : '-'}</Text>
                        </td>
                      );
                    })}
                    <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {months.reduce((total, m) =>
                          total + members.filter(mem => mem.id).reduce((sum, mem) =>
                            sum + getWorkHourValue(mem.id!, m, 'actualHours'), 0
                          ), 0
                        ).toFixed(0)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

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
              <tr style={{ background: '#fff8e6' }}>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong style={{ color: '#fa8c16' }}>非人力成本</Text></td>
                {months.map(m => {
                  const monthlyCost = getCostByMonth(m);
                  return (
                    <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                      <Text style={{ color: '#fa8c16' }}>{monthlyCost > 0 ? monthlyCost.toLocaleString() : '-'}</Text>
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong style={{ color: '#fa8c16' }}>{financeTotals.totalCost.toLocaleString()}</Text>
                </td>
              </tr>
              <tr style={{ background: '#f0f0f0' }}>
                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}><Text strong>實際支出總計</Text></td>
                {months.map(m => {
                  const totalExpense = getFinanceValue(m, 'actualExpense') + getCostByMonth(m);
                  return (
                    <td key={m} style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'right' }}>
                      <Text strong>{totalExpense.toLocaleString()}</Text>
                    </td>
                  );
                })}
                <td style={{ border: '1px solid #d9d9d9', padding: 8, background: '#e6f7ff', textAlign: 'right' }}>
                  <Text strong style={{ fontSize: 16 }}>{(financeTotals.actualExpense + financeTotals.totalCost).toLocaleString()}</Text>
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
                  const totalExpense = getFinanceValue(m, 'actualExpense') + getCostByMonth(m);
                  const profit = getFinanceValue(m, 'actualRevenue') - totalExpense;
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

      {/* Cost Management */}
      <Card
        title="成本管理"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCost}>
            新增成本
          </Button>
        }
      >
        {costItems.length === 0 ? (
          <Empty description="尚無成本資料" />
        ) : (
          <>
            {/* Cost Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Text type="secondary">設備費用</Text>
                  <div>
                    <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                      ¥ {getCostSummary().EQUIPMENT.toLocaleString()}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Text type="secondary">消耗品</Text>
                  <div>
                    <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                      ¥ {getCostSummary().CONSUMABLE.toLocaleString()}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Text type="secondary">交通費</Text>
                  <div>
                    <Text strong style={{ fontSize: 20, color: '#fa8c16' }}>
                      ¥ {getCostSummary().TRAVEL.toLocaleString()}
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Text type="secondary">其他</Text>
                  <div>
                    <Text strong style={{ fontSize: 20, color: '#722ed1' }}>
                      ¥ {getCostSummary().OTHER.toLocaleString()}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card size="small" style={{ background: '#e6f7ff' }}>
                  <Space size="large">
                    <div>
                      <Text type="secondary">總成本</Text>
                      <div>
                        <Text strong style={{ fontSize: 24, color: '#1890ff' }}>
                          ¥ {getCostSummary().total.toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Space style={{ marginBottom: 16 }}>
              <Select
                value={costFilter.category}
                onChange={v => setCostFilter({ ...costFilter, category: v })}
                style={{ width: 150 }}
              >
                {categoryOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
              <DatePicker.RangePicker
                value={[
                  costFilter.startDate ? dayjs(costFilter.startDate) : null,
                  costFilter.endDate ? dayjs(costFilter.endDate) : null,
                ]}
                onChange={dates => {
                  setCostFilter({
                    ...costFilter,
                    startDate: dates?.[0]?.format('YYYY-MM-DD'),
                    endDate: dates?.[1]?.format('YYYY-MM-DD'),
                  });
                }}
              />
            </Space>

            {/* Cost Items Table */}
            <Table
              dataSource={costItems}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'date',
                  key: 'date',
                  width: 120,
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
                  sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
                },
                {
                  title: '類別',
                  dataIndex: 'category',
                  key: 'category',
                  width: 120,
                  render: (category: string) => (
                    <Tag color={getCategoryColor(category)}>
                      {getCategoryLabel(category)}
                    </Tag>
                  ),
                },
                {
                  title: '說明',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: '金額',
                  dataIndex: 'amount',
                  key: 'amount',
                  width: 120,
                  align: 'right' as const,
                  render: (amount: number) => `¥ ${Number(amount).toLocaleString()}`,
                  sorter: (a, b) => Number(a.amount) - Number(b.amount),
                },
                {
                  title: '供應商',
                  dataIndex: 'vendor',
                  key: 'vendor',
                  width: 150,
                  render: (vendor?: string) => vendor || '-',
                },
                {
                  title: '單據編號',
                  dataIndex: 'invoiceNo',
                  key: 'invoiceNo',
                  width: 150,
                  render: (invoiceNo?: string) => invoiceNo || '-',
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 120,
                  render: (_: any, record: CostItem) => (
                    <Space>
                      <Button size="small" onClick={() => handleEditCost(record)}>
                        編輯
                      </Button>
                      <Popconfirm
                        title="確定要刪除這筆成本嗎？"
                        onConfirm={() => handleDeleteCost(record.id!)}
                        okText="確定"
                        cancelText="取消"
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </>
        )}
      </Card>

      {/* Cost Modal */}
      <Modal
        title={editingCost ? '編輯成本' : '新增成本'}
        open={costModalVisible}
        onOk={handleSaveCost}
        onCancel={() => setCostModalVisible(false)}
        okText="儲存"
        cancelText="取消"
        width={600}
      >
        <Form form={costForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '請選擇日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="類別"
            rules={[{ required: true, message: '請選擇類別' }]}
          >
            <Select>
              {categoryOptions.filter(c => c.value !== 'ALL').map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="金額"
            rules={[
              { required: true, message: '請輸入金額' },
              { type: 'number', min: 0.01, message: '金額必須大於 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="說明"
            rules={[{ required: true, message: '請輸入說明' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="vendor" label="供應商">
            <Input />
          </Form.Item>
          <Form.Item name="invoiceNo" label="單據編號">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Work Hours Management */}
      <Card
        title="工時管理"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveWorkHours}
            loading={savingWorkHours}
          >
            儲存工時
          </Button>
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
          <Empty description="尚無成員資料，請至「專案計劃書」新增成員" />
        )}
      </Card>

      {/* Task Work Hour Summary */}
      {taskWorkHourSummary && taskWorkHourSummary.tasks.length > 0 && (
        <Card title={<Space><FieldTimeOutlined /> 任務工時統計</Space>} style={{ marginTop: 16 }}>
          <Table
            dataSource={taskWorkHourSummary.tasks}
            rowKey="taskId"
            pagination={false}
            size="small"
            columns={[
              { title: '任務名稱', dataIndex: 'taskName', key: 'taskName', width: 200 },
              { title: '負責人', dataIndex: 'assignee', key: 'assignee', width: 100 },
              {
                title: '總工時',
                dataIndex: 'totalHours',
                key: 'totalHours',
                width: 100,
                render: (v: number) => <Text strong>{v.toFixed(1)} h</Text>
              },
              {
                title: '工時分佈',
                key: 'byWorker',
                render: (_, record: TaskWorkHourSummary) => (
                  <Space wrap>
                    {Object.entries(record.byWorker).map(([worker, hours]) => (
                      <Tag key={worker} color="blue">
                        {worker}: {hours.toFixed(1)}h
                      </Tag>
                    ))}
                  </Space>
                )
              },
              {
                title: '記錄數',
                dataIndex: 'entries',
                key: 'entries',
                width: 80,
                render: (v: number) => `${v} 筆`
              }
            ]}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}><Text strong>總計</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong type="success">{taskWorkHourSummary.totalProjectHours.toFixed(1)} h</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Space wrap>
                      {Object.entries(taskWorkHourSummary.overallByWorker).map(([worker, hours]) => (
                        <Tag key={worker} color="green">
                          {worker}: {hours.toFixed(1)}h
                        </Tag>
                      ))}
                    </Space>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {taskWorkHourSummary.tasks.reduce((sum, t) => sum + t.entries, 0)} 筆
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}

      {/* Task Work Hour Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined />
            記錄工時 - {selectedTask?.taskName}
          </Space>
        }
        open={taskWorkHourModalVisible}
        onCancel={() => setTaskWorkHourModalVisible(false)}
        footer={null}
        width={800}
      >
        {/* Task Progress and Status Control */}
        {selectedTask && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>工時統計</Text>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text type="secondary">預計工時：</Text>
                      <Text strong>{selectedTask.estimatedHours || '-'} 小時</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">實際工時：</Text>
                      <Text strong type="success">{getTaskActualHours().toFixed(1)} 小時</Text>
                    </Col>
                  </Row>
                  {selectedTask.estimatedHours && (
                    <div>
                      <Text type="secondary">建議進度：</Text>
                      <Text strong type="warning">
                        {calculateSuggestedProgress(selectedTask.estimatedHours, getTaskActualHours())}%
                      </Text>
                      {getTaskActualHours() > 0 && (
                        <Button
                          size="small"
                          type="link"
                          onClick={handleApplySuggestedProgress}
                        >
                          套用建議
                        </Button>
                      )}
                    </div>
                  )}
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>任務狀態與進度</Text>
                  <Space>
                    <Text>狀態：</Text>
                    <Select
                      value={selectedTask.status}
                      onChange={handleStatusChange}
                      style={{ width: 120 }}
                    >
                      {statusOptions.map(opt => (
                        <Select.Option key={opt.value} value={opt.value}>
                          <span style={{ color: opt.color }}>{opt.label}</span>
                        </Select.Option>
                      ))}
                    </Select>
                  </Space>
                  <Space>
                    <Text>進度：</Text>
                    <InputNumber
                      value={selectedTask.progress}
                      onChange={v => setSelectedTask({ ...selectedTask, progress: v || 0 })}
                      min={0}
                      max={100}
                      style={{ width: 80 }}
                    />
                    <Text>%</Text>
                    <Button type="primary" size="small" onClick={handleUpdateTaskFromModal}>
                      更新
                    </Button>
                  </Space>
                  <Progress percent={selectedTask.progress} status="active" />
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        <Form
          form={taskWorkHourForm}
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
                {members.map(member => (
                  <Select.Option key={member.id} value={member.memberName}>
                    {member.memberName}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input style={{ width: 120 }} disabled />
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
            <Input placeholder="工作內容" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTaskWorkHour}>
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
            { title: '執行者', dataIndex: 'workerName', key: 'workerName', width: 100 },
            {
              title: '工時',
              dataIndex: 'hours',
              key: 'hours',
              width: 80,
              render: (v: number) => `${v} h`
            },
            { title: '說明', dataIndex: 'description', key: 'description' },
            {
              title: '操作',
              key: 'action',
              width: 60,
              render: (_, record: TaskWorkHour) => (
                <Popconfirm title="確定刪除?" onConfirm={() => handleDeleteTaskWorkHour(record.id!)}>
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
                <Text strong>{getTaskActualHours().toFixed(1)} h</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={2}></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Modal>
    </div>
  );
}
