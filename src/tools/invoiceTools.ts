import { z } from 'zod'
import { readFileSync } from 'fs'
import { createInvoice, getInvoiceByNo } from '../apis/invoiceApi.js'
import { createTransaction } from '../apis/transactionApi.js'
import { classifyTransaction } from '../lib/llm.js'
import { resolve } from 'path'

// 懶載入 categories.yaml（延後至第一次使用）
let _categoriesYaml: string | null = null
function getCategoriesYaml(): string {
  if (_categoriesYaml === null) {
    _categoriesYaml = readFileSync(
      resolve(process.env['HOME'] || '', 'projects/my-portal-private/categories.yaml'),
      'utf-8'
    )
  }
  return _categoriesYaml
}

const invoiceItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  itemAmount: z.number(),
})

const createInvoiceSchema = z.object({
  invoiceNo: z.string().regex(/^[A-Z]{2}\d{8}$/, '發票號碼格式錯誤（需 2 碼大寫英文 + 8 碼數字）'),
  invoiceDate: z.string().regex(/^\d{8}$/, '日期格式需為 YYYYMMDD'),
  amount: z.number().min(0, '金額需大於或等於 0'),
  invoiceStatus: z.string().default(''),
  allowance: z.string().default('否'),
  sellerTaxId: z.string().default(''),
  sellerName: z.string().default(''),
  sellerAddress: z.string().default(''),
  carrierName: z.string().default(''),
  buyerTaxId: z.string().default(''),
  items: z.array(invoiceItemSchema).default([]),
})

// 預設記帳分類（電子發票手機條碼）
const DEFAULT_CATEGORY_ID = 'HZ1QTyRS12XSF4KVnu3z'
const DEFAULT_SUBCATEGORY_ID = 'cVvVcwIC5FI5tobRZpP5'
const DEFAULT_ACCOUNT_ID = 'ahqNYA8JTG3VV3ARnIyC'       // 現金

export const CREATE_INVOICE_TOOL = {
  name: 'create_invoice',
  description: '新增單筆電子發票至 Firestore。自動帶入 userId 與 createdAt，會檢查發票號碼是否重複，並自動建立記帳交易（待分類狀態）。',
  schema: createInvoiceSchema,
}

export const handleCreateInvoice = async (args: unknown) => {
  const parsed = createInvoiceSchema.safeParse(args)
  if (!parsed.success) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: parsed.error.issues.map(i => i.message).join('; '),
        }),
      }],
    }
  }

  const input = parsed.data
  const userId = process.env['PORTAL_USER_ID']
  if (!userId) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ success: false, error: '缺少環境變數 PORTAL_USER_ID' }),
      }],
    }
  }

  try {
    const existing = await getInvoiceByNo(userId, input.invoiceNo)
    if (existing) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: `發票號碼 ${input.invoiceNo} 已存在，請確認`,
          }),
        }],
      }
    }

    // 建立發票
    const invoiceId = await createInvoice(userId, input)

    // 自動建立記帳交易
    const itemNames = input.items
      .map(item => item.name)
      .filter(Boolean)
      .join('、')

    const note = itemNames
      ? `${input.sellerName || ''}｜${itemNames}`
      : input.sellerName || ''

    // LLM 分類
    let categoryId = DEFAULT_CATEGORY_ID
    let categoryName = '電子發票手機條碼'
    let subCategoryId = DEFAULT_SUBCATEGORY_ID
    let subCategoryName = '電子發票手機條碼'
    let status: 'staging' | 'confirmed' = 'staging'

    try {
      const llmResult = await classifyTransaction(note, getCategoriesYaml())
      if (llmResult.success) {
        categoryId = llmResult.data.categoryId
        categoryName = llmResult.data.categoryName
        subCategoryId = llmResult.data.subCategoryId
        subCategoryName = llmResult.data.subCategoryName
        status = 'confirmed'
      } else {
        console.error('[WARN] LLM 分類失敗，使用預設分類:', llmResult.error)
      }
    } catch (err) {
      console.error('[WARN] LLM 分類例外，使用預設分類:', err)
    }

    const transactionId = await createTransaction(userId, {
      type: 'expense',
      amount: input.amount,
      currency: 'TWD',
      categoryId,
      categoryName,
      subCategoryId,
      subCategoryName,
      accountId: DEFAULT_ACCOUNT_ID,
      accountName: '現金',
      toAccountId: null,
      toAccountName: null,
      date: input.invoiceDate,
      note,
      imageUrl: null,
      sourceType: 'E_INVOICE',
      externalId: input.invoiceNo,
      status,
    })

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          data: {
            invoiceId,
            transactionId,
            categoryName,
            subCategoryName,
            status,
          },
          message: status === 'confirmed'
            ? `發票建立成功，已自動建立記帳交易（LLM 分類：${categoryName} / ${subCategoryName}）`
            : '發票建立成功，已自動建立記帳交易（待分類）',
        }),
      }],
    }
  } catch (err) {
    console.error('[ERROR] create_invoice failed:', err)
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : '未知錯誤',
        }),
      }],
    }
  }
}
