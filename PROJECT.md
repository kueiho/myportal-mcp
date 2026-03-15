# my-portal-mcp

自用 MCP (Model Context Protocol) Server，提供 AI Agent 透過標準化工具操作個人 Portal 資料的能力。

## 技術棧

| 類別 | 技術 |
|------|------|
| Runtime | Node.js |
| Language | TypeScript |
| MCP SDK | @modelcontextprotocol/sdk |
| 資料驗證 | Zod |
| 資料庫 | Firebase Firestore (Admin SDK) |
| 驗證機制 | Service Account (Server 端) |
| 通訊協定 | stdio (MCP 標準) |

## MCP Tools

| Tool | 說明 | 狀態 |
|------|------|------|
| `create_invoice` | 新增單筆發票至 Firestore，自動帶入 userId / createdAt，防重複發票號碼 | 已實作 |

## 環境設定

| 環境變數 | 說明 |
|----------|------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Service Account JSON 檔案路徑 |
| `PORTAL_USER_ID` | 操作的 userId（自用固定值） |

## 常用指令

```sh
npm install        # 安裝依賴
npm run build      # 編譯 TypeScript
npm run dev        # 開發模式（ts-node / tsx watch）
npm start          # 啟動 MCP Server（編譯後）
```

## 與 my-portal 的關係

本專案是 my-portal 的 MCP 配套後端，兩者共用同一個 Firebase 專案。

| 專案 | 本機路徑 |
|------|---------|
| my-portal（Vue 3 前端） | `/Users/jarvis/.openclaw/workspace/my-portal` |
| my-portal-mcp（本專案） | `/Users/jarvis/.openclaw/workspace/my-portal-mcp` |

資料模型與 Firestore Collection 路徑需與 my-portal 保持一致：

| 資料 | Firestore 路徑 |
|------|----------------|
| 發票 | `invoices`（根層級，含 `userId` 欄位過濾） |
| 記帳交易 | `users/{uid}/transactions/{transactionId}` |
| 帳戶 | `users/{uid}/accounts/{accountId}` |
| 分類 | `users/{uid}/categories/{categoryId}` |

## 未來擴充模組（PRD 規劃）

- 查詢發票（依期間、依號碼）
- 批次新增發票
- 刪除發票
- 記帳交易 (Transaction) 模組
- 帳戶 (Account) 模組
- 分類 (Category) 模組
