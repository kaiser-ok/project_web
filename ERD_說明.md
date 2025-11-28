# 專案管理系統 - ERD 資料庫關聯圖說明

## 資料表關聯架構

```
┌─────────────────┐
│     users       │
│   (用戶表)      │
├─────────────────┤
│ PK id           │
│    username     │
│    email        │
│    password     │
│    full_name    │
│    role         │
└────────┬────────┘
         │
         │ created_by / updated_by
         │ (1對多)
         ↓
┌─────────────────────────────┐
│        projects             │
│       (專案主表)            │
├─────────────────────────────┤
│ PK id                       │
│    project_code (unique)    │
│    project_name             │
│    client_name              │
│    project_overview         │
│    project_type             │
│                             │
│ 價值與目標:                 │
│    value_proposition        │
│    problem_to_solve         │
│    experience_provided      │
│                             │
│ 財務 (計劃):                │
│    planned_revenue          │
│    planned_expense          │
│    planned_profit (計算欄)  │
│    planned_profit_rate      │
│                             │
│ 財務 (實際):                │
│    actual_revenue           │
│    actual_expense           │
│    actual_profit (計算欄)   │
│    actual_profit_rate       │
│                             │
│ 時程:                       │
│    planned_start_date       │
│    planned_end_date         │
│    actual_start_date        │
│    actual_end_date          │
│    planned_duration_months  │
│                             │
│ 狀態:                       │
│    status                   │
│    progress                 │
│                             │
│ 審查:                       │
│    review_result            │
│    review_date              │
│    reviewer                 │
│    review_notes             │
│                             │
│ 其他:                       │
│    attachments (JSONB)      │
│    notes                    │
│    search_vector            │
│ FK created_by → users.id    │
│ FK updated_by → users.id    │
│    created_at               │
│    updated_at               │
│    deleted_at               │
└──────────┬──────────────────┘
           │
           │ (1對多)
           ├──────────────────────────────────────────────┐
           │                                              │
           │                                              │
           ↓                                              ↓
┌─────────────────────────┐                   ┌──────────────────────────┐
│   project_members       │                   │        tasks             │
│    (專案成員表)         │                   │       (任務表)           │
├─────────────────────────┤                   ├──────────────────────────┤
│ PK id                   │                   │ PK id                    │
│ FK project_id           │                   │ FK project_id            │
│    role                 │                   │    task_name             │
│    role_number          │                   │    description           │
│    member_name          │                   │    task_order            │
│ FK user_id → users.id   │                   │    assigned_to           │
│    class_level          │                   │ FK assigned_member_id    │
│                         │                   │    planned_duration      │
│    planned_hours        │                   │    planned_start_date    │
│    actual_hours         │                   │    planned_end_date      │
│                         │                   │    actual_duration       │
│    capability_improve   │                   │    actual_start_date     │
│    is_active            │                   │    actual_end_date       │
│    created_at           │                   │    status                │
│    updated_at           │                   │    progress              │
└──────────┬──────────────┘                   │ FK depends_on (自關聯)   │
           │                                  │    notes                 │
           │ (1對多)                          │    created_at            │
           │                                  │    updated_at            │
           │                                  └────────┬─────────────────┘
           │                                           │
           │                                           │ (1對多)
           │                                           │
           ↓                                           ↓
┌─────────────────────────┐            ┌─────────────────────────────┐
│    monthly_hours        │            │     gantt_timeline          │
│    (月度工時表)         │            │    (甘特圖時間軸)           │
├─────────────────────────┤            ├─────────────────────────────┤
│ PK id                   │            │ PK id                       │
│ FK project_id           │            │ FK task_id                  │
│ FK member_id            │            │    year_month               │
│    year_month           │            │    is_planned               │
│                         │            │    is_active                │
│    planned_hours        │            │    completion_percentage    │
│    actual_hours         │            │    notes                    │
│    notes                │            │    created_at               │
│    created_at           │            │    updated_at               │
│    updated_at           │            └─────────────────────────────┘
└─────────────────────────┘

           projects (續)
              │
              │ (1對多)
              ├────────────────────────────────────────┐
              │                                        │
              ↓                                        ↓
┌──────────────────────────┐          ┌─────────────────────────────┐
│  monthly_financials      │          │    project_reports          │
│   (月度財務表)           │          │     (專案報告表)            │
├──────────────────────────┤          ├─────────────────────────────┤
│ PK id                    │          │ PK id                       │
│ FK project_id            │          │ FK project_id               │
│    year_month            │          │    report_type              │
│                          │          │    report_date              │
│ 計劃:                    │          │                             │
│    planned_revenue       │          │    value_created            │
│    planned_expense       │          │    problems_encountered     │
│    planned_profit (計算) │          │    improvement_measures     │
│    planned_profit_rate   │          │    lessons_learned          │
│                          │          │                             │
│ 實際:                    │          │    customer_feedback        │
│    actual_revenue        │          │    customer_satisfaction    │
│    actual_expense        │          │    schedule_assessment      │
│    actual_profit (計算)  │          │    cost_assessment          │
│    actual_profit_rate    │          │    organizational_improve   │
│                          │          │                             │
│    notes                 │          │    attachments (JSONB)      │
│    created_at            │          │ FK created_by → users.id    │
│    updated_at            │          │ FK updated_by → users.id    │
└──────────────────────────┘          │    created_at               │
                                      │    updated_at               │
                                      └─────────────────────────────┘
```

---

## 資料表關聯說明

### 1. users ↔ projects (1對多)
- 一個用戶可以創建/更新多個專案
- 每個專案記錄創建者和更新者

### 2. projects ↔ project_members (1對多)
- 一個專案可以有多個成員
- 每個成員屬於一個專案
- 成員可以關聯到 users 表（如果是系統用戶）

