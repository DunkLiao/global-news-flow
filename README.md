# 📰 NewsFlow — 每日新聞聚合使用者操作手冊

歡迎使用 **NewsFlow**！這是一個專為現代閱讀設計的純前端新聞聚合 Web 應用程式。本手冊將指引您完成環境設定，並詳細介紹如何操作 NewsFlow 來獲取全球最即時的新聞資訊。

---

## 1. 系統運作流程圖

NewsFlow 透過底層的多來源併發架構，自動為您彙總、去重並排序多個國際新聞 API 來源。以下是系統載入新聞時的運作邏輯：

```mermaid
graph TD
    Start([使用者開啟 NewsFlow]) --> CheckKeys{系統檢查 API Key 設定}
    CheckKeys -- 均未設定 --> ShowNoKeyError[顯示「尚未設定任何新聞 API Key」錯誤]
    CheckKeys -- 至少已設定一個 --> ParallelFetch[併發請求所有已設定的 API 來源]
    
    ParallelFetch --> FetchNewsAPI[NewsAPI.org]
    ParallelFetch --> FetchGNews[GNews.io]
    ParallelFetch --> FetchMediaStack[MediaStack.com]
    
    FetchNewsAPI --> HandleAPIResult{請求結果}
    FetchGNews --> HandleAPIResult
    FetchMediaStack --> HandleAPIResult
    
    HandleAPIResult -- 成功 --> CollectArticles[收集新聞文章]
    HandleAPIResult -- 失敗 / 額度用盡 --> LogError[忽略此來源並記錄錯誤]
    
    CollectArticles --> MergeResults[彙總所有成功來源的文章]
    LogError --> CheckAllFailed{是否所有來源皆失敗?}
    
    CheckAllFailed -- 是 --> ShowErrorState[UI 顯示對應的額度用盡/連線錯誤提示]
    CheckAllFailed -- 否 --> MergeResults
    
    MergeResults --> Deduplicate[新聞去重: 以 URL 比對去除重複文章]
    Deduplicate --> SortByDate[時間排序: 依 publishedAt 由新到舊排序]
    SortByDate --> RenderUI[渲染至新聞網格 News Grid]
    RenderUI --> End([使用者瀏覽即時新聞])
```

---

## 2. 快速入門與設定

在開始瀏覽新聞之前，您需要先為專案設定新聞資料來源的 API Key (金鑰)。

