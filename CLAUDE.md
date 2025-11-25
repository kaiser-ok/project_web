# Project Web - 專案管理系統

## 專案概述

這是一個專案管理 Web 應用程式，用於將 Excel 格式的專案計劃書轉換為 Web 介面。

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
- **Users**: 使用者管理（含 alias 別名欄位）
- **Projects**: 專案基本資訊
- **ProjectMembers**: 專案成員（角色：PPM, PMO, PD, PM, CREW）
- **ProjectTasks**: 專案任務
- **ProjectFinances**: 財務資料（月度收支）
- **ProjectWorkHours**: 工時記錄
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

### 認證
- `POST /api/auth/google` - Google OAuth 登入
- `GET /api/auth/me` - 取得當前使用者

### 使用者
- `GET /api/users` - 取得所有使用者（管理員）
- `GET /api/users/list` - 取得使用者列表（下拉選單用）
- `POST /api/users/invite` - 新增使用者（管理員）
- `PUT /api/users/:id` - 更新使用者（管理員）

### 專案
- `GET /api/projects` - 取得專案列表
- `GET /api/projects/:id` - 取得專案詳情
- `POST /api/projects` - 建立專案
- `PUT /api/projects/:id` - 更新專案
- `DELETE /api/projects/:id` - 刪除專案
- `GET /api/projects/next-code` - 取得下一個專案編號

### 成員
- `GET /api/members/project/:projectId` - 取得專案成員
- `POST /api/members` - 新增成員
- `PUT /api/members/:id` - 更新成員
- `DELETE /api/members/:id` - 刪除成員

### 任務
- `GET /api/tasks/project/:projectId` - 取得專案任務
- `POST /api/tasks` - 新增任務
- `PUT /api/tasks/:id` - 更新任務
- `DELETE /api/tasks/:id` - 刪除任務

### 財務
- `GET /api/finances/project/:projectId` - 取得財務資料
- `POST /api/finances` - 新增財務記錄
- `PUT /api/finances/:id` - 更新財務記錄

### 工時
- `GET /api/work-hours/project/:projectId` - 取得工時記錄
- `POST /api/work-hours/batch` - 批次更新工時

### 操作紀錄
- `GET /api/activity-logs` - 取得操作紀錄（管理員）

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

## 注意事項

1. **DECIMAL 欄位**: PostgreSQL 的 DECIMAL 類型在 JSON 中會以字串返回，前端需使用 `Number()` 轉換
2. **Google OAuth**: 需設定 Google Cloud Console 的 OAuth 2.0 憑證
3. **JWT**: Token 存放在 localStorage
