# 專案管理系統

一個基於 React + Node.js + PostgreSQL 的現代化專案管理系統，支援 Google OAuth 認證。

## 功能特色

- 🔐 **Google OAuth 認證** - 使用 Google 帳號快速登入
- 📊 **專案管理** - 完整的專案生命週期管理
- 👥 **成員管理** - 團隊成員與角色權限管理
- 📈 **財務追蹤** - 收支管理與利潤率分析
- 📅 **甘特圖** - 視覺化任務時間軸
- 📱 **響應式設計** - 支援桌面和移動設備

## 技術棧

### 前端
- ⚛️ React 19 + TypeScript
- 🎨 Ant Design UI 組件
- 🔄 React Router 路由
- 🐻 Zustand 狀態管理
- 📡 Axios HTTP 客戶端
- ⚡ Vite 建置工具

### 後端
- 🚀 Node.js + Express
- 🔷 TypeScript
- 🗄️ PostgreSQL 14+
- 📦 Sequelize ORM
- 🔒 JWT 認證
- 🌐 Google OAuth 2.0

## 前置需求

- Node.js 18+
- PostgreSQL 14+
- Google Cloud Platform 帳號（用於 OAuth）
- npm 或 yarn

## 快速開始

### 1. 複製專案

```bash
git clone <repository-url>
cd project_web
```

### 2. 配置 Google OAuth

請參考 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) 取得 Google OAuth 憑證。

### 3. 設定後端

```bash
cd backend

# 安裝依賴
npm install

# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案，填入以下資訊：
# - 資料庫連接資訊
# - Google OAuth 憑證
# - JWT 密鑰
nano .env
```

**`.env` 必填欄位：**
```env
# 資料庫
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=postgres
DB_PASSWORD=your_password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

```bash
# 啟動開發服務器
npm run dev
```

後端將在 `http://localhost:5000` 運行

### 4. 設定前端

```bash
cd frontend

# 安裝依賴
npm install

# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案
nano .env
```

**`.env` 必填欄位：**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

```bash
# 啟動開發服務器
npm run dev
```

前端將在 `http://localhost:5173` 運行（或 `http://localhost:3000`）

### 5. 訪問應用

打開瀏覽器訪問：http://localhost:5173

使用 Google 帳號登入即可開始使用！

## 資料庫設定

如果資料庫尚未建立，請執行：

```bash
# 使用 psql 建立資料庫
psql -U postgres -f backend/src/db/init-database.sql

# 或手動建立
psql -U postgres
CREATE DATABASE project_management;
\q
```

**或**使用 GUI 工具（pgAdmin、DBeaver 等）執行 `database_schema.sql` 中的腳本。

Sequelize 將在開發模式下自動同步模型到資料庫。

## 專案結構

```
project_web/
├── backend/                 # 後端 API
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中間件
│   │   ├── models/         # 資料模型
│   │   ├── routes/         # 路由
│   │   ├── db/            # 資料庫腳本
│   │   └── server.ts      # 入口文件
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/    # React 組件
│   │   ├── pages/         # 頁面組件
│   │   ├── lib/           # 工具函式
│   │   ├── store/         # 狀態管理
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── database_schema.sql     # 完整資料庫架構
├── ERD_說明.md            # 資料庫設計說明
├── 分析報告.md            # 需求分析報告
├── GOOGLE_OAUTH_SETUP.md  # Google OAuth 設定指南
└── README.md              # 本文件
```

## 開發指令

### 後端

```bash
cd backend

# 開發模式（熱重載）
npm run dev

# 建置生產版本
npm run build

# 啟動生產服務器
npm start

# 代碼檢查
npm run lint

# 代碼格式化
npm run format
```

### 前端

```bash
cd frontend

# 開發模式
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 代碼檢查
npm run lint
```

## API 文檔

### 認證 API

#### Google OAuth 登入
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-jwt-token"
}
```

#### 取得當前用戶
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

#### 刷新 Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

#### 登出
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

### 專案 API

#### 取得專案列表
```http
GET /api/projects?page=1&limit=10&status=in_progress
Authorization: Bearer <access-token>
```

#### 取得單一專案
```http
GET /api/projects/:id
Authorization: Bearer <access-token>
```

#### 建立專案
```http
POST /api/projects
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "projectCode": "001-P-21-079",
  "projectName": "專案名稱",
  "clientName": "客戶名稱",
  "plannedRevenue": 180000,
  "plannedStartDate": "2024-01-01",
  "plannedEndDate": "2024-12-31"
}
```

#### 更新專案
```http
PUT /api/projects/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "in_progress",
  "progress": 50
}
```

#### 刪除專案（軟刪除）
```http
DELETE /api/projects/:id
Authorization: Bearer <access-token>
```

## 環境變數說明

### 後端環境變數

| 變數名稱 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| `NODE_ENV` | 運行環境 | development | ❌ |
| `PORT` | 服務器端口 | 5000 | ❌ |
| `DB_HOST` | 資料庫主機 | localhost | ✅ |
| `DB_PORT` | 資料庫端口 | 5432 | ❌ |
| `DB_NAME` | 資料庫名稱 | project_management | ✅ |
| `DB_USER` | 資料庫用戶 | postgres | ✅ |
| `DB_PASSWORD` | 資料庫密碼 | - | ✅ |
| `JWT_SECRET` | JWT 密鑰 | - | ✅ |
| `JWT_EXPIRES_IN` | JWT 過期時間 | 7d | ❌ |
| `GOOGLE_CLIENT_ID` | Google 用戶端 ID | - | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google 用戶端密鑰 | - | ✅ |
| `ALLOWED_ORIGINS` | CORS 允許來源 | http://localhost:3000 | ❌ |

### 前端環境變數

| 變數名稱 | 說明 | 必填 |
|---------|------|------|
| `VITE_API_URL` | 後端 API 地址 | ✅ |
| `VITE_GOOGLE_CLIENT_ID` | Google 用戶端 ID | ✅ |

## 常見問題

### Q: 無法連接資料庫

**A:**
1. 確認 PostgreSQL 服務已啟動
2. 檢查 `backend/.env` 中的資料庫連接資訊
3. 確認資料庫已建立：`psql -U postgres -l | grep project_management`

### Q: Google 登入失敗

**A:**
1. 檢查 Google OAuth 憑證是否正確配置
2. 確認前後端的 `GOOGLE_CLIENT_ID` 一致
3. 檢查 Google Cloud Console 中的授權重新導向 URI
4. 參考 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### Q: Token 過期錯誤

**A:**
系統會自動刷新 Token。如果持續出現錯誤：
1. 清除瀏覽器的 localStorage
2. 重新登入

### Q: CORS 錯誤

**A:**
1. 確認後端 `ALLOWED_ORIGINS` 包含前端 URL
2. 檢查前端 `VITE_API_URL` 是否正確

## 部署

### 後端部署

```bash
cd backend

# 建置
npm run build

# 設定生產環境變數
export NODE_ENV=production
export DB_HOST=your-db-host
# ... 其他環境變數

# 啟動
npm start
```

### 前端部署

```bash
cd frontend

# 建置
npm run build

# dist/ 目錄可部署到任何靜態主機
# 例如：Vercel, Netlify, AWS S3, etc.
```

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

MIT License

## 聯絡方式

如有問題或建議，請透過 Issue 反饋。

---

開發愉快！ 🚀
