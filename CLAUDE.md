# Claude Code 專案指南 — my-portal-mcp

## 首先閱讀

1. **PROJECT.md** - 技術棧、MCP Tools 清單、常用指令
2. **ARCHITECTURE.md** - 目錄結構、分層原則、命名規範、資料流
3. **MCP_PRD.md** - 產品需求規格（功能定義、資料模型、驗證規則）

## MCP Tools 快速索引

| Tool 名稱 | 模組 | 主要檔案 |
|-----------|------|---------|
| `create_invoice` | 發票 | `src/tools/invoiceTools.ts`, `src/apis/invoiceApi.ts`, `src/types/Invoice.ts` |

## 按需查看原則

- MCP Tool 邏輯 → `src/tools/xxxTools.ts`
- Firebase CRUD → `src/apis/xxxApi.ts`
- 型別定義 → `src/types/Xxx.ts`
- 伺服器進入點 → `src/index.ts`

## 新增功能模組標準流程

1. `src/types/ModuleName.ts` — 純型別定義（嚴禁 import 外部套件）
2. `src/apis/moduleNameApi.ts` — Firebase Admin SDK CRUD
3. `src/tools/moduleNameTools.ts` — MCP Tool 定義（Zod 驗證 + 呼叫 api 層）
4. `src/index.ts` — 註冊新 Tool

## 核心開發規範（必讀）

> **絕對禁止 `console.log`**
> stdout 由 MCP SDK 用於 JSON-RPC 通訊，任何 `console.log` 都會破壞協定導致 Server 崩潰。
> 所有 debug / 警告 / 錯誤訊息一律使用 `console.error`（輸出至 stderr）。

- **types 層**：嚴禁依賴任何外部套件（含 Firebase SDK）
- **apis 層**：所有 Firestore Timestamp 轉型在此處理，不得外漏至 tools 層
- **tools 層**：所有輸入參數必須經過 Zod 驗證，防呆邏輯（如重複資料檢查）在此執行
