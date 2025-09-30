# Google Form 自動化建立工具

這個專案提供一個最小可行的前後端範例，協助營運人員輸入活動需求後，由系統自動建立 Google Form、綁定 Apps Script，並回傳表單連結與回應試算表連結。

## 專案結構

```
multimedia/
├── client/        # React (CDN) 前端頁面
├── server/        # Node.js Express 後端服務
└── README.md
```

## 前端 (client)

- 以 React UMD 版本搭配 Babel Standalone 在瀏覽器中即時轉譯 JSX。
- 使用者可輸入活動名稱、場次列表與自動回信內容。
- 呼叫後端 `/api/forms` API 後，將回傳的表單與試算表連結展示在畫面上。

預設畫面已帶入「科技講座」的示範資料（三個場次、每場兩人），也可自行調整。

使用方法：

1. 啟動任意靜態伺服器（例如 `npx serve client` 或將 `client/` 資料夾放到 GitHub Pages）。
2. 確保 `.env` 中的 `CORS_ORIGINS` 允許前端來源網址。

## 後端 (server)

- Node.js 18+ 搭配 Express。
- 串接 Google Forms API、Drive API、Sheets API 與 Apps Script API。
- 建立表單後自動：
  - 新增姓名 / Email / 場次三個欄位。
  - 建立並綁定回應試算表。
  - 部署 Apps Script，管理額滿場次、關閉表單以及自動回信。

### 安裝與環境變數

```bash
cd server
npm install
cp .env.example .env
# 編輯 .env 後再啟動
npm run start
```

`.env` 需提供下列參數：

| 變數 | 說明 |
| ---- | ---- |
| `PORT` | 伺服器監聽埠號，預設 4000 |
| `CORS_ORIGINS` | 允許的前端來源（逗號分隔） |
| `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REDIRECT_URI` | 若需要以 OAuth2 代管，預留設定（目前流程使用 service account） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`、`GOOGLE_SERVICE_ACCOUNT_KEY` | 具備 Forms / Drive / Sheets / Apps Script 權限的 service account |
| `GOOGLE_SCRIPT_DEPLOYMENT_ID` | 若要更新既有部署，可填入部署 ID（選填） |

### API 介面

`POST /api/forms`

```json
{
  "activityName": "夏季黑客松",
  "sessions": [
    { "name": "上午場", "capacity": 50 },
    { "name": "下午場", "capacity": 50 }
  ],
  "emailTemplate": {
    "subject": "【夏季黑客松】報名成功通知",
    "body": "您好，感謝報名。"
  }
}
```

回傳：

```json
{
  "formId": "...",
  "formUrl": "https://docs.google.com/forms/...",
  "sheetId": "...",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

## 注意事項

- 需要在 Google Cloud Console 啟用 Forms API、Drive API、Sheets API、Apps Script API。
- Service Account 需對目標 Google Workspace 擁有授權（或透過 Domain-wide delegation）。
- Apps Script 模板內容可視需求調整，自動回信與額滿邏輯皆以 service account 權限執行。
- 由於測試環境無法連線 Google API，本範例程式碼未經實際串接測試，部署前請於實際環境驗證流程。

### 自動回信占位符

寄出的郵件標題與內文支援以下占位符，系統會在寄信前自動帶入對應資訊：

| 占位符 | 內容 |
| ------ | ---- |
| `{{activityName}}` | 活動名稱 |
| `{{name}}` | 填寫者的姓名 |
| `{{session}}` | 填寫者選擇的場次 |
| `{{email}}` | 填寫者的 Email |
