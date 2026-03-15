import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { initializeApp, cert } from 'firebase-admin/app'
import { zodToJsonSchema } from 'zod-to-json-schema'

// ── Tool imports ──
import { CREATE_INVOICE_TOOL, handleCreateInvoice } from './tools/invoiceTools.js'
import {
  LIST_DOCUMENTS_TOOL, handleListDocuments,
  GET_DOCUMENT_TOOL, handleGetDocument,
  CREATE_DOCUMENT_TOOL, handleCreateDocument,
  UPDATE_DOCUMENT_TOOL, handleUpdateDocument,
  DELETE_DOCUMENT_TOOL, handleDeleteDocument,
  DELETE_DOCUMENTS_TOOL, handleDeleteDocuments,
} from './tools/mdDocumentTools.js'
import {
  LIST_BANK_SETTINGS_TOOL, handleListBankSettings,
  CREATE_BANK_SETTING_TOOL, handleCreateBankSetting,
  UPDATE_BANK_SETTING_TOOL, handleUpdateBankSetting,
  DELETE_BANK_SETTING_TOOL, handleDeleteBankSetting,
  LIST_BILLS_TOOL, handleListBills,
  CREATE_BILL_TOOL, handleCreateBill,
  UPDATE_BILL_TOOL, handleUpdateBill,
  DELETE_BILL_TOOL, handleDeleteBill,
} from './tools/billTools.js'
import {
  LIST_STOCK_TRANSACTIONS_TOOL, handleListStockTransactions,
  CREATE_STOCK_TRANSACTION_TOOL, handleCreateStockTransaction,
  DELETE_STOCK_TRANSACTION_TOOL, handleDeleteStockTransaction,
} from './tools/stockTools.js'

// ===== Firebase Admin 初始化 =====
const credPath = process.env['GOOGLE_APPLICATION_CREDENTIALS']
if (credPath) {
  initializeApp({ credential: cert(credPath) })
} else {
  initializeApp()
}

// ===== MCP Server =====
const server = new Server(
  { name: 'my-portal-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// ===== Tool 註冊表 =====
const TOOLS = [
  CREATE_INVOICE_TOOL,
  // MDDocument
  LIST_DOCUMENTS_TOOL,
  GET_DOCUMENT_TOOL,
  CREATE_DOCUMENT_TOOL,
  UPDATE_DOCUMENT_TOOL,
  DELETE_DOCUMENT_TOOL,
  DELETE_DOCUMENTS_TOOL,
  // Bill
  LIST_BANK_SETTINGS_TOOL,
  CREATE_BANK_SETTING_TOOL,
  UPDATE_BANK_SETTING_TOOL,
  DELETE_BANK_SETTING_TOOL,
  LIST_BILLS_TOOL,
  CREATE_BILL_TOOL,
  UPDATE_BILL_TOOL,
  DELETE_BILL_TOOL,
  // Stock
  LIST_STOCK_TRANSACTIONS_TOOL,
  CREATE_STOCK_TRANSACTION_TOOL,
  DELETE_STOCK_TRANSACTION_TOOL,
]

// ===== Tool Handler 對應表 =====
type ToolResult = { content: { type: 'text'; text: string }[] }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HANDLERS: Record<string, (args: any) => Promise<ToolResult>> = {
  create_invoice: handleCreateInvoice,
  // MDDocument
  list_documents: handleListDocuments,
  get_document: handleGetDocument,
  create_document: handleCreateDocument,
  update_document: handleUpdateDocument,
  delete_document: handleDeleteDocument,
  delete_documents: handleDeleteDocuments,
  // Bill
  list_bank_settings: handleListBankSettings,
  create_bank_setting: handleCreateBankSetting,
  update_bank_setting: handleUpdateBankSetting,
  delete_bank_setting: handleDeleteBankSetting,
  list_bills: handleListBills,
  create_bill: handleCreateBill,
  update_bill: handleUpdateBill,
  delete_bill: handleDeleteBill,
  // Stock
  list_stock_transactions: handleListStockTransactions,
  create_stock_transaction: handleCreateStockTransaction,
  delete_stock_transaction: handleDeleteStockTransaction,
}

// ===== 列出所有 Tools =====
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.schema),
  })),
}))

// ===== 執行 Tool =====
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  const handler = HANDLERS[name]
  if (handler) {
    return handler(args)
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ success: false, error: `未知的 Tool: ${name}` }),
    }],
  }
})

// ===== 啟動 =====
const main = async () => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[INFO] my-portal-mcp server started')
}

main().catch((err) => {
  console.error('[FATAL] Server failed to start:', err)
  process.exit(1)
})
