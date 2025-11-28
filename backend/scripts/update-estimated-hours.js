/**
 * 更新腳本：將所有沒有預計工時的任務設為預設值 10 小時
 *
 * 執行方式：
 * cd backend
 * node scripts/update-estimated-hours.js
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

async function updateEstimatedHours() {
  try {
    console.log('開始連接資料庫...');
    await sequelize.authenticate();
    console.log('✅ 資料庫連接成功');

    console.log('\n檢查需要更新的任務...');

    // 查詢沒有預計工時或預計工時為 0 的任務
    const [tasks] = await sequelize.query(`
      SELECT id, task_name, estimated_hours
      FROM project_tasks
      WHERE estimated_hours IS NULL OR estimated_hours = 0
    `);

    if (tasks.length === 0) {
      console.log('✅ 所有任務都已有預計工時，無需更新');
      return;
    }

    console.log(`找到 ${tasks.length} 個需要更新的任務：`);
    tasks.forEach(task => {
      console.log(`  - ID: ${task.id}, 名稱: ${task.task_name}, 目前預計工時: ${task.estimated_hours || 'NULL'}`);
    });

    console.log('\n開始更新...');

    // 更新所有沒有預計工時的任務，設為 1
    const [result] = await sequelize.query(`
      UPDATE project_tasks
      SET estimated_hours = 1
      WHERE estimated_hours IS NULL OR estimated_hours = 0
    `);

    console.log(`✅ 成功更新 ${tasks.length} 個任務的預計工時為 1 小時`);

    // 驗證更新結果
    const [verifyTasks] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM project_tasks
      WHERE estimated_hours IS NULL OR estimated_hours = 0
    `);

    if (verifyTasks[0].count === 0) {
      console.log('✅ 驗證成功：所有任務都已有預計工時');
    } else {
      console.log(`⚠️  仍有 ${verifyTasks[0].count} 個任務沒有預計工時`);
    }

  } catch (error) {
    console.error('❌ 更新失敗:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n資料庫連接已關閉');
  }
}

// 執行更新
updateEstimatedHours()
  .then(() => {
    console.log('\n✅ 更新腳本執行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 更新腳本執行失敗:', error);
    process.exit(1);
  });
