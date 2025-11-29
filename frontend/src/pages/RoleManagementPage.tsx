import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Switch,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../lib/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;

interface Role {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleColors: Record<string, string> = {
  PM: 'blue',
  PPM: 'red',
  PMO: 'orange',
  PD: 'green',
  CREW: 'purple',
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/roles');
      setRoles(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      message.error('載入角色失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggle = (roleId: number, checked: boolean) => {
    setRoles(prevRoles =>
      prevRoles.map(role =>
        role.id === roleId ? { ...role, isActive: checked } : role
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/roles/bulk/update', { roles });
      message.success('角色設定已儲存');
      setHasChanges(false);
      fetchRoles();
    } catch (error) {
      console.error('Failed to save roles:', error);
      message.error('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: '角色代碼',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => (
        <Tag color={roleColors[code]}>{code}</Tag>
      ),
    },
    {
      title: '角色名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isActive ? 'success' : 'default'}
        >
          {isActive ? '啟用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '啟用/停用',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) => handleToggle(record.id, checked)}
          checkedChildren="啟用"
          unCheckedChildren="停用"
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>專案角色管理</Title>
              <Text type="secondary">
                控制系統可用的專案角色。停用後無法用於新增專案成員或任務，但歷史資料將保留。
              </Text>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
            >
              儲存變更
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            pagination={false}
          />

          {hasChanges && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
              <Text type="warning">您有未儲存的變更，請點擊「儲存變更」按鈕以保存設定。</Text>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
