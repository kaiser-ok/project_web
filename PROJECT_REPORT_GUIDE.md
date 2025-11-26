# 專案報告書功能說明

專案報告書功能已實現，參考 Excel「プロジェクト報告書」工作表的結構，並按照 Goal（目標）、Approach（方法）、Resource（資源）三大分類設計。

## 📋 資料結構

### 報告類型（reportType）

- `planning` - 計劃報告（專案開始前）
- `interim` - 中期報告（專案進行中）
- `final` - 最終報告（專案完成後）

### Goal（目標）

記錄專案目標和預期成果：

| 欄位 | 說明 | Excel 對應 |
|------|------|-----------|
| `goalValueCreated` | 創造的價值 | プロジェクトを通じて創出する価値・顧客満足は何か？ |
| `goalCustomerSatisfaction` | 顧客滿足內容 | 顧客満足の具体的な内容 |
| `goalProblemSolved` | 要解決的問題 | プロジェクトで行う問題解決は何か？ |
| `goalMetrics` | 目標達成指標 (JSON) | 量化指標 |

**範例資料（goalMetrics）：**
```json
{
  "revenueTarget": 180000,
  "customerSatisfactionTarget": 4.5,
  "deliveryOnTime": true,
  "qualityScore": 90
}
```

### Approach（方法）

記錄解決方案和執行方法：

| 欄位 | 說明 | Excel 對應 |
|------|------|-----------|
| `approachSolution` | 解決方案 | 採用的解決方案 |
| `approachMethod` | 執行方法 | どのような経験・体験を通じて顧客満足を与えるか？ |
| `approachProblemsEncountered` | 遇到的問題 | プロジェクト推進で生じた問題 |
| `approachImprovementMeasures` | 改善措施 | 問題に対する改善策 |
| `approachLessonsLearned` | 經驗教訓 | プロジェクトの反省・学び |
| `approachBestPractices` | 最佳實踐 | 可複製的方法論 |

**範例資料：**
```
approachSolution: "採用專業顧問團隊進行人事制度診斷與設計"
approachMethod: "透過工作坊、訪談、問卷等方式，全面了解現況並設計制度"
approachProblemsEncountered: "部分部門主管對新制度有疑慮"
approachImprovementMeasures: "增加溝通會議，說明制度優點與實施方式"
approachLessonsLearned: "需要提前做好利害關係人管理"
```

### Resource（資源）

記錄資源配置和評估：

| 欄位 | 說明 | Excel 對應 |
|------|------|-----------|
| `resourceTeamStructure` | 團隊結構 (JSON) | どのように人材・時間を投入するか？ |
| `resourceScheduleAssessment` | 時程評估 | 納期は最適だったか？ |
| `resourceCostAssessment` | 成本評估 | 価値に応じた収益が得られたか、コストは最適だったか？ |
| `resourceUtilization` | 資源利用率 (JSON) | 人力、時間、預算的使用情況 |
| `resourceConstraints` | 資源限制 | 遇到的資源限制 |

**範例資料（resourceTeamStructure）：**
```json
{
  "PPM": { "name": "周娴", "plannedHours": 26, "actualHours": 24 },
  "PM": { "name": "沈庆元", "plannedHours": 96, "actualHours": 102 },
  "CREW": [
    { "name": "王旭", "plannedHours": 96, "actualHours": 94 }
  ]
}
```

**範例資料（resourceUtilization）：**
```json
{
  "budgetUtilization": 0.95,
  "timeUtilization": 1.03,
  "teamUtilization": 0.98
}
```

### Feedback & Assessment（反饋與評估）

| 欄位 | 說明 | Excel 對應 |
|------|------|-----------|
| `customerFeedback` | 客戶反饋 | お客様からの評価 |
| `customerSatisfactionScore` | 客戶滿意度 (1-5) | 量化評分 |
| `teamFeedback` | 團隊反饋 | 團隊成員的回饋 |
| `organizationalImprovement` | 組織改善 | プロジェクトを通じて組織・個人の能力はどのように向上するか |

### 其他欄位

| 欄位 | 說明 |
|------|------|
| `reportDate` | 報告日期 |
| `attachments` | 附件 (JSON) |
| `createdBy` | 建立者 |
| `updatedBy` | 更新者 |

---

## 🔌 API 端點

### 1. 取得專案所有報告

