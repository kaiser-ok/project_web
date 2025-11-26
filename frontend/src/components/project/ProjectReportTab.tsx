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
  Rate
} from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
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
  goalCustomerSatisfaction?: string;
  goalProblemSolved?: string;
  goalMetrics?: any;

  // Approach
  approachSolution?: string;
  approachMethod?: string;
  approachProblemsEncountered?: string;
  approachImprovementMeasures?: string;
  approachLessonsLearned?: string;
  approachBestPractices?: string;

  // Resource
  resourceTeamStructure?: any;
  resourceScheduleAssessment?: string;
  resourceCostAssessment?: string;
  resourceUtilization?: any;
  resourceConstraints?: string;

  // Feedback
  customerFeedback?: string;
  customerSatisfactionScore?: number;
  teamFeedback?: string;
  organizationalImprovement?: string;
}

export default function ProjectReportTab({ project, onChange }: Props) {
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [currentReport, setCurrentReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project.id) {
      fetchReports();
    }
  }, [project.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/project/${project.id}`);
      const fetchedReports = response.data.data || response.data || [];
      setReports(fetchedReports);

      // Load the first report if available, otherwise create a new one
      if (fetchedReports.length > 0) {
        setCurrentReport(fetchedReports[0]);
      } else {
        setCurrentReport({
          projectId: project.id!,
          reportType: 'final',
          reportDate: dayjs().format('YYYY-MM-DD')
        });
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // Initialize with a new report
      setCurrentReport({
        projectId: project.id!,
        reportType: 'final',
        reportDate: dayjs().format('YYYY-MM-DD')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!currentReport) return;

    try {
      setSaving(true);
      if (currentReport.id) {
        await api.put(`/reports/${currentReport.id}`, currentReport);
        message.success('報告已儲存');
      } else {
        const response = await api.post('/reports', currentReport);
        const newReport = response.data.data || response.data;
        setCurrentReport(newReport);
        message.success('報告已建立');
        fetchReports();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const updateReport = (field: keyof ProjectReport, value: any) => {
    if (!currentReport) return;
    setCurrentReport({ ...currentReport, [field]: value });
  };

  const actualProfit = (project.actualRevenue || 0) - (project.actualExpense || 0);
  const plannedProfit = (project.plannedRevenue || 0) - (project.plannedExpense || 0);

  // Calculate date variance
  const hasDateVariance = project.plannedStartDate !== project.actualStartDate ||
                          project.plannedEndDate !== project.actualEndDate;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentReport) {
    return (
      <Card>
        <Alert message="無法載入報告" type="error" />
      </Card>
    );
  }

  const tabItems = [
    {
      key: 'goal',
      label: 'Goal（目標）',
      children: (
        <div style={{ maxWidth: 1000 }}>
          <Card title="創造的價值・顧客滿足" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.goalValueCreated}
              onChange={(e) => updateReport('goalValueCreated', e.target.value)}
              placeholder="プロジェクトを通じて創出する価値・顧客満足を記載..."
            />
          </Card>

          <Card title="顧客滿足的內容" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.goalCustomerSatisfaction}
              onChange={(e) => updateReport('goalCustomerSatisfaction', e.target.value)}
              placeholder="顧客満足の内容を記載..."
            />
          </Card>

          <Card title="專案要解決的問題" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.goalProblemSolved}
              onChange={(e) => updateReport('goalProblemSolved', e.target.value)}
              placeholder="プロジェクトで行う問題解決を記載..."
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
          <Card title="解決方案" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.approachSolution}
              onChange={(e) => updateReport('approachSolution', e.target.value)}
              placeholder="解決方案的詳細說明..."
            />
          </Card>

          <Card title="執行方法・提供的體驗" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.approachMethod}
              onChange={(e) => updateReport('approachMethod', e.target.value)}
              placeholder="どのような経験・体験を通じて顧客満足を与えるか..."
            />
          </Card>

          <Card title="專案推進中發生的問題" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.approachProblemsEncountered}
              onChange={(e) => updateReport('approachProblemsEncountered', e.target.value)}
              placeholder="プロジェクト推進で生じた問題を記載..."
            />
          </Card>

          <Card title="問題的改善對策" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.approachImprovementMeasures}
              onChange={(e) => updateReport('approachImprovementMeasures', e.target.value)}
              placeholder="問題に対する改善策を記載..."
            />
          </Card>

          <Card title="專案的反思・學習" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.approachLessonsLearned}
              onChange={(e) => updateReport('approachLessonsLearned', e.target.value)}
              placeholder="プロジェクトの反省・学びを記載..."
            />
          </Card>

          <Card title="最佳實踐" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={3}
              value={currentReport.approachBestPractices}
              onChange={(e) => updateReport('approachBestPractices', e.target.value)}
              placeholder="本專案的最佳實踐與經驗分享..."
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
          {/* 納期評估 - 計劃 vs 實績 */}
          <Card title="納期評估（計劃 vs 實績）" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}></Col>
              <Col span={8}><Text strong>計劃（予定）</Text></Col>
              <Col span={8}><Text strong>實績</Text></Col>

              <Col span={8}><Text strong>開始日期：</Text></Col>
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

              <Col span={8}><Text strong>結束日期：</Text></Col>
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
                style={{ marginTop: 16 }}
              />
            )}

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>納期は最適だったか？</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                納期の「予定」と「実績」が異なった場合、原因は何か？評估專案時程是否合理，以及實際與計劃的差異原因。
              </Text>
              <TextArea
                rows={4}
                value={currentReport.resourceScheduleAssessment}
                onChange={(e) => updateReport('resourceScheduleAssessment', e.target.value)}
                placeholder="例：納期は概ね最適であった。ただし、要件定義フェーズで追加要望があり、計劃より2週間延長した。原因は初期のスコープ定義が不十分であったため..."
              />
            </Space>
          </Card>

          {/* 成本評估 - 計劃 vs 實績 */}
          <Card title="收益・成本評估（計劃 vs 實績）" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={6}></Col>
              <Col span={9}><Text strong>計劃（予定）</Text></Col>
              <Col span={9}><Text strong>實績</Text></Col>

              <Col span={6}><Text strong>收入：</Text></Col>
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

              <Col span={6}><Text strong>支出：</Text></Col>
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

              <Col span={6}><Text strong>損益：</Text></Col>
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
            </Row>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>価値に応じた収益が得られたか、コストは最適だったか？</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                評估收益是否符合創造的價值、成本控制是否合理、以及與計劃的差異原因。
              </Text>
              <TextArea
                rows={4}
                value={currentReport.resourceCostAssessment}
                onChange={(e) => updateReport('resourceCostAssessment', e.target.value)}
                placeholder="例：プロジェクトの価値に対して適切な収益を得られた。コストは計劃比で5%オーバーとなったが、追加機能の実装による付加価値を考慮すると妥当な範囲である..."
              />
            </Space>
          </Card>

          <Card title="資源限制" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={3}
              value={currentReport.resourceConstraints}
              onChange={(e) => updateReport('resourceConstraints', e.target.value)}
              placeholder="專案執行過程中遇到的資源限制..."
            />
          </Card>
        </div>
      )
    },
    {
      key: 'feedback',
      label: '反饋與評估',
      children: (
        <div style={{ maxWidth: 1000 }}>
          <Card title="客戶反饋" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>客戶滿意度評分：</Text>
                <Rate
                  value={currentReport.customerSatisfactionScore || 0}
                  onChange={(v) => updateReport('customerSatisfactionScore', v)}
                  style={{ marginLeft: 8 }}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({currentReport.customerSatisfactionScore || 0}/5)
                </Text>
              </div>
              <TextArea
                rows={4}
                value={currentReport.customerFeedback}
                onChange={(e) => updateReport('customerFeedback', e.target.value)}
                placeholder="お客様からの評価・フィードバックを記載..."
              />
            </Space>
          </Card>

          <Card title="團隊反饋" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.teamFeedback}
              onChange={(e) => updateReport('teamFeedback', e.target.value)}
              placeholder="團隊成員的反饋與建議..."
            />
          </Card>

          <Card title="組織・個人能力提升" size="small" style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              value={currentReport.organizationalImprovement}
              onChange={(e) => updateReport('organizationalImprovement', e.target.value)}
              placeholder="プロジェクトを通じて組織・個人の能力はどのように向上したか..."
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Text strong>報告類型：</Text>
              <Select
                value={currentReport.reportType}
                onChange={(v) => updateReport('reportType', v)}
                style={{ width: 150 }}
              >
                <Select.Option value="planning">計劃報告</Select.Option>
                <Select.Option value="interim">中期報告</Select.Option>
                <Select.Option value="final">最終報告</Select.Option>
              </Select>
              <Text strong style={{ marginLeft: 16 }}>報告日期：</Text>
              <DatePicker
                value={currentReport.reportDate ? dayjs(currentReport.reportDate) : null}
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

      <Tabs items={tabItems} size="large" />
    </div>
  );
}
