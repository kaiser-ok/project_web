/**
 * 創建 roles 資料表並插入預設角色
 *
 * 執行方式：
 * cd backend
 * node scripts/create-roles-table.js
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

async function createRolesTable() {
  try {
    console.log('開始連接資料庫...');
    await sequelize.authenticate();
    console.log('✅ 資料庫連接成功');

    console.log('\n創建 roles 資料表...');

    await sequelize.query(`
      -- 刪除舊資料表（如果存在）
      DROP TABLE IF EXISTS roles CASCADE;

      -- 創建資料表
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- 添加註解
      COMMENT ON TABLE roles IS '專案角色管理';
      COMMENT ON COLUMN roles.code IS '角色代碼';
      COMMENT ON COLUMN roles.name IS '角色名稱';
      COMMENT ON COLUMN roles.is_active IS '是否啟用';

      -- 創建索引
      CREATE INDEX idx_roles_code ON roles(code);
      CREATE INDEX idx_roles_is_active ON roles(is_active);
    `);

    console.log('✅ roles 資料表創建成功');

    console.log('\n插入預設角色資料...');

    await sequelize.query(`
      INSERT INTO roles (code, name, is_active) VALUES
        ('PM', '專案經理', true),
        ('PPM', 'PPM', true),
        ('PMO', 'PMO', true),
        ('PD', 'PD', true),
        ('CREW', 'CREW', true)
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('✅ 預設角色資料插入成功');

    // 驗證資料表是否存在
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'roles'
    `);

    if (tables.length > 0) {
      console.log('✅ 驗證成功：roles 資料表已存在');
    } else {
      console.log('⚠️  驗證失敗：找不到 roles 資料表');
    }

    // 顯示已插入的角色
    const [roles] = await sequelize.query(`
      SELECT id, code, name, is_active
      FROM roles
      ORDER BY id
    `);

    console.log('\n已插入的角色:');
    console.table(roles);

  } catch (error) {
    console.error('❌ 創建失敗:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n資料庫連接已關閉');
  }
}

// 執行創建
createRolesTable()
  .then(() => {
    console.log('\n✅ 腳本執行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 腳本執行失敗:', error);
    process.exit(1);
  });