```http
GET /api/reports/project/:projectId
Authorization: Bearer <token>
```

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 5,
      "reportType": "planning",
      "reportDate": "2024-01-15",
      "goalValueCreated": "提供專業人事制度設計支援",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "projectId": 5,
      "reportType": "interim",
      "reportDate": "2024-06-30",
      ...
    }
  ]
}
```

### 2. 取得專案報告摘要（最新的三種報告）

```http
GET /api/reports/project/:projectId/summary
Authorization: Bearer <token>
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "planning": { /* 最新的計劃報告 */ },
    "interim": { /* 最新的中期報告 */ },
    "final": { /* 最新的最終報告 */ }
  }
}
```

### 3. 取得單一報告

```http
GET /api/reports/:id
Authorization: Bearer <token>
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 5,
    "reportType": "planning",
    "reportDate": "2024-01-15",
    "goalValueCreated": "提供專業人事制度設計支援，協助企業建立完善的人才管理體系",
    "goalCustomerSatisfaction": "提升員工滿意度，降低人才流失率",
    "goalProblemSolved": "現有人事制度不完善，缺乏明確的晉升與薪酬標準",
    "goalMetrics": {
      "revenueTarget": 180000,
      "customerSatisfactionTarget": 4.5
    },
    "approachSolution": "採用業界最佳實踐，結合客戶現況設計",
    "approachMethod": "透過診斷、設計、實施三階段進行",
    "resourceTeamStructure": {
      "PPM": { "name": "周娴", "plannedHours": 26 },
      "PM": { "name": "沈庆元", "plannedHours": 96 }
    },
    "project": {
      "id": 5,
      "projectCode": "C2547-001",
      "projectName": "人事制度改善支援專案",
      "clientName": "株式会社サンプル"
    }
  }
}
```

### 4. 建立報告

```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": 5,
  "reportType": "planning",
  "reportDate": "2024-01-15",
  "goalValueCreated": "提供專業人事制度設計支援",
  "goalCustomerSatisfaction": "提升員工滿意度",
  "goalProblemSolved": "現有人事制度不完善",
  "goalMetrics": {
    "revenueTarget": 180000,
    "customerSatisfactionTarget": 4.5
  },
  "approachSolution": "採用業界最佳實踐",
  "approachMethod": "診斷、設計、實施三階段",
  "resourceTeamStructure": {
    "PPM": { "name": "周娴", "plannedHours": 26 },
    "PM": { "name": "沈庆元", "plannedHours": 96 }
  }
}
```

**權限：** manager, admin

### 5. 更新報告

```http
PUT /api/reports/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "approachProblemsEncountered": "部分部門主管對新制度有疑慮",
  "approachImprovementMeasures": "增加溝通會議",
  "customerFeedback": "對於新制度設計表示滿意",
  "customerSatisfactionScore": 4
}
```

**權限：** manager, admin

### 6. 刪除報告

```http
DELETE /api/reports/:id
Authorization: Bearer <token>
```

**權限：** admin

---

## 💡 使用場景

### 場景 1：專案啟動時建立計劃報告

```javascript
// 建立計劃報告
const planningReport = await api.post('/api/reports', {
  projectId: 5,
  reportType: 'planning',
  reportDate: '2024-01-15',

  // Goal
  goalValueCreated: '提供專業人事制度設計支援，協助企業建立完善的人才管理體系',
  goalCustomerSatisfaction: '提升員工滿意度，降低人才流失率',
  goalProblemSolved: '現有人事制度不完善，缺乏明確的晉升與薪酬標準',
  goalMetrics: {
    revenueTarget: 180000,
    customerSatisfactionTarget: 4.5,
    deliveryOnTime: true
  },

  // Approach
  approachSolution: '採用業界最佳實踐，結合客戶現況設計人事三大制度',
  approachMethod: '透過診斷、設計、實施三階段，確保制度符合企業需求',

  // Resource
  resourceTeamStructure: {
    PPM: { name: '周娴', plannedHours: 26 },
    PM: { name: '沈庆元', plannedHours: 96 },
    CREW: [{ name: '王旭', plannedHours: 96 }]
  },
  resourceScheduleAssessment: '8個月工期，符合客戶需求',
  resourceCostAssessment: '預算180,000元，無額外成本'
});
```

### 場景 2：專案中期更新報告

```javascript
// 取得中期報告（如果已存在）或建立新的
const reports = await api.get('/api/reports/project/5');
const interimReport = reports.data.data.find(r => r.reportType === 'interim');

