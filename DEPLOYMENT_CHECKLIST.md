# 部署檢查清單

這份檢查清單將幫助您確保專案順利部署和運行。

## 📋 開發環境設定

### ✅ 基礎環境

- [ ] Node.js 18+ 已安裝
- [ ] PostgreSQL 14+ 已安裝並運行
- [ ] npm 或 yarn 已安裝
- [ ] Git 已安裝

### ✅ 資料庫設定

- [x] PostgreSQL 服務已啟動
- [x] 資料庫 `project_web` 已建立
- [ ] 資料庫架構已執行（使用 Sequelize 自動同步或手動執行 SQL）
- [ ] 資料庫連接測試成功

### ✅ Google OAuth 設定

- [ ] Google Cloud 專案已建立
- [ ] Google+ API 已啟用
- [ ] OAuth 2.0 憑證已建立
- [ ] 授權 JavaScript 來源已設定：
  - [ ] `http://localhost:5173`
  - [ ] `http://localhost:3000`
- [ ] 授權重新導向 URI 已設定：
  - [ ] `http://localhost:5173`
  - [ ] `http://localhost:3000`
- [ ] Client ID 和 Client Secret 已取得

### ✅ 後端設定

- [ ] 已進入 `backend/` 目錄
- [ ] 執行 `npm install` 安裝依賴
- [ ] 複製 `.env.example` 到 `.env`
- [ ] 編輯 `.env` 並填入以下資訊：
  - [ ] `DB_NAME=project_web`
  - [ ] `DB_USER=chunwencheng`
  - [ ] `DB_PASSWORD=` （如需要）
  - [ ] `GOOGLE_CLIENT_ID=你的Google用戶端ID`
  - [ ] `GOOGLE_CLIENT_SECRET=你的Google用戶端密鑰`
  - [ ] `JWT_SECRET=隨機生成的32位元以上字串`
  - [ ] `FRONTEND_URL=http://localhost:5173`
  - [ ] `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`
- [ ] 執行 `npm run dev` 啟動開發服務器
- [ ] 確認看到以下訊息：
  - [ ] ✅ Database connection established successfully
  - [ ] ✅ Database models synchronized
  - [ ] 🚀 Server is running on port 5000

### ✅ 前端設定

- [ ] 已進入 `frontend/` 目錄
- [ ] 執行 `npm install` 安裝依賴
- [ ] 複製 `.env.example` 到 `.env`
- [ ] 編輯 `.env` 並填入以下資訊：
  - [ ] `VITE_API_URL=http://localhost:5000/api`
  - [ ] `VITE_GOOGLE_CLIENT_ID=你的Google用戶端ID`
- [ ] 執行 `npm run dev` 啟動開發服務器
- [ ] 確認看到以下訊息：
  - [ ] VITE ready in XXX ms
  - [ ] Local: http://localhost:5173/

### ✅ 功能測試

- [ ] 打開瀏覽器訪問 http://localhost:5173
- [ ] 看到登入頁面
- [ ] 點擊「使用 Google 登入」
- [ ] Google 登入流程成功
- [ ] 重定向到儀表板頁面
- [ ] 看到用戶名稱和頭像
- [ ] 側邊欄導航正常
- [ ] 統計卡片顯示正常

---

## 🚀 生產環境部署

### ✅ 準備工作

- [ ] 選擇雲端服務提供商
  - [ ] AWS
  - [ ] Google Cloud Platform
  - [ ] Azure
  - [ ] Heroku
  - [ ] DigitalOcean
  - [ ] Vercel（前端）+ Railway/Render（後端）
- [ ] 購買域名（如需要）
- [ ] 設定 SSL 憑證

### ✅ Google OAuth 生產設定

- [ ] 在 OAuth 同意畫面中添加生產域名
- [ ] 更新授權 JavaScript 來源（添加生產 URL）
- [ ] 更新授權重新導向 URI（添加生產 URL）
- [ ] 發布應用程式（如需對外開放）

### ✅ 資料庫部署

- [ ] 選擇資料庫託管方案
  - [ ] 雲端提供商的託管 PostgreSQL
  - [ ] 自架 PostgreSQL 伺服器
- [ ] 建立生產資料庫
- [ ] 執行資料庫架構
- [ ] 設定資料庫備份策略
- [ ] 配置資料庫安全規則
- [ ] 記錄資料庫連接資訊

### ✅ 後端部署

- [ ] 建置生產版本：`npm run build`
- [ ] 設定環境變數（生產環境）：
  - [ ] `NODE_ENV=production`
  - [ ] 生產資料庫連接資訊
  - [ ] 生產 Google OAuth 憑證
  - [ ] 強密碼的 JWT_SECRET
  - [ ] 生產前端 URL
  - [ ] 更新 CORS 設定
- [ ] 配置反向代理（Nginx/Apache）
- [ ] 設定 PM2 或其他進程管理器
- [ ] 配置日誌記錄
- [ ] 設定監控和警報
- [ ] 測試 API 端點

