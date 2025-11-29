import { useEffect, useCallback, useState } from 'react';
import {
  Input,
  InputNumber,
  DatePicker,
  Select,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Table,
  Tag,
  Empty,
  Button,
  Modal,
  Form,
  message,
  Popconfirm,
  Space,
} from 'antd';
import {
  AimOutlined,
  ToolOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectData } from '../../pages/ProjectDetailPage';
import dayjs from 'dayjs';
import api from '../../lib/axios';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ProjectMember {
  id: number;
  role: string;
  memberName: string;
  memberEmail?: string;
  memberClass?: string;
  hourlyRate?: number;
  plannedHours?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  alias?: string;
  hourlyRate?: number;
  role?: string;
}

// Section header component
const SectionHeader = ({ icon, title, color, bgColor }: { icon: React.ReactNode; title: string; color: string; bgColor: string }) => (
  <div style={{
    background: bgColor,
    border: `2px solid ${color}`,
    borderRadius: 8,
    padding: '12px 20px',
    marginBottom: 16,
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }}>
    <span style={{ fontSize: 24, color }}>{icon}</span>
    <Title level={4} style={{ margin: 0, color }}>{title}</Title>
  </div>
);

interface Props {
  project: ProjectData;
  onChange: (field: keyof ProjectData, value: any) => void;
  isNew: boolean;
}

