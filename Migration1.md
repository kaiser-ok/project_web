# 資料庫 Migration 記錄

## Migration 001: 新增使用者預設時薪欄位

**日期**: 2025-11-28

**檔案**: `backend/src/db/migrations/001_add_user_hourly_rate.sql`

### 說明
為 Users 表新增 `hourly_rate` 欄位，用於記錄使用者的預設時薪，方便在專案中計算人力成本。

### 欄位規格
| 欄位 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| hourly_rate | DECIMAL(10,2) | NULL | 預設時薪（用於成本計算） |

### SQL 內容
```sql
-- 新增 hourly_rate 欄位
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT NULL;

-- 新增欄位註解
COMMENT ON COLUMN users.hourly_rate IS '預設時薪（用於成本計算）';
```

### 執行方式
```bash
# 連接到 PostgreSQL 後執行
psql -d project_management -f backend/src/db/migrations/001_add_user_hourly_rate.sql
```

### 影響的 API
- `POST /api/users/invite` - 支援 `hourlyRate` 參數
- `PUT /api/users/:id` - 支援更新 `hourlyRate`
- `GET /api/users` - 回傳包含 `hourlyRate`
- `GET /api/users/:id` - 回傳包含 `hourlyRate`

### 相關 Use Case
- UC-12: 管理組織成員（Admin）
