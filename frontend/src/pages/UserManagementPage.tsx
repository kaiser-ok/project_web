import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  message,
  Modal,
  Form,
  Switch,
  Typography,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SearchOutlined,
  PlusOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../lib/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  alias?: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const roleColors: Record<string, string> = {
  admin: 'red',
  manager: 'orange',
  member: 'blue',
  viewer: 'default',
};

const roleLabels: Record<string, string> = {
  admin: '管理員',
  manager: '經理',
  member: '成員',
  viewer: '檢視者',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [inviteForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('載入使用者失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      alias: user.alias || '',
      role: user.role,
      isActive: user.isActive,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await api.put(`/users/${editingUser!.id}`, values);
      message.success('使用者已更新');
      setEditModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      message.error('更新失敗');
    }
  };

  const handleInvite = async () => {
    try {
      const values = await inviteForm.validateFields();
      await api.post('/users/invite', values);
      message.success('成員已新增');
      setInviteModalVisible(false);
      inviteForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      message.error(error.response?.data?.error || '新增失敗');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.alias && user.alias.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns: ColumnsType<User> = [
    {
      title: '使用者',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>
              <Text strong>{record.alias || record.fullName || record.username}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '別名',
      dataIndex: 'alias',
      key: 'alias',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '啟用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '上次登入',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (value) => value ? dayjs(value).format('YYYY/MM/DD HH:mm') : '從未登入',
    },
    {
      title: '建立時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (value) => dayjs(value).format('YYYY/MM/DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          編輯
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>成員管理</Title>
            <Space>
              <Input
                placeholder="搜尋使用者..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setInviteModalVisible(true)}
              >
                新增成員
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title="編輯使用者"
          open={editModalVisible}
          onOk={handleSave}
          onCancel={() => setEditModalVisible(false)}
          okText="儲存"
          cancelText="取消"
        >
          {editingUser && (
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Avatar src={editingUser.avatar} icon={<UserOutlined />} size={48} />
                <div>
                  <div><Text strong>{editingUser.fullName || editingUser.username}</Text></div>
                  <Text type="secondary">{editingUser.email}</Text>
                </div>
              </Space>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="alias"
              label="別名"
              extra="用於顯示的名稱，例如：張經理"
            >
              <Input placeholder="輸入別名" />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '請選擇角色' }]}
            >
              <Select>
                <Select.Option value="admin">管理員</Select.Option>
                <Select.Option value="manager">經理</Select.Option>
                <Select.Option value="member">成員</Select.Option>
                <Select.Option value="viewer">檢視者</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="isActive"
              label="帳號狀態"
              valuePropName="checked"
            >
              <Switch checkedChildren="啟用" unCheckedChildren="停用" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="新增成員"
          open={inviteModalVisible}
          onOk={handleInvite}
          onCancel={() => {
            setInviteModalVisible(false);
            inviteForm.resetFields();
          }}
          okText="新增"
          cancelText="取消"
        >
          <Form form={inviteForm} layout="vertical">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: '請輸入 Email' },
                { type: 'email', message: '請輸入有效的 Email' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="輸入 Email" />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="姓名"
            >
              <Input prefix={<UserOutlined />} placeholder="輸入姓名（選填）" />
            </Form.Item>

            <Form.Item
              name="alias"
              label="別名"
              extra="用於顯示的名稱，例如：張經理"
            >
              <Input placeholder="輸入別名（選填）" />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '請選擇角色' }]}
              initialValue="member"
            >
              <Select>
                <Select.Option value="admin">管理員</Select.Option>
                <Select.Option value="manager">經理</Select.Option>
                <Select.Option value="member">成員</Select.Option>
                <Select.Option value="viewer">檢視者</Select.Option>
              </Select>
            </Form.Item>
          </Form>
          <Text type="secondary">
            新增成員後，該成員可使用 Google 帳號登入系統
          </Text>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
