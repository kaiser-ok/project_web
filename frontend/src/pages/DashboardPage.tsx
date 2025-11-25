import { Layout, Card, Statistic, Row, Col, Typography } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';

const { Title } = Typography;
const { Content } = Layout;

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>儀表板</Title>

        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="總專案數"
                value={12}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="進行中"
                value={5}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已完成"
                value={7}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="團隊成員"
                value={23}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={16}>
            <Card title="最近的專案" bordered={false}>
              <p>專案列表即將推出...</p>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="待辦事項" bordered={false}>
              <p>待辦事項列表即將推出...</p>
            </Card>
          </Col>
        </Row>
      </Content>
    </DashboardLayout>
  );
}
