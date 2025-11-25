-- ============================================================================
-- 專案管理系統 - 資料庫架構設計
-- Database: PostgreSQL 14+
-- Encoding: UTF-8
-- ============================================================================

-- 清理現有資料表（開發環境使用）
DROP TABLE IF EXISTS gantt_timeline CASCADE;
DROP TABLE IF EXISTS project_reports CASCADE;
DROP TABLE IF EXISTS monthly_hours CASCADE;
DROP TABLE IF EXISTS monthly_financials CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. 用戶表
-- ============================================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  full_name VARCHAR(200),
  role VARCHAR(50) DEFAULT 'member',          -- admin, manager, member, viewer

  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. 專案主表
-- ============================================================================
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,

  -- 基本資訊
  project_code VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  project_overview TEXT,
  project_type VARCHAR(100),                  -- Needs-in(顧客起点), Seeds-out(自社起点), etc.

  -- 價值與目標
  value_proposition TEXT,                     -- プロジェクトを通じて創出する価値・顧客満足
  problem_to_solve TEXT,                      -- プロジェクトで行う問題解決は何か
  experience_provided TEXT,                   -- どのような経験・体験を通じて顧客満足を与えるか

  -- 財務資訊 - 計劃
  planned_revenue DECIMAL(15, 2) DEFAULT 0,
  planned_expense DECIMAL(15, 2) DEFAULT 0,
  planned_profit DECIMAL(15, 2) GENERATED ALWAYS AS (planned_revenue - planned_expense) STORED,
  planned_profit_rate DECIMAL(5, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_revenue > 0 THEN (planned_revenue - planned_expense) / planned_revenue
      ELSE 0
    END
  ) STORED,

  -- 財務資訊 - 實際
  actual_revenue DECIMAL(15, 2) DEFAULT 0,
  actual_expense DECIMAL(15, 2) DEFAULT 0,
  actual_profit DECIMAL(15, 2) GENERATED ALWAYS AS (actual_revenue - actual_expense) STORED,
  actual_profit_rate DECIMAL(5, 4) GENERATED ALWAYS AS (
    CASE
      WHEN actual_revenue > 0 THEN (actual_revenue - actual_expense) / actual_revenue
      ELSE 0
    END
  ) STORED,

  -- 時程資訊
  planned_start_date DATE,
  planned_end_date DATE,
  planned_duration_months INTEGER,
  actual_start_date DATE,
  actual_end_date DATE,

  -- 狀態管理
  status VARCHAR(50) DEFAULT 'planning',      -- planning, in_progress, completed, on_hold, cancelled
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- 審查資訊
  review_result TEXT,
  review_date DATE,
  reviewer VARCHAR(100),
  review_notes TEXT,

  -- 組織能力提升
  organizational_improvement TEXT,            -- 組織力・生産性の向上
  knowledge_accumulation TEXT,                -- 組織的に広く活用できる方法論や知財

  -- 附件與備註
  attachments JSONB,                          -- [{name, url, size, type}]
  notes TEXT,
  project_folder_path VARCHAR(500),

  -- 系統欄位
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP,                       -- 軟刪除

  -- 全文搜索
  search_vector tsvector
);

-- ============================================================================
-- 3. 專案成員表
-- ============================================================================
CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  role VARCHAR(50) NOT NULL,                  -- PPM, PMO, PD, PM, CREW
  role_number INTEGER,                        -- For CREW①, CREW②, etc.
  member_name VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  class_level VARCHAR(50),                    -- クラス: -, A, B, C, etc.

  planned_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,

  capability_improvement TEXT,                -- 個人の能力向上

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, role, role_number)
);

