import { z } from 'zod'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
} from '../apis/stockApi.js'

// ─── Zod Schemas ──────────────────────────────────────────────────────────

const listStockTransactionsSchema = z.object({}).optional()

const createStockTransactionSchema = z.object({
  type: z.enum(['buy', 'sell'], { required_error: '交易類型為必填（buy 或 sell）' }),
  symbol: z.string().min(1, '股票代碼不可為空'),
  name: z.string().min(1, '股票名稱不可為空'),
  price: z.number().min(0, '成交價需大於或等於 0'),
  shares: z.number().int().min(1, '股數需大於 0'),
  fee: z.number().min(0, '手續費需大於或等於 0').default(0),
  tax: z.number().min(0).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD'),
  notes: z.string().optional(),
})

const deleteStockTransactionSchema = z.object({
  id: z.string().min(1, '交易紀錄 ID 不可為空'),
})

// ─── Tool 定義 ────────────────────────────────────────────────────────────

export const LIST_STOCK_TRANSACTIONS_TOOL = {
  name: 'list_stock_transactions',
  description: '取得所有股票交易紀錄，依日期降序排列。',
  schema: listStockTransactionsSchema ?? z.object({}),
}

export const CREATE_STOCK_TRANSACTION_TOOL = {
  name: 'create_stock_transaction',
  description: '新增一筆股票交易紀錄（買入或賣出）。自動帶入 userId 與 createdAt。',
  schema: createStockTransactionSchema,
}

export const DELETE_STOCK_TRANSACTION_TOOL = {
  name: 'delete_stock_transaction',
  description: '刪除指定股票交易紀錄。',
  schema: deleteStockTransactionSchema,
}

// ─── Helper ───────────────────────────────────────────────────────────────

const ok = (data: unknown, message: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ success: true, data, message }) }],
})

const fail = (error: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error }) }],
})

const getUserId = () => {
  const userId = process.env['PORTAL_USER_ID']
  if (!userId) throw new Error('缺少環境變數 PORTAL_USER_ID')
  return userId
}

// ─── Handlers ─────────────────────────────────────────────────────────────

export const handleListStockTransactions = async () => {
  try {
    const userId = getUserId()
    const transactions = await getTransactions(userId)
    return ok(transactions, `共 ${transactions.length} 筆交易紀錄`)
  } catch (err) {
    console.error('[ERROR] list_stock_transactions failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleCreateStockTransaction = async (args: unknown) => {
  const parsed = createStockTransactionSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const id = await createTransaction(userId, parsed.data)
    return ok({ id }, '交易紀錄建立成功')
  } catch (err) {
    console.error('[ERROR] create_stock_transaction failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleDeleteStockTransaction = async (args: unknown) => {
  const parsed = deleteStockTransactionSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    await deleteTransaction(userId, parsed.data.id)
    return ok({ id: parsed.data.id }, '交易紀錄刪除成功')
  } catch (err) {
    console.error('[ERROR] delete_stock_transaction failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}
