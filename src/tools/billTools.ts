import { z } from 'zod'
import {
  getBankSettings,
  createBankSetting,
  updateBankSetting,
  deleteBankSetting,
  getBills,
  createBill,
  updateBill,
  deleteBill,
} from '../apis/billApi.js'

// ─── Zod Schemas ──────────────────────────────────────────────────────────

const listBankSettingsSchema = z.object({}).optional()

const createBankSettingSchema = z.object({
  bankName: z.string().min(1, '銀行名稱不可為空'),
  pdfPassword: z.string().default(''),
  statementDate: z.number().int().min(1).max(31, '結帳日需介於 1–31'),
  isAutoDeducted: z.boolean().default(false),
})

const updateBankSettingSchema = z.object({
  id: z.string().min(1, '銀行設定 ID 不可為空'),
  bankName: z.string().min(1).optional(),
  pdfPassword: z.string().optional(),
  statementDate: z.number().int().min(1).max(31).optional(),
  isAutoDeducted: z.boolean().optional(),
})

const deleteBankSettingSchema = z.object({
  id: z.string().min(1, '銀行設定 ID 不可為空'),
})

const listBillsSchema = z.object({
  isPaid: z.boolean().optional().describe('篩選已繳/未繳，不傳則取得全部'),
})

const createBillSchema = z.object({
  bankId: z.string().min(1, '銀行設定 ID 不可為空'),
  bankName: z.string().min(1, '銀行名稱不可為空'),
  totalAmount: z.number().min(0, '金額需大於或等於 0'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD'),
  isPaid: z.boolean().default(false),
  source: z.enum(['manual', 'auto']).default('manual'),
  note: z.string().default(''),
})

const updateBillSchema = z.object({
  id: z.string().min(1, '帳單 ID 不可為空'),
  bankId: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
  totalAmount: z.number().min(0).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isPaid: z.boolean().optional(),
  source: z.enum(['manual', 'auto']).optional(),
  note: z.string().optional(),
})

const deleteBillSchema = z.object({
  id: z.string().min(1, '帳單 ID 不可為空'),
})

// ─── Tool 定義 ────────────────────────────────────────────────────────────

export const LIST_BANK_SETTINGS_TOOL = {
  name: 'list_bank_settings',
  description: '取得所有銀行（信用卡）設定清單。',
  schema: listBankSettingsSchema ?? z.object({}),
}

export const CREATE_BANK_SETTING_TOOL = {
  name: 'create_bank_setting',
  description: '新增銀行（信用卡）設定。',
  schema: createBankSettingSchema,
}

export const UPDATE_BANK_SETTING_TOOL = {
  name: 'update_bank_setting',
  description: '更新銀行設定欄位。',
  schema: updateBankSettingSchema,
}

export const DELETE_BANK_SETTING_TOOL = {
  name: 'delete_bank_setting',
  description: '刪除指定銀行設定。',
  schema: deleteBankSettingSchema,
}

export const LIST_BILLS_TOOL = {
  name: 'list_bills',
  description: '取得帳單清單。可依 isPaid 篩選未繳或已繳帳單。',
  schema: listBillsSchema ?? z.object({}),
}

export const CREATE_BILL_TOOL = {
  name: 'create_bill',
  description: '新增一筆帳單紀錄。',
  schema: createBillSchema,
}

export const UPDATE_BILL_TOOL = {
  name: 'update_bill',
  description: '更新帳單欄位，也可用來標記為已繳（isPaid: true）。',
  schema: updateBillSchema,
}

export const DELETE_BILL_TOOL = {
  name: 'delete_bill',
  description: '刪除指定帳單。',
  schema: deleteBillSchema,
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

// ─── BankSetting Handlers ─────────────────────────────────────────────────

export const handleListBankSettings = async () => {
  try {
    const userId = getUserId()
    const settings = await getBankSettings(userId)
    return ok(settings, `共 ${settings.length} 筆銀行設定`)
  } catch (err) {
    console.error('[ERROR] list_bank_settings failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleCreateBankSetting = async (args: unknown) => {
  const parsed = createBankSettingSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const id = await createBankSetting(userId, parsed.data)
    return ok({ id }, '銀行設定建立成功')
  } catch (err) {
    console.error('[ERROR] create_bank_setting failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleUpdateBankSetting = async (args: unknown) => {
  const parsed = updateBankSettingSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  const { id, ...updates } = parsed.data
  if (Object.keys(updates).length === 0) return fail('至少需提供一個要更新的欄位')

  try {
    const userId = getUserId()
    await updateBankSetting(userId, id, updates)
    return ok({ id }, '銀行設定更新成功')
  } catch (err) {
    console.error('[ERROR] update_bank_setting failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleDeleteBankSetting = async (args: unknown) => {
  const parsed = deleteBankSettingSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    await deleteBankSetting(userId, parsed.data.id)
    return ok({ id: parsed.data.id }, '銀行設定刪除成功')
  } catch (err) {
    console.error('[ERROR] delete_bank_setting failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

// ─── Bill Handlers ────────────────────────────────────────────────────────

export const handleListBills = async (args: unknown) => {
  const parsed = (listBillsSchema ?? z.object({})).safeParse(args ?? {})
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const filter = parsed.data && 'isPaid' in parsed.data ? { isPaid: parsed.data.isPaid } : undefined
    const bills = await getBills(userId, filter)
    return ok(bills, `共 ${bills.length} 筆帳單`)
  } catch (err) {
    console.error('[ERROR] list_bills failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleCreateBill = async (args: unknown) => {
  const parsed = createBillSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const id = await createBill(userId, parsed.data)
    return ok({ id }, '帳單建立成功')
  } catch (err) {
    console.error('[ERROR] create_bill failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleUpdateBill = async (args: unknown) => {
  const parsed = updateBillSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  const { id, ...updates } = parsed.data
  if (Object.keys(updates).length === 0) return fail('至少需提供一個要更新的欄位')

  try {
    const userId = getUserId()
    await updateBill(userId, id, updates)
    return ok({ id }, '帳單更新成功')
  } catch (err) {
    console.error('[ERROR] update_bill failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleDeleteBill = async (args: unknown) => {
  const parsed = deleteBillSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    await deleteBill(userId, parsed.data.id)
    return ok({ id: parsed.data.id }, '帳單刪除成功')
  } catch (err) {
    console.error('[ERROR] delete_bill failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}