-- ============================================================================
-- 4. 任務表
-- ============================================================================
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  task_order INTEGER DEFAULT 0,               -- 排序順序

  -- 負責人
  assigned_to VARCHAR(100),
  assigned_member_id INTEGER REFERENCES project_members(id) ON DELETE SET NULL,

  -- 時程 - 計劃
  planned_duration INTEGER,                   -- 天數
  planned_start_date DATE,
  planned_end_date DATE,

  -- 時程 - 實際
  actual_duration INTEGER,
  actual_start_date DATE,
  actual_end_date DATE,

  -- 狀態與進度
  status VARCHAR(50) DEFAULT 'pending',       -- pending, in_progress, completed, cancelled, blocked
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- 依賴關係
  depends_on INTEGER REFERENCES tasks(id) ON DELETE SET NULL,  -- 依賴的前置任務

  -- 備註
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. 甘特圖時間軸表
-- ============================================================================
CREATE TABLE gantt_timeline (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  year_month DATE NOT NULL,                   -- 該月的第一天，例如：2021-04-01
  is_planned BOOLEAN DEFAULT TRUE,            -- TRUE: 計劃, FALSE: 實際
  is_active BOOLEAN DEFAULT FALSE,            -- 該月是否有工作
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(task_id, year_month, is_planned)
);

-- ============================================================================
-- 6. 月度財務表
-- ============================================================================
CREATE TABLE monthly_financials (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  year_month DATE NOT NULL,                   -- 該月的第一天

  -- 計劃數據
  planned_revenue DECIMAL(15, 2) DEFAULT 0,
  planned_expense DECIMAL(15, 2) DEFAULT 0,
  planned_profit DECIMAL(15, 2) GENERATED ALWAYS AS (planned_revenue - planned_expense) STORED,
  planned_profit_rate DECIMAL(5, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_revenue > 0 THEN (planned_revenue - planned_expense) / planned_revenue
      ELSE 0
    END
  ) STORED,

  -- 實際數據
  actual_revenue DECIMAL(15, 2) DEFAULT 0,
  actual_expense DECIMAL(15, 2) DEFAULT 0,
  actual_profit DECIMAL(15, 2) GENERATED ALWAYS AS (actual_revenue - actual_expense) STORED,
  actual_profit_rate DECIMAL(5, 4) GENERATED ALWAYS AS (
    CASE
      WHEN actual_revenue > 0 THEN (actual_revenue - actual_expense) / actual_revenue
      ELSE 0
    END
  ) STORED,

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, year_month)
);

-- ============================================================================
-- 7. 月度工時表
-- ============================================================================
CREATE TABLE monthly_hours (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,

  year_month DATE NOT NULL,

  planned_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, member_id, year_month)
);

-- ============================================================================
-- 8. 專案報告表
-- ============================================================================
CREATE TABLE project_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  report_type VARCHAR(50) NOT NULL,           -- planning, interim, final
  report_date DATE NOT NULL,

  -- 價值創造
  value_created TEXT,                         -- プロジェクトを通じて創出した価値

  -- 問題與改善
  problems_encountered TEXT,                  -- プロジェクト推進で生じた問題
  improvement_measures TEXT,                  -- 問題に対する改善策
  lessons_learned TEXT,                       -- プロジェクトの反省・学び

  -- 客戶反饋
  customer_feedback TEXT,                     -- お客様からの評価
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),

  -- 時程與成本評估
  schedule_assessment TEXT,                   -- 納期評估
  cost_assessment TEXT,                       -- 成本評估

  -- 組織改善
  organizational_improvement TEXT,

  -- 附件
  attachments JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 索引建立
-- ============================================================================

-- users 表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- projects 表索引
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(planned_start_date, planned_end_date);
CREATE INDEX idx_projects_client ON projects(client_name);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_deleted ON projects(deleted_at);
CREATE INDEX idx_projects_search ON projects USING gin(search_vector);

-- project_members 表索引
CREATE INDEX idx_members_project ON project_members(project_id);
CREATE INDEX idx_members_role ON project_members(role);
CREATE INDEX idx_members_user ON project_members(user_id);
CREATE INDEX idx_members_active ON project_members(is_active);

-- tasks 表索引
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_member_id);
CREATE INDEX idx_tasks_dates ON tasks(planned_start_date, planned_end_date);
CREATE INDEX idx_tasks_depends ON tasks(depends_on);

-- gantt_timeline 表索引
CREATE INDEX idx_gantt_task ON gantt_timeline(task_id);
CREATE INDEX idx_gantt_month ON gantt_timeline(year_month);
CREATE INDEX idx_gantt_task_month ON gantt_timeline(task_id, year_month);