export default function ProjectPlanTab({ project, onChange, isNew }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [memberForm] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const plannedProfit = (project.plannedRevenue || 0) - (project.plannedExpense || 0);
  const plannedProfitRate = project.plannedRevenue
    ? ((plannedProfit / project.plannedRevenue) * 100).toFixed(1)
    : '0';

  // Fetch project members
  const fetchMembers = useCallback(async () => {
    if (!project.id) return;
    setLoadingMembers(true);
    try {
      const response = await api.get(`/members/project/${project.id}`);
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (project.id) {
      fetchMembers();
    }
  }, [project.id, fetchMembers]);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users/list');
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Member CRUD operations
  const handleAddMember = () => {
    setEditingMember(null);
    memberForm.resetFields();
    setMemberModalVisible(true);
  };

  const handleEditMember = (member: ProjectMember) => {
    setEditingMember(member);
    memberForm.setFieldsValue(member);
    setMemberModalVisible(true);
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      await api.delete(`/members/${memberId}`);
      message.success('成員已刪除');
      fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      message.error('刪除成員失敗');
    }
  };

  const handleUserSelect = (userId: number) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      memberForm.setFieldsValue({
        memberName: selectedUser.alias || selectedUser.username,
        memberEmail: selectedUser.email
      });
    }
  };

  const handleSaveMember = async () => {
    try {
      const values = await memberForm.validateFields();
      if (editingMember) {
        await api.put(`/members/${editingMember.id}`, values);
        message.success('成員已更新');
      } else {
        await api.post('/members', { ...values, projectId: project.id });
        message.success('成員已新增');
      }
      setMemberModalVisible(false);
      fetchMembers();
    } catch (error) {
      console.error('Failed to save member:', error);
      message.error('儲存成員失敗');
    }
  };

  // Handle start date change
  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    const startDate = date?.format('YYYY-MM-DD');
    onChange('plannedStartDate', startDate);

    // If duration is set, calculate end date
    if (date && project.plannedDurationMonths) {
      const endDate = date.add(project.plannedDurationMonths, 'month').format('YYYY-MM-DD');
      onChange('plannedEndDate', endDate);
    }
    // If end date is set, calculate duration
    else if (date && project.plannedEndDate) {
      const months = dayjs(project.plannedEndDate).diff(date, 'month', true);
      onChange('plannedDurationMonths', Math.round(months * 10) / 10);
    }
  };

  // Handle end date change
  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    const endDate = date?.format('YYYY-MM-DD');
    onChange('plannedEndDate', endDate);

    // If start date is set, calculate duration
    if (date && project.plannedStartDate) {
      const months = date.diff(dayjs(project.plannedStartDate), 'month', true);
      onChange('plannedDurationMonths', Math.round(months * 10) / 10);
    }
  };

  // Handle duration change
  const handleDurationChange = (duration: number | null) => {
    onChange('plannedDurationMonths', duration);

    // If start date is set, calculate end date
    if (duration && project.plannedStartDate) {
      const endDate = dayjs(project.plannedStartDate).add(duration, 'month').format('YYYY-MM-DD');
      onChange('plannedEndDate', endDate);
    }
  };

  // Fetch next project code when project type changes (only for new projects)
  const fetchNextProjectCode = useCallback(async (projectType: string) => {
    if (!isNew) return;
    try {
      const response = await api.get('/projects/next-code', {
        params: { projectType }
      });
      const nextCode = response.data?.data?.projectCode;
      if (nextCode) {
        onChange('projectCode', nextCode);
      }
    } catch (error) {
      console.error('Failed to fetch next project code:', error);
    }
  }, [isNew, onChange]);

  // Auto-generate project code when creating new project
  useEffect(() => {
    if (isNew && project.projectType && !project.projectCode) {
      fetchNextProjectCode(project.projectType);
    }
  }, [isNew, project.projectType, project.projectCode, fetchNextProjectCode]);

  const handleProjectTypeChange = (value: string) => {
    onChange('projectType', value);
    if (isNew) {
      fetchNextProjectCode(value);
    }
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* 注意事項 */}
      <div style={{
        background: '#fff7e6',
        border: '1px solid #ffd591',
        padding: '8px 16px',
        marginBottom: 16,
        borderRadius: 4,
      }}>
        <Text type="warning">
          【注意】灰色網底欄位為自動計算，請勿手動輸入。白色欄位為可編輯項目。
        </Text>
      </div>

      {/* 基本資訊 */}
      <Row gutter={24}>
        <Col span={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={8}><Text strong>建立日期：</Text></Col>
              <Col span={16}>
                <DatePicker
                  style={{ width: '100%' }}
                  disabled
                  value={project.createdAt ? dayjs(project.createdAt) : dayjs()}
                />
              </Col>
              <Col span={8}><Text strong>建立者：</Text></Col>
              <Col span={16}>
                <Input disabled value="-" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={8}><Text strong>更新日期：</Text></Col>
              <Col span={16}>
                <DatePicker
                  style={{ width: '100%' }}
                  disabled
                  value={project.updatedAt ? dayjs(project.updatedAt) : null}
                />
              </Col>
              <Col span={8}><Text strong>更新者：</Text></Col>
              <Col span={16}>
                <Input disabled value="-" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 基本資訊區塊 */}
      <Row gutter={24}>
        <Col span={16}>
          <Card title="基本資訊" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 12]}>
              <Col span={6}><Text strong>客戶：</Text></Col>
              <Col span={18}>
                <Input
                  value={project.clientName}
                  onChange={(e) => onChange('clientName', e.target.value)}
                  placeholder="輸入客戶名稱"
                />
              </Col>
              <Col span={6}><Text strong>專案名稱：</Text></Col>
              <Col span={18}>
                <Input
                  value={project.projectName}
                  onChange={(e) => onChange('projectName', e.target.value)}
                  placeholder="輸入專案名稱"
                />
              </Col>
              <Col span={6}><Text strong>專案概要：</Text></Col>
              <Col span={18}>
                <TextArea
                  value={project.projectOverview}
                  onChange={(e) => onChange('projectOverview', e.target.value)}
                  rows={3}
                  placeholder="輸入專案概要說明"
                />
              </Col>
              <Col span={6}><Text strong>附件資料：</Text></Col>
              <Col span={18}>
                <Input
                  value={project.projectFolderPath}
                  onChange={(e) => onChange('projectFolderPath', e.target.value)}
                  placeholder="專案資料夾路徑"
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={10}><Text strong>專案類型：</Text></Col>
              <Col span={14}>
                <Select
                  value={project.projectType}
                  onChange={handleProjectTypeChange}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="客戶需求導向">客戶需求導向</Select.Option>
                  <Select.Option value="公司策略導向">公司策略導向</Select.Option>
                  <Select.Option value="內部專案">內部專案</Select.Option>
                </Select>
              </Col>
              <Col span={10}><Text strong>專案編號：</Text></Col>
              <Col span={14}>
                <Input
                  value={project.projectCode}
                  onChange={(e) => onChange('projectCode', e.target.value)}
                  placeholder="自動產生"
                  disabled={isNew}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ==================== GOAL 目標 ==================== */}
      <SectionHeader
        icon={<AimOutlined />}
        title="Goal - 目標"
        color="#1890ff"
        bgColor="#e6f7ff"
      />
      <Row gutter={24}>
        <Col span={12}>
          <Card
            title="收益與成本分析"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #1890ff' }}
          >
            <Row gutter={[16, 8]}>
              <Col span={10}><Text strong>① 收入：</Text></Col>
              <Col span={14}>
                <InputNumber
                  value={project.plannedRevenue}
                  onChange={(v) => onChange('plannedRevenue', v || 0)}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v?.replace(/,/g, '') || 0)}
                />
              </Col>
              <Col span={10}><Text strong>② 支出：</Text></Col>
              <Col span={14}>
                <InputNumber
                  value={project.plannedExpense}
                  onChange={(v) => onChange('plannedExpense', v || 0)}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v?.replace(/,/g, '') || 0)}
                />
              </Col>
              <Col span={10}><Text strong>③ 損益（①-②）：</Text></Col>
              <Col span={14}>
                <InputNumber
                  value={plannedProfit}
                  disabled
                  style={{ width: '100%', background: '#f5f5f5' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Col>
              <Col span={10}><Text strong>④ 利潤率（③/①）：</Text></Col>
              <Col span={14}>
                <Input
                  value={`${plannedProfitRate}%`}
                  disabled
                  style={{ background: '#f5f5f5' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="專案時程"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #1890ff' }}
          >
            <Row gutter={[16, 8]}>
              <Col span={10}><Text strong>開始日期：</Text></Col>
              <Col span={14}>
                <DatePicker
                  value={project.plannedStartDate ? dayjs(project.plannedStartDate) : null}
                  onChange={handleStartDateChange}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={10}><Text strong>結束日期：</Text></Col>
              <Col span={14}>
                <DatePicker
                  value={project.plannedEndDate ? dayjs(project.plannedEndDate) : null}
                  onChange={handleEndDateChange}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={10}><Text strong>專案期間：</Text></Col>
              <Col span={14}>
                <InputNumber
                  value={project.plannedDurationMonths}
                  onChange={handleDurationChange}
                  style={{ width: '100%' }}
                  addonAfter="個月"
                  min={0}
                  step={0.5}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Card
        title="專案創造的價值與客戶滿意度"
        size="small"
        style={{ marginBottom: 16, borderTop: '3px solid #1890ff' }}
      >
        <TextArea
          value={project.valueProposition}
          onChange={(e) => onChange('valueProposition', e.target.value)}
          rows={3}
          placeholder="描述專案將為客戶創造的價值..."
        />
      </Card>

      {/* ==================== APPROACH 方法 ==================== */}
      <SectionHeader
        icon={<ToolOutlined />}
        title="Approach - 方法"
        color="#52c41a"
        bgColor="#f6ffed"
      />
      <Row gutter={24}>
        <Col span={12}>
          <Card
            title="專案要解決的問題"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #52c41a' }}
          >
            <TextArea
              value={project.problemToSolve}
              onChange={(e) => onChange('problemToSolve', e.target.value)}
              rows={4}
              placeholder="・瞭解現況，分析問題&#10;・提供建議與解決方案..."
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="提供什麼樣的經驗與服務"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #52c41a' }}
          >
            <TextArea
              value={project.experienceProvided}
              onChange={(e) => onChange('experienceProvided', e.target.value)}
              rows={4}
              placeholder="透過專業顧問服務，提供全面的分析與高效的解決方案..."
            />
          </Card>
        </Col>
      </Row>

      {/* ==================== RESOURCE 資源 ==================== */}
      <SectionHeader
        icon={<TeamOutlined />}
        title="Resource - 資源"
        color="#722ed1"
        bgColor="#f9f0ff"
      />
      <Row gutter={24}>
        <Col span={12}>
          <Card
            title="組織與個人能力提升"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #722ed1' }}
          >
            <TextArea
              value={project.organizationalImprovement}
              onChange={(e) => onChange('organizationalImprovement', e.target.value)}
              rows={4}
              placeholder="成員A：&#10;・專案管理能力&#10;・數據分析工具運用..."
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="方法論與知識累積"
            size="small"
            style={{ marginBottom: 16, borderTop: '3px solid #722ed1' }}
          >
            <TextArea
              value={project.knowledgeAccumulation}
              onChange={(e) => onChange('knowledgeAccumulation', e.target.value)}
              rows={4}
              placeholder="可供組織廣泛運用的方法論..."
            />
          </Card>
        </Col>
      </Row>

      {/* 人力投入清單 */}
      <Card
        title={
          <span>
            <UserOutlined style={{ marginRight: 8 }} />
            如何投入人力與時間？
          </span>
        }
        size="small"
        style={{ marginBottom: 16, borderTop: '3px solid #722ed1' }}
        extra={
          !isNew && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddMember}
            >
              新增成員
            </Button>
          )
        }
      >
        {members.length > 0 ? (
          <Table
            dataSource={members}
            rowKey="id"
            size="small"
            pagination={false}
            loading={loadingMembers}
            columns={[
              {
                title: '角色',
                dataIndex: 'role',
                key: 'role',
                width: 120,
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
                title: '別名',
                dataIndex: 'memberName',
                key: 'memberName',
                width: 100,
              },
              {
                title: 'Email',
                dataIndex: 'memberEmail',
                key: 'memberEmail',
                width: 200,
                render: (value: string) => value || '-',
              },
              {
                title: '工數',
                dataIndex: 'plannedHours',
                key: 'plannedHours',
                width: 120,
                align: 'right' as const,
                render: (value: number) => value ? `${Number(value).toLocaleString()} h` : '-',
              },
              {
                title: '操作',
                key: 'action',
                width: 120,
                render: (_: any, record: ProjectMember) => (
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditMember(record)}
                    />
                    <Popconfirm
                      title="確定要刪除此成員嗎？"
                      onConfirm={() => handleDeleteMember(record.id)}
                      okText="確定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={isNew ? '請先儲存專案後再新增成員' : '尚無成員資料，請點擊「新增成員」按鈕'}
          />
        )}
      </Card>

      {/* 成員編輯 Modal */}
      <Modal
        title={editingMember ? '編輯成員' : '新增成員'}
        open={memberModalVisible}
        onOk={handleSaveMember}
        onCancel={() => setMemberModalVisible(false)}
        okText="儲存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '請選擇角色' }]}
          >
            <Select placeholder="選擇角色">
              <Select.Option value="PPM">PPM</Select.Option>
              <Select.Option value="PMO">PMO</Select.Option>
              <Select.Option value="PD">PD</Select.Option>
              <Select.Option value="PM">PM</Select.Option>
              <Select.Option value="CREW">CREW</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="userId"
            label="專案成員"
            rules={[{ required: !editingMember, message: '請選擇專案成員' }]}
          >
            <Select
              placeholder="請選擇人員"
              loading={loadingUsers}
              onChange={handleUserSelect}
              disabled={!!editingMember}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map(user => ({
                label: `${user.alias || user.username} (${user.email})`,
                value: user.id
              }))}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="memberName"
            label="別名"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="memberEmail"
            label="Email"
          >
            <Input
              disabled
              placeholder="選擇成員後自動填入"
              style={{ background: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="plannedHours"
            label="工數"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="輸入預計工數"
              addonAfter="小時"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 審查結果 */}
      <Card title="■ 專案審查結果" size="small">
        <Row gutter={24}>
          <Col span={12}>
            <Row gutter={[16, 8]}>
              <Col span={8}><Text strong>審查結果：</Text></Col>
              <Col span={16}>
                <Select
                  value={project.reviewResult}
                  onChange={(v) => onChange('reviewResult', v)}
                  style={{ width: '100%' }}
                  allowClear
                  placeholder="請選擇"
                >
                  <Select.Option value="approved">核准</Select.Option>
                  <Select.Option value="conditional">有條件核准</Select.Option>
                  <Select.Option value="rejected">駁回</Select.Option>
                  <Select.Option value="pending">待審</Select.Option>
                </Select>
              </Col>
              <Col span={8}><Text strong>審查日期：</Text></Col>
              <Col span={16}>
                <DatePicker
                  value={project.reviewDate ? dayjs(project.reviewDate) : null}
                  onChange={(d) => onChange('reviewDate', d?.format('YYYY-MM-DD'))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}><Text strong>審查人：</Text></Col>
              <Col span={16}>
                <Select
                  value={project.reviewer}
                  onChange={(v) => onChange('reviewer', v)}
                  style={{ width: '100%' }}
                  placeholder="選擇審查人"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  loading={loadingUsers}
                >
                  {users
                    .filter(user => user.role === 'admin')
                    .map(user => (
                      <Select.Option key={user.id} value={user.alias || user.fullName || user.username}>
                        {user.alias || user.fullName || user.username}
                      </Select.Option>
                    ))}
                </Select>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Text strong>備註事項：</Text>
            <TextArea
              value={project.reviewNotes}
              onChange={(e) => onChange('reviewNotes', e.target.value)}
              rows={4}
              style={{ marginTop: 8 }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
