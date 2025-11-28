-- ============================================================================
-- Migration: 新增使用者預設時薪欄位
-- 日期: 2025-11-28
-- 說明: 為 users 表新增 hourly_rate 欄位，用於成本計算
-- ============================================================================

-- 新增 hourly_rate 欄位
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT NULL;

-- 新增欄位註解
COMMENT ON COLUMN users.hourly_rate IS '預設時薪（用於成本計算）';

-- 驗證
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'hourly_rate';