-- monthly_financials 表索引
CREATE INDEX idx_financials_project ON monthly_financials(project_id);
CREATE INDEX idx_financials_month ON monthly_financials(year_month);
CREATE INDEX idx_financials_project_month ON monthly_financials(project_id, year_month);

-- monthly_hours 表索引
CREATE INDEX idx_hours_project ON monthly_hours(project_id);
CREATE INDEX idx_hours_member ON monthly_hours(member_id);
CREATE INDEX idx_hours_month ON monthly_hours(year_month);
CREATE INDEX idx_hours_project_month ON monthly_hours(project_id, year_month);

-- project_reports 表索引
CREATE INDEX idx_reports_project ON project_reports(project_id);
CREATE INDEX idx_reports_type ON project_reports(report_type);
CREATE INDEX idx_reports_date ON project_reports(report_date);

-- ============================================================================
-- 觸發器：自動更新 updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有表創建 updated_at 觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gantt_timeline_updated_at BEFORE UPDATE ON gantt_timeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_financials_updated_at BEFORE UPDATE ON monthly_financials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_hours_updated_at BEFORE UPDATE ON monthly_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_reports_updated_at BEFORE UPDATE ON project_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 觸發器：專案全文搜索向量更新
-- ============================================================================

CREATE OR REPLACE FUNCTION update_projects_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.project_code, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.project_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.client_name, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.project_overview, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_search_vector_trigger
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_projects_search_vector();

-- ============================================================================
-- 視圖：專案摘要
-- ============================================================================

CREATE OR REPLACE VIEW v_project_summary AS
SELECT
  p.id,
  p.project_code,
  p.project_name,
  p.client_name,
  p.status,
  p.progress,
  p.planned_start_date,
  p.planned_end_date,
  p.actual_start_date,
  p.actual_end_date,
  p.planned_revenue,
  p.actual_revenue,
  p.planned_profit,
  p.actual_profit,
  p.planned_profit_rate,
  p.actual_profit_rate,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT pm.id) as total_members,
  SUM(pm.planned_hours) as total_planned_hours,
  SUM(pm.actual_hours) as total_actual_hours,
  u1.full_name as created_by_name,
  u2.full_name as updated_by_name
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.is_active = TRUE
LEFT JOIN users u1 ON p.created_by = u1.id
LEFT JOIN users u2 ON p.updated_by = u2.id
WHERE p.deleted_at IS NULL
GROUP BY
  p.id, p.project_code, p.project_name, p.client_name, p.status, p.progress,
  p.planned_start_date, p.planned_end_date, p.actual_start_date, p.actual_end_date,
  p.planned_revenue, p.actual_revenue, p.planned_profit, p.actual_profit,
  p.planned_profit_rate, p.actual_profit_rate,
  u1.full_name, u2.full_name;

-- ============================================================================
-- 視圖：任務甘特圖
-- ============================================================================

CREATE OR REPLACE VIEW v_gantt_chart AS
SELECT
  t.id as task_id,
  t.project_id,
  t.task_name,
  t.assigned_to,
  t.status,
  t.progress,
  gt.year_month,
  gt.is_planned,
  gt.is_active,
  gt.completion_percentage
FROM tasks t
LEFT JOIN gantt_timeline gt ON t.id = gt.task_id
ORDER BY t.project_id, t.task_order, gt.year_month;

-- ============================================================================
-- 視圖：月度財務匯總
-- ============================================================================

CREATE OR REPLACE VIEW v_monthly_financials_summary AS
SELECT
  mf.project_id,
  p.project_code,
  p.project_name,
  mf.year_month,
  mf.planned_revenue,
  mf.actual_revenue,
  mf.planned_expense,
  mf.actual_expense,
  mf.planned_profit,
  mf.actual_profit,
  mf.planned_profit_rate,
  mf.actual_profit_rate,
  (mf.actual_revenue - mf.planned_revenue) as revenue_variance,
  (mf.actual_expense - mf.planned_expense) as expense_variance
FROM monthly_financials mf
JOIN projects p ON mf.project_id = p.id
WHERE p.deleted_at IS NULL
ORDER BY mf.project_id, mf.year_month;

