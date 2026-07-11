# NewsFlow — 每日新聞聚合

純前端新聞聚合 Web App，串接 [NewsAPI](https://newsapi.org) 取得真實即時新聞。佈局為左側 Sidebar + 右側 Main Content，支援類別篩選、地區切換、分頁導航與關鍵字搜尋。

## 1) 專案特色與最新更新

為了克服 NewsAPI 免費方案（Developer Plan）的限制與資料庫覆蓋率問題，本專案進行了多項核心架構升級：

- **地區擴充與資料優化**：
  - 新增 **中國大陸（`cn`）** 地區。
  - **自動退回機制 (Fallback)**：解決 NewsAPI 免費版中非美國地區（`tw`、`cn`、`jp`、`kr`）在 `/top-headlines` 回傳 0 筆新聞的限制，自動改以 `/everything` 端點進行多條件模糊檢索。
- **新聞精準度過濾**：
  - **語言限縮**：針對 `tw` 與 `cn` 地區強制使用 `language=zh`（中文），防止非中文或國外新聞混雜。
  - **網域排除機制 (`excludeDomains`)**：在選擇「中國大陸」時，自動排除台灣與香港的大型入口及社群網站（如 Yahoo 奇摩新聞、TechBang、cna.com.tw 等），確保顯示的新聞完全聚焦於中國大陸本土媒體或專屬資訊源。
- **現代分頁導航 (Pagination)**：
  - 調整每頁載入數量（`PAGE_SIZE`）為 **20 筆**，使新聞網格呈現更為對稱且好閱讀。
  - **安全封頂保護**：NewsAPI 免費帳戶限制最大請求深度為 100 筆。本分頁組件最大僅顯示 5 頁，避免請求溢出造成 `maximumResultsReached` API 錯誤。
  - **智慧狀態重設**：切換國家、分類或輸入新搜尋關鍵字時，頁碼會自動重置回第 `1` 頁。

## 2) 專案結構

```
ai-news-flow/
├── package.json
├── vite.config.ts
├── index.html
├── .env.example              ← API Key 範本
├── public/
│   └── placeholder-news.svg  ← 無封面圖時的預設圖
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/news.ts         ← 擴充分頁查詢類型定義
    ├── constants/
    │   ├── categories.ts
    │   └── countries.ts      ← 新增中國大陸地區
    ├── services/
    │   └── newsApi.ts        ← 封裝退回檢索、分頁大小、語言與網域排除邏輯
    ├── hooks/
    │   ├── useDebounce.ts
    │   └── useNews.ts        ← 管理分頁狀態與智慧重置
    ├── utils/
    │   └── formatTime.ts
    └── components/
        ├── Sidebar/
        ├── MainContent/      ← 整合分頁控制渲染
        ├── NewsGrid/
        ├── NewsCard/
        └── ui/
            ├── EmptyState.tsx
            ├── ErrorState.tsx
            ├── LoadingState.tsx
            ├── Pagination.tsx         ← 新增：分頁導航組件
            └── Pagination.module.css  ← 新增：分頁動態過渡與微互動樣式
```

## 3) 安裝與啟動

### 前置需求

- Node.js 18+（建議 20+）
- NewsAPI 免費 API Key：https://newsapi.org/register

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 設定 API Key（必要）
#    複製範本並編輯 .env
copy .env.example .env
#    macOS / Linux：cp .env.example .env

# 3. 開啟 .env，填入你的金鑰：
#    VITE_NEWS_API_KEY=你的_newsapi_金鑰

# 4. 啟動開發伺服器
npm run dev
```

瀏覽器開啟終端機顯示的本機網址（預設 `http://localhost:5173`）。

> **重要**：修改 `.env` 後必須重新執行 `npm run dev`，Vite 才會讀到新的環境變數。

### API Key 填寫位置

| 檔案 | 變數 |
|------|------|
| 專案根目錄 `.env` | `VITE_NEWS_API_KEY=xxxxxxxx` |

`.env` 已列入 `.gitignore`，不會被提交。請勿把金鑰寫進原始碼。

### 其他指令

```bash
npm run build    # 型別檢查 + 正式建置
npm run preview  # 預覽建置結果
npm run lint     # 使用 oxlint 執行極速程式碼檢查
```

---

## 4) 主要功能對應

### Sidebar（左側）

- 品牌：NewsFlow / 每日新聞聚合
- 搜尋框（400ms debounce）
- 類別 pills：全部、商業、科技、科學、健康、娛樂、體育
- 地區下拉：美國、台灣、中國大陸、日本、韓國

### Main Content（右側）

- 標題顯示目前類別或搜尋關鍵字 + 結果筆數
- 新聞網格：桌面 3 欄 / 平板 2 欄 / 手機 1 欄
- 新聞卡片：封面圖、來源、相對時間、標題、摘要、「閱讀全文」（新分頁，`rel="noopener noreferrer"`）
- **分頁控制器**：顯示當前頁碼與 1~5 頁選項，支援點擊直接切換與首尾頁禁用保護。

### API 查詢映射邏輯

| 篩選條件 | 使用 API 端點 | 參數建構與過濾邏輯 |
|---|---|---|
| **有搜尋關鍵字** | `/v2/everything` | `q=關鍵字` |
| **無關鍵字 ＋ 美國** | `/v2/top-headlines` | `country=us` ＋ 類別篩選 |
| **無關鍵字 ＋ 非美國（台、陸、日、韓）** | `/v2/everything` | 地區與分類專屬關鍵字 ＋ `publishedAt` 排序 ＋ 中文語言限制 ＋ 陸區網域排除 |

---

## 5) 錯誤處理與健壯性設計

- **未設定 API Key**：不送出無效請求，顯示設定 `.env` 的步驟提示
- **Key 無效 / 停用**：友善錯誤 + 檢查 newsapi.org 與重新啟動 dev server
- **配額用盡（rate limit）**：提示稍後再試或升級方案
- **網路 / Proxy 失敗**：連線失敗訊息，可按「重新嘗試」
- **無結果**：空狀態「無符合條件的新聞」，非崩潰
- **無封面圖 / 圖片載入失敗**：使用 `/placeholder-news.svg`
- **缺摘要 / 來源 / 標題**：顯示預設字串
- **競態**：`AbortController` 取消過期請求，避免快速切換時畫面錯亂
- **搜尋模式**：類別與地區控件暫時停用（everything端點不支援該參數）

## License

MIT（範例專案，可自由修改）
