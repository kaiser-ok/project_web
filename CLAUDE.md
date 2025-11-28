# Project Web - 專案管理系統

## 專案概述

這是一個專案管理 Web 應用程式，用於將 Excel 格式的專案計劃書轉換為 Web 介面。

請讀取 usecase.md 
## 技術架構

### Frontend
- **框架**: React 18 + TypeScript + Vite
- **UI 套件**: Ant Design (antd)
- **路由**: React Router v6
- **HTTP 客戶端**: Axios
- **日期處理**: dayjs
- **狀態管理**: React Hooks (useState, useEffect, useCallback)

### Backend
- **框架**: Node.js + Express + TypeScript
- **ORM**: Sequelize
- **資料庫**: PostgreSQL
- **認證**: Google OAuth 2.0 + JWT
- **中介軟體**: cors, helmet, express-rate-limit

### 資料庫結構
- **Users**: 使用者管理（含 alias 別名、hourlyRate 預設時薪欄位）
- **Projects**: 專案基本資訊
- **ProjectMembers**: 專案成員（角色：PPM, PMO, PD, PM, CREW）
- **ProjectTasks**: 專案任務
- **TaskWorkHours**: 任務工時記錄
- **ProjectFinances**: 財務資料（月度收支）
- **ProjectWorkHours**: 成員工時記錄
- **ProjectReports**: 專案報告書
- **ActivityLogs**: 操作紀錄

## 讀取 Excel 檔案的方法

使用 Python openpyxl 套件來分析 Excel 結構：

```python
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('檔案名稱.xlsx')
print('Available sheets:', wb.sheetnames)

# 讀取特定 sheet
sheet = wb['sheet名稱']
for row in range(1, 60):
    row_data = []
    for col in range(1, 20):
        cell = sheet.cell(row=row, column=col)
        if cell.value:
            row_data.append(f'{col}:{cell.value}')
    if row_data:
        print(f'Row {row}: {row_data}')
"
```

## 專案計劃書結構 (來自 Excel)

### Excel 工作表
1. **プロジェクト計画書** - 專案計劃書
2. **プロジェクト管理表** - 專案管理表
3. **プロジェクト報告書** - 專案報告書

### 專案計劃書區塊

#### 基本資訊
- 建立日期 / 建立者
- 更新日期 / 更新者
- 客戶
- 專案名稱
- 專案概要
- 附件資料
- 專案類型（客戶需求導向、公司策略導向、內部專案）
- 專案編號

#### Goal - 目標 (藍色)
- 專案創造的價值與客戶滿意度
- 收益與成本分析
  - ① 收入
  - ② 支出
  - ③ 損益（①-②）
  - ④ 利潤率（③/①）
- 專案時程
  - 開始日期
  - 結束日期
  - 專案期間

#### Approach - 方法 (綠色)
- 專案要解決的問題
- 提供什麼樣的經驗與服務

#### Resource - 資源 (紫色)
- 人力投入清單（角色、姓名、職級、時薪）
- 組織與個人能力提升
- 方法論與知識累積

#### 專案審查結果
- 審查結果（核准、有條件核准、駁回、待審）
- 審查日期
- 審查人
- 備註事項

## API 端點

### 認證 (auth.routes.ts)
- `POST /api/auth/google` - Google OAuth 登入
- `POST /api/auth/google/callback` - Google OAuth 回調
- `POST /api/auth/refresh` - 重新整理 Token
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 取得當前使用者

### 使用者 (user.routes.ts)
- `GET /api/users` - 取得所有使用者（管理員）
- `GET /api/users/list` - 取得使用者列表（下拉選單用）
- `GET /api/users/:id` - 取得單一使用者（管理員）
- `GET /api/users/profile/me` - 取得當前使用者 Profile
- `POST /api/users/invite` - 新增使用者（管理員）
- `PUT /api/users/:id` - 更新使用者（管理員）

### Dashboard (dashboard.routes.ts)
- `GET /api/dashboard` - 取得 Dashboard 資料（我的專案、我的任務、統計）

### 專案 (project.routes.ts)
- `GET /api/projects` - 取得專案列表
- `GET /api/projects/:id` - 取得專案詳情
- `GET /api/projects/next-code` - 取得下一個專案編號
- `POST /api/projects` - 建立專案（manager, admin）
- `PUT /api/projects/:id` - 更新專案（manager, admin）
- `DELETE /api/projects/:id` - 刪除專案（admin）

