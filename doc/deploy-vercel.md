# Vercel 部署指南

本文件詳細說明如何將 **global-news-flow** 專案部署至 **Vercel** 雲端平台。本專案為基於 React 與 Vite 建構的單頁面應用程式 (SPA)。

---

## 🚀 部署前準備

本專案需要連接多個第三方新聞 API。在部署前，請先準備好以下 API 金鑰 (API Key)：

1. **NewsAPI 金鑰**
   - 取得管道：[NewsAPI 官網](https://newsapi.org/register)
   - 變數名稱：`VITE_NEWS_API_KEY`
2. **GNews 金鑰**
   - 取得管道：[GNews 官網](https://gnews.io)
   - 變數名稱：`VITE_GNEWS_API_KEY`
3. **MediaStack 金鑰**
   - 取得管道：[MediaStack 官網](https://mediastack.com)
   - 變數名稱：`VITE_MEDIASTACK_API_KEY`

---

## 🛠 方式一：使用 Vercel 後台進行 Git 連動部署（推薦）

這是最簡單且支援持續整合/持續部署 (CI/CD) 的做法。當您推送代碼至 GitHub/GitLab 時，Vercel 會自動進行建置。

### 步驟 1：推送代碼至 Git 倉庫
請確保專案根目錄下的 `vercel.json` 與 `.gitignore` 皆已包含最新配置，並推送至您的 Git 遠端倉庫。

### 步驟 2：在 Vercel 匯入專案
1. 登入 [Vercel 專案後台](https://vercel.com/dashboard)。
2. 點擊右上角的 **Add New**，選擇 **Project**。
3. 連結您的 GitHub/GitLab 帳號，並找到 `global-news-flow` 倉庫，點擊 **Import**。

### 步驟 3：配置專案設定
在 **Configure Project** 頁面中：
- **Framework Preset**：Vercel 會自動偵測並選擇 **Vite**。
- **Root Directory**：保持預設的 `./`。
- **Build and Output Settings**：
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`
- **Environment Variables（關鍵步驟）**：
  展開 Environment Variables 區塊，依次新增準備好的環境變數：
  - `VITE_NEWS_API_KEY`
  - `VITE_GNEWS_API_KEY`
  - `VITE_MEDIASTACK_API_KEY`

### 步驟 4：開始部署
點擊 **Deploy** 按鈕。Vercel 會開始下載依賴並打包，建置完成後會提供一個專屬的網址（例如 `https://your-project.vercel.app`）。

---

## 💻 方式二：使用 Vercel CLI 本地指令部署

如果您偏好使用終端機直接部署，可以使用 Vercel 命令列工具。

### 步驟 1：安裝 Vercel CLI
若您的電腦尚未安裝 Vercel CLI，請先全域安裝：
```bash
npm install -g vercel
```

### 步驟 2：登入與初始化
在專案根目錄下執行：
```bash
vercel
```
依照畫面提示進行登入並關聯/建立專案：
- `Set up and deploy ...?` 輸入 `y`。
- 選擇您的 Vercel 帳號與團隊。
- `Link to existing project?` 輸入 `N`（建立新專案）。
- `What’s your project’s name?` 輸入專案名稱（例如 `global-news-flow`）。
- `In which directory is your code located?` 保持預設 `./`。
- `Want to modify these settings? [y/N]` 輸入 `N`（Vite 預設設定即可）。

### 步驟 3：配置環境變數
部署完成後，請至 Vercel Web Dashboard 的專案設定中手動補上 `VITE_NEWS_API_KEY`、`VITE_GNEWS_API_KEY`、`VITE_MEDIASTACK_API_KEY` 等環境變數。

### 步驟 4：部署至正式環境 (Production)
在本地執行以下指令進行正式發佈：
```bash
vercel --prod
```

---

## ⚙️ 部署設定說明 (`vercel.json`)

專案根目錄下的 `vercel.json` 包含以下配置：
- **`cleanUrls`**: 自動移除網址結尾的 `.html`，使 URL 看起來更乾淨。
- **`rewrites`**: 將所有非靜態檔案的請求重導向至 `/index.html`。這可以避免在未來加入 React Router 等前端路由時，使用者重新整理網頁會出現 Vercel 404 錯誤的問題。
- **`headers`**: 針對 `dist/assets` 下的打包靜態資源設置長期快取標頭，以加速二次訪問的載入速度。