### 步驟 1：申請免費的 API 金鑰
您可以選擇申請以下一至多個新聞 API 服務的免費金鑰：
- **NewsAPI** (推薦)：至 [newsapi.org](https://newsapi.org/register) 免費註冊申請。
- **GNews**：至 [gnews.io](https://gnews.io) 免費申請。
- **MediaStack**：至 [mediastack.com](https://mediastack.com) 免費申請。

> [!TIP]
> 申請多個 API 金鑰可以帶來更好的容錯體驗。當其中一個 API 額度用盡時，NewsFlow 會自動無感切換至其他仍有額度的金鑰，確保您的新聞閱讀不被中斷！

### 步驟 2：設定環境變數
1. 在專案根目錄中，將 `.env.example` 檔案複製一份並重新命名為 `.env`：
   - **Windows** (PowerShell): `copy .env.example .env`
   - **macOS / Linux**: `cp .env.example .env`
2. 使用文字編輯器開啟 `.env` 檔案，填入您申請到的 API 金鑰：
   ```env
   VITE_NEWS_API_KEY=您的_NewsAPI_金鑰
   VITE_GNEWS_API_KEY=您的_GNews_金鑰
   VITE_MEDIASTACK_API_KEY=您的_MediaStack_金鑰
   ```

### 步驟 3：安裝與啟動
在終端機中依序執行以下指令：

```bash
# 1. 安裝套件依賴
npm install

# 2. 啟動開發伺服器
npm run dev
```

啟動後，請在瀏覽器中開啟 `http://localhost:5173` 即可開始使用！

> [!IMPORTANT]
> 每次修改 `.env` 檔案後，**必須重新啟動開發伺服器**（在終端機按 `Ctrl + C` 關閉後重新執行 `npm run dev`），系統才能成功載入新的環境變數。

---

## 3. 介面操作指南

NewsFlow 的介面採用精簡、無障礙的雙欄佈局：

### 📁 左側側邊欄（Sidebar）
側邊欄是您的篩選中心，提供多維度的新聞篩選：
* **搜尋新聞**：
  * 輸入關鍵字後，系統會於 **400 毫秒 (Debounce)** 後自動發送搜尋請求，避免頻繁發送無效請求。
  * **搜尋模式**：一旦啟用搜尋，系統會暫時停用「地區」與「類別」篩選，改以全球、全類別的關鍵字進行全站模糊檢索。
  * 點擊輸入框右側的 `×` 按鈕可一鍵清除關鍵字並返回預設首頁。
* **類別 Pills 篩選**：
  * 提供「全部、商業、科技、科學、健康、娛樂、體育」等多個分類按鈕。
  * 選中特定類別時，Pill 會呈現專屬的高對比代表色（如「商業」為綠色、「科技」為青藍色），便於視覺快速識別。
* **地區下拉選單**：
  * 預設為 **「不區分」**，系統將拉取全球即時新聞。
  * 您亦可選擇特定的國家/地區（如美國、台灣、中國大陸、日本、韓國）以集中閱讀該地區的專利或報導。

### 📰 右側主內容區（Main Content）
主要的新聞呈現區，包含：
* **新聞網格 (News Grid)**：
  * 自動適應螢幕大小，採用響應式設計（RWD）：桌機 3 欄 / 平板 2 欄 / 手機 1 欄。
* **新聞卡片 (News Card)**：
  * 每張卡片均顯示新聞封面圖、媒體來源、發布時間、標題、摘要。
  * 若新聞沒有封面圖，會顯示質感的預設佔位圖。
  * 點擊卡片標題或「閱讀全文」，會於新分頁開啟原始報導網頁。
* **分頁導航 (Pagination)**：
  * 提供分頁切換，為保護免費帳戶不因請求過深而報錯，最大分頁限制為 **5 頁** (共 100 筆結果)。
  * 當您切換地區、類別或輸入關鍵字時，頁碼會**智慧自動重設回第 1 頁**。

---

## 4. 常見問題與障礙排除 (FAQ)

### ❓ 問題一：網頁呈現「尚未設定任何新聞 API Key」錯誤提示
* **原因**：您未在根目錄建立 `.env` 檔案，或 `.env` 檔案內部的金鑰格式不正確（例如沒有去除引號或有多餘的空格）。
* **排除方法**：請確認已依照 **2. 快速入門** 的步驟建立 `.env`，填入有效金鑰，並**重啟開發伺服器**。

### ❓ 問題二：網頁呈現「API 配額已用盡」錯誤提示
* **原因**：
  * NewsAPI 的免費 Developer Plan 限制每天 100 次請求。
  * GNews 的免費方案限制每天 100 次請求。
  * MediaStack 限制每月 1,000 次請求。
  * 當您配置的**所有金鑰**都超過了今日/當月的免費額度限制時，系統才會顯示此提示。
* **排除方法**：
  * 建議在 `.env` 中同時填入三個來源的金鑰，以啟動自動容錯機制。
  * 稍等一段時間（如隔日重置）或更換其他免費金鑰。

### ❓ 問題三：切換地區後，新聞讀取失敗或連線失敗
* **原因**：本專案採用 `corsproxy.io` 做為 CORS 跨網域代理伺服器。若代理伺服器暫時壅塞，可能會導致連線超時。
* **排除方法**：請點擊頁面上的 **「重新嘗試」** 按鈕以再次發送請求，或檢查您的網路連線。

---

## 5. 專案維護與建置

若是開發者需要進行二次開發或打包佈署：

```bash
# 執行 ESLint 語法檢查
npm run lint

# 執行 TypeScript 靜態型別檢查與 Vite 打包建置
npm run build

# 本地預覽生產環境建置後的結果
npm run preview
```

Vite 建置產出之靜態檔案將儲存於 `/dist` 資料夾，即可直接部署至 Netlify、Vercel 或 GitHub Pages 等靜態託管平台。