### 成員 (member.routes.ts)
- `GET /api/members/project/:projectId` - 取得專案成員
- `POST /api/members` - 新增成員
- `PUT /api/members/:id` - 更新成員
- `DELETE /api/members/:id` - 刪除成員

### 任務 (task.routes.ts)
- `GET /api/tasks/project/:projectId` - 取得專案任務
- `POST /api/tasks` - 新增任務
- `PUT /api/tasks/:id` - 更新任務
- `PUT /api/tasks/bulk/update` - 批次更新任務（排序）
- `DELETE /api/tasks/:id` - 刪除任務

### 財務 (finance.routes.ts)
- `GET /api/finances/project/:projectId` - 取得財務資料
- `POST /api/finances` - 建立/更新財務記錄（upsert by yearMonth）
- `PUT /api/finances/bulk` - 批次更新財務
- `DELETE /api/finances/:id` - 刪除財務記錄

### 成員工時 (workHour.routes.ts)
- `GET /api/work-hours/project/:projectId` - 取得專案工時記錄
- `GET /api/work-hours/member/:memberId` - 取得成員工時記錄
- `POST /api/work-hours` - 建立/更新工時記錄（upsert）
- `PUT /api/work-hours/bulk` - 批次更新工時
- `DELETE /api/work-hours/:id` - 刪除工時記錄

### 任務工時 (taskWorkHour.routes.ts)
- `GET /api/task-work-hours/task/:taskId` - 取得任務工時
- `GET /api/task-work-hours/project/:projectId/summary` - 取得專案工時摘要
- `GET /api/task-work-hours/project/:projectId/monthly` - 取得專案月度工時
- `POST /api/task-work-hours/task/:taskId` - 新增任務工時
- `POST /api/task-work-hours/task/:taskId/bulk` - 批次新增任務工時
- `PUT /api/task-work-hours/:id` - 更新任務工時
- `DELETE /api/task-work-hours/:id` - 刪除任務工時

### 專案報告書 (report.routes.ts)
- `GET /api/reports/project/:projectId` - 取得專案報告書
- `GET /api/reports/project/:projectId/summary` - 取得專案報告摘要
- `GET /api/reports/:id` - 取得單一報告
- `POST /api/reports` - 建立報告（manager, admin）
- `PUT /api/reports/:id` - 更新報告（manager, admin）
- `DELETE /api/reports/:id` - 刪除報告（admin）

### 操作紀錄 (activityLog.routes.ts)
- `GET /api/activity-logs` - 取得操作紀錄（管理員，支援分頁與篩選）
- `GET /api/activity-logs/actions` - 取得操作類型列表（管理員）
- `GET /api/activity-logs/entity-types` - 取得實體類型列表（管理員）

## 角色權限

- **admin**: 管理員，完整權限
- **manager**: 經理
- **member**: 成員
- **viewer**: 檢視者

## 專案成員角色

- **PPM**: 紅色標籤
- **PMO**: 橘色標籤
- **PD**: 綠色標籤
- **PM**: 藍色標籤
- **CREW**: 紫色標籤

## 開發指令

```bash
# Frontend
cd frontend
npm install
npm run dev          # 開發模式 (port 5173)
npm run build        # 建置

# Backend
cd backend
npm install
npm run dev          # 開發模式 (port 5001)
npm run build        # 建置
```

## 資料庫連線

PostgreSQL 連線設定在 `backend/.env`:
```
DATABASE_URL=postgres://user:password@localhost:5432/project_web
```

## Users 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| username | VARCHAR(100) | 使用者名稱 |
| email | VARCHAR(255) | Email（唯一） |
| fullName | VARCHAR(200) | 全名 |
| alias | VARCHAR(100) | 別名（用於專案成員對應） |
| role | ENUM | 系統角色（admin/manager/member/viewer） |
| hourlyRate | DECIMAL(10,2) | 預設時薪（用於成本計算） |
| avatar | TEXT | 頭像 URL |
| isActive | BOOLEAN | 是否啟用 |
| lastLoginAt | TIMESTAMP | 最後登入時間 |

## 注意事項

1. **DECIMAL 欄位**: PostgreSQL 的 DECIMAL 類型在 JSON 中會以字串返回，前端需使用 `Number()` 轉換
2. **Google OAuth**: 需設定 Google Cloud Console 的 OAuth 2.0 憑證
3. **JWT**: Token 存放在 localStorage
4. **hourlyRate**: 新增成員時可帶入使用者的預設時薪作為初始值
