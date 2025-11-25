# 快速啟動指南

這份指南將幫助您在 5 分鐘內啟動專案管理系統。

## 前置檢查

確保您已安裝：
- ✅ Node.js 18+ (`node --version`)
- ✅ PostgreSQL 14+ (`psql --version`)
- ✅ npm (`npm --version`)

## 第一步：Google OAuth 設定

### 1. 建立 Google Cloud 專案

1. 前往 https://console.cloud.google.com/
2. 建立新專案
3. 啟用 Google+ API
4. 建立 OAuth 2.0 憑證
   - 應用程式類型：「網頁應用程式」
   - 授權 JavaScript 來源：`http://localhost:5173`
   - 授權重新導向 URI：`http://localhost:5173`

5. 取得憑證：
   - 用戶端 ID：`123456789-abc123.apps.googleusercontent.com`
   - 用戶端密鑰：`GOCSPX-abc123xyz789`

詳細步驟請參考 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## 第二步：資料庫設定

```bash
# 連接到 PostgreSQL
psql -U postgres

# 建立資料庫
CREATE DATABASE project_management;

# 退出
\q
```

## 第三步：後端設定

```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 複製環境變數
cp .env.example .env

# 編輯 .env（使用您喜歡的編輯器）
nano .env
```

### 編輯 `.env` 檔案：

```env
# 資料庫
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=postgres
DB_PASSWORD=你的PostgreSQL密碼

# Google OAuth
GOOGLE_CLIENT_ID=你的Google用戶端ID
GOOGLE_CLIENT_SECRET=你的Google用戶端密鑰

# JWT（隨機生成一個）
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# API URL
API_URL=http://localhost:5000

# 前端 URL
FRONTEND_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 啟動後端：

```bash
npm run dev
```

看到這個訊息就成功了：
```
✅ Database connection established successfully.
🚀 Server is running on port 5000
```

## 第四步：前端設定

**開啟新的終端視窗**

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 複製環境變數
cp .env.example .env

# 編輯 .env
nano .env
```

### 編輯 `.env` 檔案：

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=你的Google用戶端ID
```

### 啟動前端：

```bash
npm run dev
```

看到這個訊息就成功了：
```
  VITE v7.2.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

## 第五步：測試應用

1. 打開瀏覽器訪問：http://localhost:5173
2. 點擊「使用 Google 登入」
3. 選擇您的 Google 帳號
4. 授權應用程式
5. 成功！您應該會看到儀表板頁面

## 故障排除

### 問題 1：資料庫連接失敗

**錯誤訊息：** `Unable to connect to the database`

**解決方案：**
```bash
# 確認 PostgreSQL 正在運行
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Windows
# 檢查服務管理器中的 PostgreSQL 服務
```

### 問題 2：端口被占用

**錯誤訊息：** `Port 5000 is already in use`

**解決方案：**
```bash
# 修改 backend/.env 中的 PORT
PORT=5001

# 同時更新 frontend/.env 中的 API URL
VITE_API_URL=http://localhost:5001/api
```

### 問題 3：Google 登入錯誤

**錯誤訊息：** `redirect_uri_mismatch`

**解決方案：**
1. 前往 Google Cloud Console
2. 檢查「憑證」中的「授權重新導向 URI」
3. 確保包含：`http://localhost:5173`

### 問題 4：npm install 失敗

**解決方案：**
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### 問題 5：TypeScript 編譯錯誤

**解決方案：**
```bash
# 後端
cd backend
npm install typescript tsx --save-dev

# 前端
cd frontend
npm install typescript --save-dev
```

## 開發工具推薦

### 資料庫管理
- **pgAdmin** - PostgreSQL 官方 GUI 工具
- **DBeaver** - 跨平台資料庫工具
- **TablePlus** - 現代化資料庫管理工具

### API 測試
- **Postman** - API 開發和測試
- **Insomnia** - REST API 客戶端
- **Thunder Client** - VS Code 擴展

### VS Code 擴展
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- PostgreSQL
- REST Client
- GitLens

## 下一步

現在您已經成功啟動了專案，可以：

1. 📖 閱讀完整的 [README.md](./README.md)
2. 🔍 查看 [API 文檔](./README.md#api-文檔)
3. 🗄️ 了解[資料庫設計](./ERD_說明.md)
4. 📊 查看[需求分析報告](./分析報告.md)
5. 🚀 開始開發新功能！

## 測試帳號

首次登入時，系統會自動建立您的 Google 帳號作為用戶。

預設角色：`member`

如需更改為管理員：
```sql
-- 連接到資料庫
psql -U postgres -d project_management

-- 更新用戶角色
UPDATE users SET role = 'admin' WHERE email = 'your-email@gmail.com';

-- 退出
\q
```

## 快速命令參考

### 啟動所有服務

**終端 1 - 後端：**
```bash
cd backend && npm run dev
```

**終端 2 - 前端：**
```bash
cd frontend && npm run dev
```

### 重置資料庫（開發用）

```bash
# 刪除並重建
psql -U postgres
DROP DATABASE project_management;
CREATE DATABASE project_management;
\q

# 重新啟動後端（Sequelize 會自動同步模型）
cd backend && npm run dev
```

### 查看日誌

**後端日誌：**
- 直接在執行 `npm run dev` 的終端查看

**前端日誌：**
- 瀏覽器開發者工具 Console (F12)

## 生產環境部署

準備部署到生產環境？請參考：
- [README.md - 部署章節](./README.md#部署)
- [GOOGLE_OAUTH_SETUP.md - 生產環境部署](./GOOGLE_OAUTH_SETUP.md#生產環境部署)

---

有問題？請查看 [README.md 常見問題](./README.md#常見問題) 或提交 Issue。

祝您開發順利！ 🎉