if (interimReport) {
  // 更新現有報告
  await api.put(`/api/reports/${interimReport.id}`, {
    approachProblemsEncountered: `
      1. 部分部門主管對新制度有疑慮
      2. 員工對薪資調整標準有疑問
      3. 系統導入時程延遲
    `,
    approachImprovementMeasures: `
      1. 增加與主管的溝通會議
      2. 舉辦員工說明會
      3. 調整系統導入時程
    `,
    resourceUtilization: {
      budgetUtilization: 0.55,  // 已使用55%預算
      timeUtilization: 0.50,    // 已使用50%時間
      teamUtilization: 0.98     // 團隊負荷98%
    }
  });
} else {
  // 建立新的中期報告
  await api.post('/api/reports', {
    projectId: 5,
    reportType: 'interim',
    reportDate: new Date().toISOString().split('T')[0],
    ...
  });
}
```

### 場景 3：專案結束時建立最終報告

```javascript
// 建立最終報告
const finalReport = await api.post('/api/reports', {
  projectId: 5,
  reportType: 'final',
  reportDate: '2024-11-30',

  // Goal - 成果
  goalValueCreated: '成功建立完善的人事三大制度，包含等級、報酬、評價制度',
  goalMetrics: {
    revenueActual: 180000,
    customerSatisfactionActual: 4.5,
    deliveredOnTime: true,
    qualityScore: 92
  },

  // Approach - 執行過程
  approachProblemsEncountered: '部分主管初期有疑慮，員工對薪資標準有疑問',
  approachImprovementMeasures: '增加溝通會議，舉辦說明會',
  approachLessonsLearned: `
    1. 利害關係人管理很重要，需提前規劃
    2. 透明溝通可減少阻力
    3. 分階段實施效果更好
  `,
  approachBestPractices: `
    1. 診斷階段要深入訪談
    2. 設計階段要多次確認
    3. 實施階段要充分溝通
  `,

  // Resource - 資源使用
  resourceTeamStructure: {
    PPM: { name: '周娴', plannedHours: 26, actualHours: 24 },
    PM: { name: '沈庆元', plannedHours: 96, actualHours: 102 },
    CREW: [{ name: '王旭', plannedHours: 96, actualHours: 94 }]
  },
  resourceUtilization: {
    budgetUtilization: 1.0,   // 100%
    timeUtilization: 1.03,    // 103% (略微超時)
    teamUtilization: 0.98     // 98%
  },
  resourceScheduleAssessment: '專案準時完成，時程規劃適當',
  resourceCostAssessment: '預算控制良好，成本在預期範圍內',

  // Feedback
  customerFeedback: '客戶對新制度設計表示滿意，認為符合企業需求',
  customerSatisfactionScore: 5,
  teamFeedback: '團隊協作良好，學到很多人事制度設計經驗',
  organizationalImprovement: `
    1. PM 掌握了完整的人事制度設計方法論
    2. 團隊提升了利害關係人管理能力
    3. 建立了可複製的專案執行模式
  `
});
```

---

## 📊 前端整合建議

### 報告表單設計

建議按照三大分類分頁或分區塊：

```tsx
<Tabs defaultActiveKey="goal">
  <TabPane tab="Goal（目標）" key="goal">
    <Form.Item label="創造的價值" name="goalValueCreated">
      <TextArea rows={4} />
    </Form.Item>
    <Form.Item label="顧客滿足" name="goalCustomerSatisfaction">
      <TextArea rows={3} />
    </Form.Item>
    <Form.Item label="問題解決" name="goalProblemSolved">
      <TextArea rows={3} />
    </Form.Item>
    {/* ... */}
  </TabPane>

  <TabPane tab="Approach（方法）" key="approach">
    <Form.Item label="解決方案" name="approachSolution">
      <TextArea rows={4} />
    </Form.Item>
    <Form.Item label="執行方法" name="approachMethod">
      <TextArea rows={4} />
    </Form.Item>
    {/* ... */}
  </TabPane>

  <TabPane tab="Resource（資源）" key="resource">
    {/* 資源相關欄位 */}
  </TabPane>

  <TabPane tab="Feedback（反饋）" key="feedback">
    {/* 反饋評估欄位 */}
  </TabPane>
</Tabs>
```

### 報告檢視頁面

```tsx
<Card title={`${reportType}報告 - ${project.projectName}`}>
  <Descriptions column={1} bordered>
    <Descriptions.Item label="報告日期">
      {dayjs(reportDate).format('YYYY-MM-DD')}
    </Descriptions.Item>
  </Descriptions>

  <Divider orientation="left">Goal（目標）</Divider>
  <Descriptions column={1}>
    <Descriptions.Item label="創造的價值">
      {goalValueCreated}
    </Descriptions.Item>
    {/* ... */}
  </Descriptions>

  <Divider orientation="left">Approach（方法）</Divider>
  {/* ... */}

  <Divider orientation="left">Resource（資源）</Divider>
  {/* ... */}
</Card>
```

---

## ✅ 實現狀態

- ✅ 資料庫模型（ProjectReport）
- ✅ API 路由和控制器
- ✅ 關聯設定（Project ↔ ProjectReport）
- ✅ 活動日誌整合
- ✅ 權限控制（manager, admin）

---

## 📝 待辦事項（前端）

- [ ] 建立報告列表頁面
- [ ] 建立報告表單頁面（新增/編輯）
- [ ] 建立報告檢視頁面
- [ ] 整合到專案詳情頁面
- [ ] PDF 匯出功能（可選）

---

**相關文件：**
- 後端模型：`backend/src/models/ProjectReport.ts`
- 後端控制器：`backend/src/controllers/report.controller.ts`
- 後端路由：`backend/src/routes/report.routes.ts`
