-- ============================================================================
-- 資料庫初始化腳本
-- 這個腳本會建立資料庫和基本權限
-- ============================================================================

-- 建立資料庫
CREATE DATABASE project_management;

-- 連接到資料庫
\c project_management;

-- 建立擴展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 賦予權限（根據需要調整用戶名）
-- GRANT ALL PRIVILEGES ON DATABASE project_management TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 顯示確認訊息
SELECT 'Database project_management created successfully!' as message;
