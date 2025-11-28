/**
 * 創建 project_cost_items 資料表
 *
 * 執行方式：
 * cd backend
 * node scripts/create-cost-items-table.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'project_web',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: console.log
  }
);

async function createCostItemsTable() {
  try {
    console.log('開始連接資料庫...');
    await sequelize.authenticate();
    console.log('✅ 資料庫連接成功');

    console.log('\n創建 project_cost_items 資料表...');

    await sequelize.query(`
      -- 創建 enum 類型
      DO $$ BEGIN
        CREATE TYPE enum_project_cost_items_category AS ENUM('EQUIPMENT', 'CONSUMABLE', 'TRAVEL', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- 刪除舊資料表（如果存在）
      DROP TABLE IF EXISTS project_cost_items CASCADE;

      -- 創建資料表
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

      -- 添加註解
      COMMENT ON TABLE project_cost_items IS '專案非人力成本項目';
      COMMENT ON COLUMN project_cost_items.date IS '成本發生日';
      COMMENT ON COLUMN project_cost_items.month IS '對應月份 YYYY-MM';
      COMMENT ON COLUMN project_cost_items.amount IS '金額';
      COMMENT ON COLUMN project_cost_items.description IS '說明';
      COMMENT ON COLUMN project_cost_items.vendor IS '供應商';
      COMMENT ON COLUMN project_cost_items.invoice_no IS '單據編號';

      -- 創建索引
      CREATE INDEX idx_project_cost_items_project_id ON project_cost_items(project_id);
      CREATE INDEX idx_project_cost_items_date ON project_cost_items(date);
      CREATE INDEX idx_project_cost_items_month ON project_cost_items(month);
      CREATE INDEX idx_project_cost_items_category ON project_cost_items(category);
    `);

    console.log('✅ project_cost_items 資料表創建成功');

    // 驗證資料表是否存在
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'project_cost_items'
    `);

    if (tables.length > 0) {
      console.log('✅ 驗證成功：project_cost_items 資料表已存在');
    } else {
      console.log('⚠️  驗證失敗：找不到 project_cost_items 資料表');
    }

  } catch (error) {
    console.error('❌ 創建失敗:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n資料庫連接已關閉');
  }
}

// 執行創建
createCostItemsTable()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 腳本執行失敗:', error);
    process.exit(1);
  });
