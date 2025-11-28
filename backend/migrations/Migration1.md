# Migration 1: 新增專案成本管理功能

**日期**: 2025-11-28
**版本**: v1.1.0
**功能**: UC-15 管理專案非人力成本

## 概述

新增專案非人力成本管理功能，包含設備費用、消耗品、交通費及其他成本的記錄與統計。

## 資料庫變更

### 1. 新增資料表：project_cost_items

用於記錄專案的非人力成本項目。

#### 表格結構

```sql
CREATE TABLE project_cost_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  date DATE NOT NULL,
  month VARCHAR(7) NOT NULL,
  category enum_project_cost_items_category NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(255),
  invoice_no VARCHAR(100),
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### 欄位說明

| 欄位名稱 | 資料類型 | 約束 | 說明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | 主鍵 |
| project_id | INTEGER | NOT NULL, FK | 專案ID，外鍵關聯 projects(id) |
| date | DATE | NOT NULL | 成本發生日 |
| month | VARCHAR(7) | NOT NULL | 對應月份 YYYY-MM |
| category | ENUM | NOT NULL | 成本類別：EQUIPMENT/CONSUMABLE/TRAVEL/OTHER |
| amount | DECIMAL(15,2) | NOT NULL | 金額 |
| description | TEXT | NOT NULL | 說明 |
| vendor | VARCHAR(255) | NULL | 供應商 |
| invoice_no | VARCHAR(100) | NULL | 單據編號 |
| created_by | INTEGER | NULL | 建立者 |
| updated_by | INTEGER | NULL | 更新者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 建立時間 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 更新時間 |

### 2. 新增 ENUM 類型

```sql
CREATE TYPE enum_project_cost_items_category AS ENUM(
  'EQUIPMENT',   -- 設備費用
  'CONSUMABLE',  -- 消耗品
  'TRAVEL',      -- 交通費
  'OTHER'        -- 其他
);
```

### 3. 索引

```sql
CREATE INDEX idx_project_cost_items_project_id ON project_cost_items(project_id);
CREATE INDEX idx_project_cost_items_date ON project_cost_items(date);
CREATE INDEX idx_project_cost_items_month ON project_cost_items(month);
CREATE INDEX idx_project_cost_items_category ON project_cost_items(category);
```

### 4. 註解

```sql
COMMENT ON TABLE project_cost_items IS '專案非人力成本項目';
COMMENT ON COLUMN project_cost_items.date IS '成本發生日';
COMMENT ON COLUMN project_cost_items.month IS '對應月份 YYYY-MM';
COMMENT ON COLUMN project_cost_items.amount IS '金額';
COMMENT ON COLUMN project_cost_items.description IS '說明';
COMMENT ON COLUMN project_cost_items.vendor IS '供應商';
COMMENT ON COLUMN project_cost_items.invoice_no IS '單據編號';
```

## 執行方式

### 方法 1: 使用遷移腳本（推薦）

```bash
cd backend
node scripts/create-cost-items-table.js
```

### 方法 2: 直接執行 SQL

```bash
psql -U postgres -d project_web -f migrations/001_create_cost_items_table.sql
```

## 驗證

執行以下 SQL 確認表格已建立：

```sql
-- 檢查表格是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'project_cost_items';

-- 檢查 ENUM 類型是否存在
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'enum_project_cost_items_category';

-- 檢查索引
SELECT indexname
FROM pg_indexes
WHERE tablename = 'project_cost_items';
```

## 相關檔案

### 後端

- **模型**: `backend/src/models/ProjectCostItem.ts`
- **路由**: `backend/src/routes/cost.routes.ts`
- **遷移腳本**: `backend/scripts/create-cost-items-table.js`

### 前端

- **組件**: `frontend/src/components/project/ProjectManagementTab.tsx`
  - 新增成本管理區塊
  - 成本統計卡片
  - 成本列表與篩選
  - 新增/編輯成本 Modal

## API 端點

### GET /api/costs/project/:projectId
獲取專案的成本項目列表

**查詢參數**:
- `category` (optional): 篩選類別 (EQUIPMENT, CONSUMABLE, TRAVEL, OTHER)
- `startDate` (optional): 起始日期 (YYYY-MM-DD)
- `endDate` (optional): 結束日期 (YYYY-MM-DD)

### GET /api/costs/project/:projectId/summary
獲取專案的成本摘要（按類別分組）

### POST /api/costs
新增成本項目

**請求體**:
```json
{
  "projectId": 1,
  "date": "2025-11-28",
  "category": "EQUIPMENT",
  "amount": 50000,
  "description": "購買開發設備",
  "vendor": "ABC公司",
  "invoiceNo": "INV-2025-001"
}
```

### PUT /api/costs/:id
更新成本項目

### DELETE /api/costs/:id
刪除成本項目

## 注意事項

1. **Sequelize 同步問題**:
   - 由於 Sequelize 在處理 ENUM 類型時會產生無效的 SQL（將 COMMENT 和 USING 放在同一語句中）
   - 因此暫時停用 `sequelize.sync({ alter: true })`
   - 改為手動執行遷移腳本創建表格
   - 相關代碼位於 `backend/src/server.ts:93-99`

2. **外鍵約束**:
   - `project_id` 設定為 `ON DELETE CASCADE`，刪除專案時會自動刪除相關成本項目

3. **month 欄位**:
   - 自動從 `date` 計算得出，格式為 YYYY-MM
   - 用於按月份統計和篩選

## 回滾

如需回滾此次變更：

```sql
-- 刪除表格
DROP TABLE IF EXISTS project_cost_items CASCADE;

-- 刪除 ENUM 類型
DROP TYPE IF EXISTS enum_project_cost_items_category;
```

## 測試清單

- [ ] 成功創建資料表
- [ ] 可以新增成本項目
- [ ] 可以編輯成本項目
- [ ] 可以刪除成本項目
- [ ] 按類別篩選正常運作
- [ ] 按日期範圍篩選正常運作
- [ ] 成本摘要計算正確
- [ ] 前端統計卡片顯示正確
- [ ] 刪除專案時相關成本項目被級聯刪除

## 參考文件

- **需求文件**: `usecase.md` - UC-15
- **資料庫設計**: 本文件
- **API 文件**: `backend/src/routes/cost.routes.ts`
