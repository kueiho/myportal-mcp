# 架構文件 — my-portal-mcp

## 目錄結構

```
my-portal-mcp/
├── src/
│   ├── index.ts              # MCP Server 進入點（stdio transport、Tool 註冊）
│   ├── apis/                 # 資料存取層（Firebase Admin SDK）
│   │   └── invoiceApi.ts     # 發票 Firestore CRUD
│   ├── tools/                # MCP Tool 定義層（Zod 驗證 + 業務防呆 + 呼叫 api）
│   │   └── invoiceTools.ts   # create_invoice 等 Tool 定義
│   └── types/                # 純 TypeScript 型別定義（嚴禁外部依賴）
│       └── Invoice.ts        # Invoice、InvoiceItem、CreateInvoiceInput 型別
├── tsconfig.json
├── package.json
├── CLAUDE.md                 # Claude Code 快速導引
├── PROJECT.md                # 技術棧與模組總覽
├── ARCHITECTURE.md           # 本文件
└── MCP_PRD.md                # 產品需求規格
```

## 分層原則

### types/ — 純型別定義層

- **嚴禁** import 任何外部套件（含 Firebase SDK、Zod 等）
- 只放 TypeScript interface / type / enum
- 目的：維持資料模型純潔性，方便跨層共用，未來更換後端也不受影響

### apis/ — 資料存取層

- 封裝所有對 Firebase Firestore 的操作（使用 Admin SDK）
- **所有 Firestore 特定的資料轉型**（如 `Timestamp` → `Date`、`serverTimestamp()`）只在此層處理，禁止外漏至 tools 層
- 函式簽章使用 types 層定義的型別，不暴露 Firestore 內部型別
- 未來若更換後端，只需替換此層實作

### tools/ — MCP Tool 定義層

- 定義 MCP Tool 的 name、description、inputSchema
- 使用 **Zod** 進行所有輸入參數的驗證與型別轉換
- 執行業務防呆邏輯（如查詢重複發票號碼）
- 呼叫 apis 層取得或寫入資料
- 回傳標準化的 MCP 工具結果（content 陣列，type: "text"）
- **禁止** 直接操作 Firestore

### index.ts — MCP Server 進入點

- 初始化 Firebase Admin App
- 建立 MCP Server 實例
- 載入並註冊所有 tools/ 下的 Tool
- 設定 stdio transport 並啟動 Server

## 命名規範

| 類型 | 規範 | 範例 |
|------|------|------|
| TypeScript 型別檔 | PascalCase | `Invoice.ts` |
| API 服務檔 | camelCase + Api | `invoiceApi.ts` |
| Tools 檔 | camelCase + Tools | `invoiceTools.ts` |
| MCP Tool 名稱 | snake_case | `create_invoice` |
| 函式名稱 | camelCase | `createInvoice`, `getInvoiceByNo` |
| Zod Schema 名稱 | camelCase + Schema | `createInvoiceSchema` |

## 資料流

```
AI Agent (MCP Client)
    ↓ JSON-RPC over stdio
MCP Server (src/index.ts)
    ↓ Tool dispatch
Tool Handler (src/tools/xxxTools.ts)
    ↓ Zod 驗證、業務防呆
API Service (src/apis/xxxApi.ts)
    ↓ Firebase Admin SDK
Firebase Firestore
```

## 通訊與日誌規範

### stdio Transport（核心限制）

MCP Server 透過 **stdio** 與 Client (AI Agent) 溝通：
- `stdout` 專用於 MCP JSON-RPC 訊息傳遞，由 SDK 完全接管
- `stderr` 用於人類可讀的日誌輸出

### 日誌規則（絕對強制）

| 情境 | 正確做法 | 錯誤做法 |
|------|---------|---------|
| 除錯訊息 | `console.error('[DEBUG] ...')` | `console.log(...)` ← **會崩潰** |
| 錯誤記錄 | `console.error('[ERROR] ...')` | `console.log(...)` ← **會崩潰** |
| 啟動訊息 | `console.error('Server started')` | `console.log(...)` ← **會崩潰** |

> **任何 `console.log` 都會污染 stdout，破壞 JSON-RPC 協定，導致 MCP Server 崩潰。**

## MCP Tool 回傳格式規範

所有 Tool handler 回傳格式必須符合 MCP SDK 標準：

### 成功回傳

```typescript
return {
  content: [
    {
      type: "text",
      text: JSON.stringify({ success: true, data: { id: "..." }, message: "操作成功" })
    }
  ]
}
```

### 失敗回傳

```typescript
return {
  content: [
    {
      type: "text",
      text: JSON.stringify({ success: false, error: "錯誤描述" })
    }
  ]
}
```

## Zod 驗證規範

每個 Tool 的輸入必須定義對應的 Zod Schema：

```typescript
// src/tools/invoiceTools.ts 範例結構
const createInvoiceSchema = z.object({
  invoiceNo: z.string().regex(/^[A-Z]{2}\d{8}$/, '發票號碼格式錯誤'),
  invoiceDate: z.string().regex(/^\d{8}$/, '日期格式需為 YYYYMMDD'),
  amount: z.number().min(0, '金額需大於或等於 0'),
  // ... 選填欄位
})

// Tool 內部使用
const parsed = createInvoiceSchema.safeParse(input)
if (!parsed.success) {
  // 回傳驗證錯誤
}
```

## Firebase Admin SDK 初始化規範

```typescript
// src/index.ts
import { initializeApp, cert } from 'firebase-admin/app'

initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!)
})

// 或使用 Application Default Credentials（當環境變數已設定時自動讀取）
initializeApp()
```

userId 透過 `process.env.PORTAL_USER_ID` 取得，在 apis 層使用，不得硬編碼。

## 錯誤處理原則

- apis 層：拋出原生 Error，不做包裝
- tools 層：catch 所有 Error，轉換為標準失敗回傳格式，並 `console.error` 記錄至 stderr
- 不讓未處理的例外傳播至 MCP SDK 層（避免整個 Server 崩潰）
