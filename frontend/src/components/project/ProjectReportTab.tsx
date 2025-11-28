import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Row,
  Col,
  Input,
  InputNumber,
  Typography,
  DatePicker,
  Select,
  Space,
  Button,
  message,
  Spin,
  Alert,
  Divider,
  Table,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProjectData } from '../../pages/ProjectDetailPage';
import api from '../../lib/axios';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface Props {
  project: ProjectData;
  onChange: (field: keyof ProjectData, value: any) => void;
}

interface ProjectReport {
  id?: number;
  projectId: number;
  reportType: 'planning' | 'interim' | 'final';
  reportDate: string;

  // Goal
  goalValueCreated?: string;
  goalProblemSolved?: string;

  // Approach
  approachMethod?: string;
  approachFutureImprovements?: string;

  // Resource
  resourceScheduleAssessment?: string;
  resourceCostAssessment?: string;
  resourceWorkHourAssessment?: string;

  // Feedback
  organizationalImprovement?: string;
  knowledgeAccumulation?: string;
}

interface CostSummary {
  EQUIPMENT: number;
  CONSUMABLE: number;
  TRAVEL: number;
  OTHER: number;
  total: number;
}

export default function ProjectReportTab({ project, onChange }: Props) {
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [costSummary, setCostSummary] = useState<CostSummary>({
    EQUIPMENT: 0,
    CONSUMABLE: 0,
    TRAVEL: 0,
    OTHER: 0,
    total: 0,
  });

  useEffect(() => {
    if (project.id) {
      fetchReport();
      fetchCostSummary();
    }
  }, [project.id]);

  const fetchCostSummary = async () => {
    try {
      const response = await api.get(`/costs/project/${project.id}/summary`);
      const summary = response.data?.data || {
        EQUIPMENT: 0,
        CONSUMABLE: 0,
        TRAVEL: 0,
        OTHER: 0,
        total: 0,
      };
      setCostSummary(summary);
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/project/${project.id}`);
      const reports = response.data.data || response.data || [];

      if (reports.length > 0) {
        setReport(reports[0]);
      } else {
        setReport({
          projectId: project.id!,
          reportType: 'final',
          reportDate: dayjs().format('YYYY-MM-DD')
        });
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setReport({
        projectId: project.id!,
        reportType: 'final',
        reportDate: dayjs().format('YYYY-MM-DD')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;

    try {
      setSaving(true);
      if (report.id) {
        await api.put(`/reports/${report.id}`, report);
        message.success('報告已儲存');
      } else {
        const response = await api.post('/reports', report);
        const newReport = response.data.data || response.data;
        setReport(newReport);
        message.success('報告已建立');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const updateReport = (field: keyof ProjectReport, value: any) => {
    if (!report) return;
    setReport({ ...report, [field]: value });
  };

  const actualProfit = (project.actualRevenue || 0) - (project.actualExpense || 0);
  const plannedProfit = (project.plannedRevenue || 0) - (project.plannedExpense || 0);
  const actualProfitRate = project.actualRevenue ? ((actualProfit / project.actualRevenue) * 100).toFixed(1) : 0;
  const plannedProfitRate = project.plannedRevenue ? ((plannedProfit / project.plannedRevenue) * 100).toFixed(1) : 0;

  const hasDateVariance = project.plannedStartDate !== project.actualStartDate ||
                          project.plannedEndDate !== project.actualEndDate;

  const hasFinancialVariance = project.plannedRevenue !== project.actualRevenue ||
                               project.plannedExpense !== project.actualExpense;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <Alert message="無法載入報告" type="error" />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <Card
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Text strong>報告類型：</Text>
              <Select
                value={report.reportType}
                onChange={(v) => updateReport('reportType', v)}
                style={{ width: 150 }}
              >
                <Select.Option value="planning">計劃報告</Select.Option>
                <Select.Option value="interim">中期報告</Select.Option>
                <Select.Option value="final">最終報告</Select.Option>
              </Select>
              <Text strong style={{ marginLeft: 16 }}>報告日期：</Text>
              <DatePicker
                value={report.reportDate ? dayjs(report.reportDate) : null}
                onChange={(date) => updateReport('reportDate', date?.format('YYYY-MM-DD'))}
              />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveReport}
              loading={saving}
            >
              儲存報告
            </Button>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="goal"
        size="large"
        items={[
          {
            key: 'goal',
            label: 'Goal（目標）',
            children: (
              <div style={{ maxWidth: 1000 }}>
                {/* 1. 價值創造與顧客滿意度 */}
                <Card title="透過專案創造的價值與顧客滿意度為何？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.goalValueCreated}
                    onChange={(e) => updateReport('goalValueCreated', e.target.value)}
                    placeholder="請記載透過專案創造的價值與顧客滿意度..."
                  />
                </Card>

                {/* 2. 問題解決 */}
                <Card title="專案中進行了什麼問題解決？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.goalProblemSolved}
                    onChange={(e) => updateReport('goalProblemSolved', e.target.value)}
                    placeholder="請記載專案中進行的問題解決..."
                  />
                </Card>
              </div>
            )
          },
          {
            key: 'approach',
            label: 'Approach（方法）',
            children: (
              <div style={{ maxWidth: 1000 }}>
                {/* 1. 顧客體驗 */}
                <Card title="透過什麼樣的經驗・體驗來提供顧客滿意度？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.approachMethod}
                    onChange={(e) => updateReport('approachMethod', e.target.value)}
                    placeholder="請記載透過什麼樣的經驗・體驗來提供顧客滿意度..."
                  />
                </Card>

                {/* 2. 反思與改進 */}
                <Card title="要做出更好的專案，應該怎麼做？下一個專案想要進一步處理的事項是什麼？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.approachFutureImprovements}
                    onChange={(e) => updateReport('approachFutureImprovements', e.target.value)}
                    placeholder="請記載要做出更好的專案應該怎麼做，以及下一個專案想要進一步處理的事項..."
                  />
                </Card>
              </div>
            )
          },
          {
            key: 'resource',
            label: 'Resource（資源）',
            children: (
              <div style={{ maxWidth: 1000 }}>

                {/* 1. 工時評估 */}
                <Card title="工時評估（計劃 vs 實績）" size="small" style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={[
                      {
                        key: '1',
                        role: '總計',
                        planned: project.totalPlannedHours || 0,
                        actual: project.totalActualHours || 0,
                      }
                    ]}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: '角色',
                        dataIndex: 'role',
                        key: 'role',
                        width: 150,
                      },
                      {
                        title: '計劃工時（小時）',
                        dataIndex: 'planned',
                        key: 'planned',
                        width: 150,
                        render: (v: number) => v.toFixed(1),
                      },
                      {
                        title: '實際工時（小時）',
                        dataIndex: 'actual',
                        key: 'actual',
                        width: 150,
                        render: (v: number) => v.toFixed(1),
                      },
                      {
                        title: '差異',
                        key: 'variance',
                        render: (_: any, record: any) => {
                          const variance = record.actual - record.planned;
                          return (
                            <Text type={variance > 0 ? 'danger' : variance < 0 ? 'success' : undefined}>
                              {variance > 0 ? '+' : ''}{variance.toFixed(1)}
                            </Text>
                          );
                        },
                      },
                    ]}
                  />

                  <Divider />

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>工時的「計劃」與「實績」若有不同，原因為何？</Text>
                    <TextArea
                      rows={3}
                      value={report.resourceWorkHourAssessment}
                      onChange={(e) => updateReport('resourceWorkHourAssessment', e.target.value)}
                      placeholder="請記載工時的差異原因..."
                    />
                  </Space>
                </Card>

                {/* 2. 收益與成本評估 */}
                <Card title="是否獲得符合價值的收益？成本是否最佳？" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
                    <Col span={6}><Text strong>項目</Text></Col>
                    <Col span={9}><Text strong>計劃</Text></Col>
                    <Col span={9}><Text strong>實績</Text></Col>

                    <Col span={6}><Text>①收入</Text></Col>
                    <Col span={9}>
                      <InputNumber
                        value={project.plannedRevenue}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>
                    <Col span={9}>
                      <InputNumber
                        value={project.actualRevenue}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>

                    <Col span={6}><Text>②支出</Text></Col>
                    <Col span={9}>
                      <InputNumber
                        value={project.plannedExpense}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>
                    <Col span={9}>
                      <InputNumber
                        value={project.actualExpense}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>

                    <Col span={6}><Text>③損益（①-②）</Text></Col>
                    <Col span={9}>
                      <InputNumber
                        value={plannedProfit}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>
                    <Col span={9}>
                      <InputNumber
                        value={actualProfit}
                        disabled
                        style={{
                          width: '100%',
                          background: '#f5f5f5',
                          color: actualProfit >= 0 ? '#52c41a' : '#ff4d4f'
                        }}
                        formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Col>

                    <Col span={6}><Text>④利益率（③/①）</Text></Col>
                    <Col span={9}>
                      <Input
                        value={`${plannedProfitRate}%`}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>
                    <Col span={9}>
                      <Input
                        value={`${actualProfitRate}%`}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>
                  </Row>

                  {hasFinancialVariance && (
                    <Alert
                      message="計劃與實績數據不同"
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>①～④的「計劃」與「實績」若有不同，原因為何？</Text>
                    <TextArea
                      rows={3}
                      value={report.resourceCostAssessment}
                      onChange={(e) => updateReport('resourceCostAssessment', e.target.value)}
                      placeholder="請記載收入、支出、損益、利益率的差異原因..."
                    />
                  </Space>
                </Card>

                {/* 2-2. 非人力成本明細 */}
                {costSummary.total > 0 && (
                  <Card title="非人力成本明細" size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 8]}>
                      <Col span={12}><Text strong>類別</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><Text strong>金額</Text></Col>

                      <Col span={12}><Text>設備費用</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text>¥ {costSummary.EQUIPMENT.toLocaleString()}</Text>
                      </Col>

                      <Col span={12}><Text>消耗品</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text>¥ {costSummary.CONSUMABLE.toLocaleString()}</Text>
                      </Col>

                      <Col span={12}><Text>交通費</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text>¥ {costSummary.TRAVEL.toLocaleString()}</Text>
                      </Col>

                      <Col span={12}><Text>其他</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text>¥ {costSummary.OTHER.toLocaleString()}</Text>
                      </Col>

                      <Col span={24}><Divider style={{ margin: '12px 0' }} /></Col>

                      <Col span={12}><Text strong>非人力成本合計</Text></Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                          ¥ {costSummary.total.toLocaleString()}
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* 3. 納期評估 */}
                <Card title="交期是否最佳？" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
                    <Col span={8}></Col>
                    <Col span={8}><Text strong>計劃</Text></Col>
                    <Col span={8}><Text strong>實績</Text></Col>

                    <Col span={8}><Text>開始日期</Text></Col>
                    <Col span={8}>
                      <DatePicker
                        value={project.plannedStartDate ? dayjs(project.plannedStartDate) : null}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>
                    <Col span={8}>
                      <DatePicker
                        value={project.actualStartDate ? dayjs(project.actualStartDate) : null}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>

                    <Col span={8}><Text>結束日期</Text></Col>
                    <Col span={8}>
                      <DatePicker
                        value={project.plannedEndDate ? dayjs(project.plannedEndDate) : null}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>
                    <Col span={8}>
                      <DatePicker
                        value={project.actualEndDate ? dayjs(project.actualEndDate) : null}
                        disabled
                        style={{ width: '100%', background: '#f5f5f5' }}
                      />
                    </Col>
                  </Row>

                  {hasDateVariance && (
                    <Alert
                      message="計劃與實績日期不同"
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>交期的「計劃」與「實績」若有不同，原因為何？</Text>
                    <TextArea
                      rows={3}
                      value={report.resourceScheduleAssessment}
                      onChange={(e) => updateReport('resourceScheduleAssessment', e.target.value)}
                      placeholder="請記載交期的差異原因..."
                    />
                  </Space>
                </Card>
              </div>
            )
          },
          {
            key: 'feedback',
            label: 'Feedback（反饋）',
            children: (
              <div style={{ maxWidth: 1000 }}>
                {/* 1. 能力提升 */}
                <Card title="透過專案，組織・個人的能力如何提升？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.organizationalImprovement}
                    onChange={(e) => updateReport('organizationalImprovement', e.target.value)}
                    placeholder="請記載透過專案，組織・個人的能力如何提升..."
                  />
                </Card>

                {/* 2. 知識累積 */}
                <Card title="是否累積了可在組織內廣泛應用的方法論或知識產權？" size="small" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={4}
                    value={report.knowledgeAccumulation}
                    onChange={(e) => updateReport('knowledgeAccumulation', e.target.value)}
                    placeholder="請記載是否累積了可在組織內廣泛應用的方法論或知識產權..."
                  />
                </Card>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