### ✅ 前端部署

- [ ] 更新 `.env.production`：
  - [ ] `VITE_API_URL=https://your-api-domain.com/api`
  - [ ] `VITE_GOOGLE_CLIENT_ID=生產環境的Google用戶端ID`
- [ ] 建置生產版本：`npm run build`
- [ ] 部署 `dist/` 目錄到：
  - [ ] Vercel
  - [ ] Netlify
  - [ ] AWS S3 + CloudFront
  - [ ] Nginx 靜態伺服器
- [ ] 配置 CDN（可選）
- [ ] 設定快取策略
- [ ] 測試所有頁面和路由

### ✅ 安全性檢查

- [ ] 所有敏感資訊已從代碼中移除
- [ ] `.env` 檔案已添加到 `.gitignore`
- [ ] 資料庫密碼強度足夠
- [ ] JWT_SECRET 長度 >= 32 字元
- [ ] CORS 只允許可信來源
- [ ] 啟用 HTTPS（SSL/TLS）
- [ ] 設定 rate limiting
- [ ] 啟用 Helmet 安全標頭
- [ ] SQL 注入防護（Sequelize）
- [ ] XSS 防護
- [ ] CSRF 防護（如需要）

### ✅ 效能優化

- [ ] 前端程式碼壓縮和混淆
- [ ] 圖片優化
- [ ] 啟用 Gzip 壓縮
- [ ] 配置瀏覽器快取
- [ ] CDN 配置（可選）
- [ ] 資料庫查詢優化
- [ ] 資料庫索引檢查

### ✅ 監控和日誌

- [ ] 設定應用程式監控
  - [ ] New Relic
  - [ ] Datadog
  - [ ] Sentry
- [ ] 配置錯誤追蹤
- [ ] 設定正常運行時間監控
- [ ] 配置日誌聚合
- [ ] 設定警報規則

### ✅ 備份策略

- [ ] 自動資料庫備份
- [ ] 定期測試備份還原
- [ ] 代碼版本控制（Git）
- [ ] 環境變數備份

### ✅ 文檔

- [ ] 更新 README 包含生產部署資訊
- [ ] 記錄伺服器存取資訊
- [ ] 記錄資料庫連接資訊
- [ ] 建立故障排除文檔
- [ ] 建立操作手冊

### ✅ 最終測試

- [ ] 在生產環境測試所有功能
- [ ] 測試 Google 登入
- [ ] 測試 API 呼叫
- [ ] 測試資料庫操作
- [ ] 測試錯誤處理
- [ ] 測試效能
- [ ] 跨瀏覽器測試
- [ ] 移動設備測試

---

## 🔒 安全最佳實踐

### 環境變數管理

**❌ 絕對不要：**
```bash
# 不要將 .env 提交到 Git
git add .env  # ❌
```

**✅ 應該：**
```bash
# 確保 .gitignore 包含 .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 密鑰生成

**生成強密碼的 JWT_SECRET：**
```bash
# 方法 1：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法 2：使用 OpenSSL
openssl rand -hex 32

# 方法 3：線上生成器
# https://randomkeygen.com/
```

### 資料庫安全

**建立應用程式專用資料庫用戶：**
```sql
-- 不要使用 root 或 postgres 用戶
CREATE USER pm_app_prod WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE project_web TO pm_app_prod;
```

---

## 📊 效能基準

### 預期指標

- **API 響應時間：** < 200ms（本地）
- **頁面載入時間：** < 2s（首次載入）
- **資料庫查詢：** < 50ms（簡單查詢）
- **Lighthouse 分數：** > 90（效能）

### 監控指標

- CPU 使用率
- 記憶體使用率
- 資料庫連接數
- API 請求率
- 錯誤率
- 正常運行時間

---

## 🐛 故障排除

### 常見部署問題

**問題：** 資料庫連接失敗

**檢查：**
- [ ] 資料庫服務是否運行
- [ ] 連接資訊是否正確
- [ ] 防火牆規則
- [ ] 網路連接

**問題：** Google OAuth 失敗

**檢查：**
- [ ] Client ID 是否正確
- [ ] 授權 URI 是否包含生產 URL
- [ ] OAuth 同意畫面是否已發布

**問題：** CORS 錯誤

**檢查：**
- [ ] `ALLOWED_ORIGINS` 包含前端 URL
- [ ] 沒有拼寫錯誤
- [ ] 包含正確的協議（http/https）

---

## ✅ 完成！

當所有檢查項目都打勾後，您的應用程式就可以上線了！

記得定期：
- 更新依賴套件
- 檢查安全漏洞
- 備份資料庫
- 監控效能
- 查看日誌

---

**GitHub 倉庫：** https://github.com/kaiser-ok/project_web
**文檔：** 查看 README.md 和其他 .md 文件

祝您部署順利！ 🎉
