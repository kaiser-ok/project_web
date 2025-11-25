# Google OAuth 設定指南

本文檔將引導您完成 Google OAuth 2.0 的設定，以便在專案管理系統中使用 Google 登入功能。

## 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部的專案下拉選單
3. 點擊「新增專案」
4. 輸入專案名稱（例如：「專案管理系統」）
5. 點擊「建立」

## 步驟 2：啟用 Google+ API

1. 在左側選單中，選擇「API 和服務」 > 「程式庫」
2. 搜尋「Google+ API」
3. 點擊「Google+ API」
4. 點擊「啟用」

## 步驟 3：建立 OAuth 2.0 憑證

1. 在左側選單中，選擇「API 和服務」 > 「憑證」
2. 點擊「建立憑證」 > 「OAuth 用戶端 ID」
3. 如果這是第一次建立，需要先設定「OAuth 同意畫面」

### 設定 OAuth 同意畫面

1. 選擇「外部」（如果您的組織沒有 Google Workspace）
2. 點擊「建立」

#### 步驟 1：應用程式資訊

- **應用程式名稱**：專案管理系統
- **使用者支援電子郵件**：您的電子郵件
- **應用程式首頁**：http://localhost:3000（開發環境）
- **應用程式隱私權政策連結**：（可選）
- **應用程式服務條款連結**：（可選）
- **授權網域**：localhost（開發環境）
- **開發人員聯絡資訊**：您的電子郵件
- 點擊「儲存並繼續」

#### 步驟 2：範圍

- 點擊「新增或移除範圍」
- 選擇以下範圍：
  - `../auth/userinfo.email`
  - `../auth/userinfo.profile`
  - `openid`
- 點擊「更新」
- 點擊「儲存並繼續」

#### 步驟 3：測試使用者（開發模式）

- 點擊「新增使用者」
- 輸入要測試的 Google 帳號電子郵件
- 點擊「新增」
- 點擊「儲存並繼續」

#### 步驟 4：摘要

- 檢查資訊
- 點擊「返回資訊主頁」

### 建立 OAuth 用戶端 ID

1. 返回「憑證」頁面
2. 點擊「建立憑證」 > 「OAuth 用戶端 ID」
3. 應用程式類型：選擇「網頁應用程式」
4. 名稱：專案管理系統
5. **授權 JavaScript 來源**：
   - http://localhost:3000
   - http://localhost:5173（Vite 預設端口）
6. **授權重新導向 URI**：
   - http://localhost:3000
   - http://localhost:5173
7. 點擊「建立」

## 步驟 4：取得憑證

建立完成後，會顯示一個對話框，包含：

- **用戶端 ID**：類似 `123456789-abc123.apps.googleusercontent.com`
- **用戶端密鑰**：類似 `GOCSPX-abc123xyz789`

**重要**：請妥善保管這些憑證！

## 步驟 5：配置應用程式

### 後端配置

編輯 `backend/.env` 檔案：

```env
GOOGLE_CLIENT_ID=你的用戶端ID
GOOGLE_CLIENT_SECRET=你的用戶端密鑰
```

### 前端配置

編輯 `frontend/.env` 檔案：

```env
VITE_GOOGLE_CLIENT_ID=你的用戶端ID
```

## 步驟 6：測試

1. 啟動後端服務器：
```bash
cd backend
npm install
npm run dev
```

2. 啟動前端應用：
```bash
cd frontend
npm install
npm run dev
```

3. 在瀏覽器中打開 http://localhost:5173（或 http://localhost:3000）
4. 點擊「使用 Google 登入」
5. 選擇您的 Google 帳號
6. 授權應用程式

## 常見問題

### Q1: 出現「redirect_uri_mismatch」錯誤

**解決方案**：
- 檢查 Google Cloud Console 中的「授權重新導向 URI」設定
- 確保包含您使用的完整 URL（包括 http:// 和端口號）

### Q2: 出現「Access blocked: This app's request is invalid」

**解決方案**：
- 檢查 OAuth 同意畫面是否正確配置
- 確保在「測試使用者」中添加了您的 Google 帳號（開發模式）

### Q3: Token 驗證失敗

**解決方案**：
- 確認 `GOOGLE_CLIENT_ID` 在前後端都配置正確
- 檢查後端的 `GOOGLE_CLIENT_SECRET` 是否正確

### Q4: CORS 錯誤

**解決方案**：
- 確保後端的 CORS 設定包含前端 URL
- 檢查 `backend/.env` 中的 `ALLOWED_ORIGINS`

## 生產環境部署

部署到生產環境時，需要：

1. **更新授權網域**：
   - 在 Google Cloud Console 的 OAuth 同意畫面中
   - 添加您的生產域名（例如：yourdomain.com）

2. **更新授權 JavaScript 來源和重新導向 URI**：
   - 添加生產環境的 URL
   - 例如：https://yourdomain.com

3. **發布應用程式**（選用）：
   - 如果要讓任何 Google 用戶都能登入
   - 在 OAuth 同意畫面中點擊「發布應用程式」
   - 可能需要通過 Google 審核

4. **更新環境變數**：
   - 在生產環境中設定正確的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
   - 不要將 `.env` 檔案提交到版本控制

## 安全建議

1. **絕對不要**將 `.env` 檔案提交到 Git
2. **絕對不要**在前端代碼中暴露 `GOOGLE_CLIENT_SECRET`
3. 定期輪換 OAuth 憑證
4. 只請求必要的範圍
5. 在生產環境使用 HTTPS
6. 實施 rate limiting 防止濫用
7. 記錄和監控認證活動

## 參考資源

- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [@react-oauth/google 文檔](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library 文檔](https://www.npmjs.com/package/google-auth-library)

## 支援

如果遇到問題，請：
1. 檢查 Google Cloud Console 的錯誤日誌
2. 檢查瀏覽器控制台的錯誤訊息
3. 檢查後端服務器的日誌
4. 查閱上述參考資源

---

配置完成後，您的應用程式就可以使用 Google OAuth 進行用戶認證了！
