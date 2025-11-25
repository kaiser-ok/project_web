import { Card, Empty, Row, Col, Input, InputNumber, Typography } from 'antd';
import type { ProjectData } from '../../pages/ProjectDetailPage';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  project: ProjectData;
  onChange: (field: keyof ProjectData, value: any) => void;
}

export default function ProjectReportTab({ project, onChange }: Props) {
  const actualProfit = (project.actualRevenue || 0) - (project.actualExpense || 0);

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* 實績比較 */}
      <Card title="計劃 vs 實績" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={6}></Col>
          <Col span={9}><Text strong>計劃</Text></Col>
          <Col span={9}><Text strong>實績</Text></Col>

          <Col span={6}><Text strong>收入：</Text></Col>
          <Col span={9}>
            <InputNumber
              value={project.plannedRevenue}
              disabled
              style={{ width: '100%', background: '#f5f5f5' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
          <Col span={9}>
            <InputNumber
              value={project.actualRevenue}
              onChange={(v) => onChange('actualRevenue', v || 0)}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number(v?.replace(/,/g, '') || 0)}
            />
          </Col>

          <Col span={6}><Text strong>支出：</Text></Col>
          <Col span={9}>
            <InputNumber
              value={project.plannedExpense}
              disabled
              style={{ width: '100%', background: '#f5f5f5' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
          <Col span={9}>
            <InputNumber
              value={project.actualExpense}
              onChange={(v) => onChange('actualExpense', v || 0)}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number(v?.replace(/,/g, '') || 0)}
            />
          </Col>

          <Col span={6}><Text strong>損益：</Text></Col>
          <Col span={9}>
            <InputNumber
              value={(project.plannedRevenue || 0) - (project.plannedExpense || 0)}
              disabled
              style={{ width: '100%', background: '#f5f5f5' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
          <Col span={9}>
            <InputNumber
              value={actualProfit}
              disabled
              style={{ width: '100%', background: '#f5f5f5' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
        </Row>
      </Card>

      {/* 問題與改善 */}
      <Card title="專案推進中發生的問題" size="small" style={{ marginBottom: 16 }}>
        <TextArea
          rows={4}
          placeholder="推進過程中發生的問題..."
        />
      </Card>

      <Card title="問題改善對策" size="small" style={{ marginBottom: 16 }}>
        <TextArea
          rows={4}
          placeholder="問題改善對策..."
        />
      </Card>

      <Card title="專案反思與學習" size="small" style={{ marginBottom: 16 }}>
        <TextArea
          rows={4}
          placeholder="專案反思與學習..."
        />
      </Card>

      <Card title="客戶評價" size="small">
        <TextArea
          rows={4}
          placeholder="客戶評價..."
        />
      </Card>
    </div>
  );
}