-- ============================================================================
-- 範例資料插入（測試用）
-- ============================================================================

-- 插入測試用戶
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@example.com', '$2a$10$examplehash', '管理員', 'admin'),
('yamazaki', 'yamazaki@example.com', '$2a$10$examplehash', '山崎', 'manager'),
('shen', 'shen@example.com', '$2a$10$examplehash', '沈庆元', 'member'),
('wang', 'wang@example.com', '$2a$10$examplehash', '王旭', 'member'),
('zhou', 'zhou@example.com', '$2a$10$examplehash', '周娴', 'member');

-- 插入範例專案
INSERT INTO projects (
  project_code, project_name, client_name, project_overview, project_type,
  value_proposition, problem_to_solve, experience_provided,
  planned_revenue, planned_expense,
  planned_start_date, planned_end_date, planned_duration_months,
  status, created_by, updated_by
) VALUES (
  '001-P-21-079',
  '人事制度改善支援プロジェクト',
  '株式会社サンプル',
  '人事制度改善支援',
  'Needs-in(顧客起点)',
  'お客様の現状問題の解決を向き合う人事制度の設計支援',
  '・現状人事状況の把握、問題認識\n・アドバイスを通じて、人事制度導入のサポート',
  '専門家によるサポートより、全面的な現状分析及び効率的な制度設計',
  180000,
  0,
  '2021-04-01',
  '2021-11-30',
  8,
  'in_progress',
  1,
  1
);

-- 插入專案成員
INSERT INTO project_members (project_id, role, role_number, member_name, user_id, class_level, planned_hours) VALUES
(1, 'PPM', NULL, '周娴', 5, '-', 26),
(1, 'PMO', NULL, NULL, NULL, '-', 0),
(1, 'PD', NULL, '山崎', 2, '-', 0),
(1, 'PM', NULL, '沈庆元', 3, '-', 96),
(1, 'CREW', 1, '王旭', 4, '-', 96);

-- 插入任務
INSERT INTO tasks (project_id, task_name, planned_duration, assigned_to, assigned_member_id, task_order) VALUES
(1, '資料確認・現状分析', 84, '沈', 4, 1),
(1, '報告作成・中間報告', 22, '沈', 4, 2),
(1, '報告修正・最終報告', 24, '沈', 4, 3),
(1, '等級制度のアドバイス', 28, '沈', 4, 4),
(1, '報酬制度のアドバイス', 26, '沈', 4, 5),
(1, '評価制度のアドバイス', 28, '沈', 4, 6);

-- 插入月度財務資料
INSERT INTO monthly_financials (project_id, year_month, planned_revenue, planned_expense) VALUES
(1, '2021-04-01', 33000, 0),
(1, '2021-05-01', 33000, 0),
(1, '2021-06-01', 34000, 0),
(1, '2021-07-01', 16000, 0),
(1, '2021-08-01', 16000, 0),
(1, '2021-09-01', 16000, 0),
(1, '2021-10-01', 16000, 0),
(1, '2021-11-01', 16000, 0);

-- ============================================================================
-- 實用查詢範例
-- ============================================================================

-- 查詢所有進行中的專案
-- SELECT * FROM v_project_summary WHERE status = 'in_progress';

-- 查詢特定專案的財務趨勢
-- SELECT * FROM v_monthly_financials_summary WHERE project_id = 1 ORDER BY year_month;

-- 查詢特定專案的任務進度
-- SELECT task_name, status, progress, planned_start_date, planned_end_date
-- FROM tasks WHERE project_id = 1 ORDER BY task_order;

-- 查詢成員工時統計
-- SELECT pm.member_name, pm.role, SUM(mh.actual_hours) as total_hours
-- FROM project_members pm
-- LEFT JOIN monthly_hours mh ON pm.id = mh.member_id
-- WHERE pm.project_id = 1
-- GROUP BY pm.member_name, pm.role;

-- 全文搜索專案
-- SELECT project_code, project_name, client_name
-- FROM projects
-- WHERE search_vector @@ to_tsquery('simple', '人事 | 制度')
-- AND deleted_at IS NULL;

-- ============================================================================
-- 結束
-- ============================================================================