### 3. projects ↔ tasks (1對多)
- 一個專案可以有多個任務
- 每個任務屬於一個專案
- 任務可以指派給專案成員

### 4. tasks ↔ gantt_timeline (1對多)
- 一個任務可以有多個月份的時間軸記錄
- 用於生成甘特圖

### 5. tasks ↔ tasks (自關聯)
- 任務可以依賴其他任務（depends_on）
- 形成任務依賴樹

### 6. project_members ↔ monthly_hours (1對多)
- 一個成員可以有多個月份的工時記錄
- 記錄計劃工時和實際工時

### 7. projects ↔ monthly_financials (1對多)
- 一個專案可以有多個月份的財務記錄
- 記錄每月收入、支出、利潤

### 8. projects ↔ project_reports (1對多)
- 一個專案可以有多個報告（計劃、中期、最終）
- 記錄專案的價值、問題、改善、學習

---

## 關鍵設計特點

### 1. 計算欄位（Generated Columns）
- `planned_profit` = `planned_revenue` - `planned_expense`
- `actual_profit` = `actual_revenue` - `actual_expense`
- `planned_profit_rate` = `planned_profit` / `planned_revenue`
- `actual_profit_rate` = `actual_profit` / `actual_revenue`

這些欄位自動計算，無需手動維護。

### 2. 軟刪除（Soft Delete）
- `projects` 表有 `deleted_at` 欄位
- 刪除時設置時間戳而非真正刪除
- 方便資料恢復和審計

### 3. 全文搜索（Full-Text Search）
- `projects` 表有 `search_vector` 欄位
- 自動更新觸發器
- 支援快速搜索專案

### 4. 審計欄位（Audit Columns）
- 所有表都有 `created_at` 和 `updated_at`
- 重要表有 `created_by` 和 `updated_by`
- 自動更新觸發器

### 5. JSONB 欄位
- `attachments`：儲存附件清單
- 靈活存儲非結構化資料
- 支援 JSON 查詢

---

## 索引策略

### 1. 主鍵索引（自動）
- 所有表的 `id` 欄位

### 2. 外鍵索引
- 所有外鍵欄位都建立索引
- 加速 JOIN 查詢

### 3. 查詢索引
- 常用查詢欄位（status, dates, etc.）
- 複合索引（project_id + year_month）

### 4. 全文搜索索引
- GIN 索引在 search_vector 上

---

## 視圖（Views）

### v_project_summary
專案摘要視圖，包含：
- 基本資訊
- 任務統計
- 成員統計
- 工時統計

### v_gantt_chart
甘特圖視圖，用於前端渲染

### v_monthly_financials_summary
月度財務匯總視圖，包含差異分析

---

## 資料完整性

### 1. 外鍵約束
- `ON DELETE CASCADE`：子記錄隨父記錄刪除
- `ON DELETE SET NULL`：設為 NULL

### 2. CHECK 約束
- progress: 0-100
- customer_satisfaction: 1-5

### 3. UNIQUE 約束
- project_code
- (project_id, role, role_number)
- (project_id, year_month)
- (task_id, year_month, is_planned)

---

## 效能考量

### 1. 索引優化
- 為常用查詢建立索引
- 避免過度索引

### 2. 分區（未實現，但可考慮）
- 按年份分區 monthly_financials
- 按年份分區 monthly_hours

### 3. 快取策略
- 專案摘要適合快取
- 月度資料適合快取

---

## 擴展性

### 1. 可添加的表
- `comments`：評論表
- `notifications`：通知表
- `activity_logs`：活動日誌
- `templates`：專案範本
- `tags`：標籤表
- `files`：文件表

### 2. 可添加的欄位
- `projects.priority`：優先級
- `tasks.estimated_hours`：預估工時
- `tasks.actual_hours`：實際工時
- 更多自訂欄位

---

## 安全性

### 1. 密碼加密
- 使用 bcrypt 或 argon2
- 不存儲明文密碼

### 2. SQL 注入防護
- 使用參數化查詢
- ORM 自動處理

### 3. 權限控制
- 基於角色的訪問控制（RBAC）
- Row-level security（可選）

---

## 遷移策略

### 從 Excel 到資料庫
1. 解析 Excel 檔案
2. 提取專案基本資訊 → `projects`
3. 提取成員資訊 → `project_members`
4. 提取任務資訊 → `tasks`
5. 提取月度財務 → `monthly_financials`
6. 提取月度工時 → `monthly_hours`
7. 生成甘特圖時間軸 → `gantt_timeline`

---

## 範例查詢

### 查詢專案總收入
```sql
SELECT
  p.project_name,
  SUM(mf.actual_revenue) as total_revenue
FROM projects p
LEFT JOIN monthly_financials mf ON p.id = mf.project_id
GROUP BY p.id, p.project_name;
```

### 查詢成員總工時
```sql
SELECT
  pm.member_name,
  pm.role,
  SUM(mh.actual_hours) as total_hours
FROM project_members pm
LEFT JOIN monthly_hours mh ON pm.id = mh.member_id
WHERE pm.project_id = 1
GROUP BY pm.id, pm.member_name, pm.role;
```

### 查詢任務完成率
```sql
SELECT
  p.project_name,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  ROUND(
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as completion_rate
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.project_name;
```

---

## 總結

這個資料庫設計：

✅ 完整對應 Excel 結構
✅ 支援擴展和修改
✅ 考慮效能和安全性
✅ 包含必要的索引和約束
✅ 提供實用的視圖
✅ 支援軟刪除和審計
✅ 使用現代 PostgreSQL 特性

可以直接使用 `database_schema.sql` 來建立資料庫！
