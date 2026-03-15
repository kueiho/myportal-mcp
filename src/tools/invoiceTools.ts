import { z } from 'zod'
import { createInvoice, getInvoiceByNo } from '../apis/invoiceApi.js'
import { createTransaction } from '../apis/transactionApi.js'

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

// 預設記帳分類（需確認 ID 是否正確）
const DEFAULT_CATEGORY_ID = 'ngatIUe0rkljtLanvgU0'      // 其他
const DEFAULT_SUBCATEGORY_ID = 'IC55k7oDyfzMmhFsG8Fk'  // 未分類
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

    const transactionId = await createTransaction(userId, {
      type: 'expense',
      amount: input.amount,
      currency: 'TWD',
      categoryId: DEFAULT_CATEGORY_ID,
      categoryName: '其他',
      subCategoryId: DEFAULT_SUBCATEGORY_ID,
      subCategoryName: '未分類',
      accountId: DEFAULT_ACCOUNT_ID,
      accountName: '現金',
      toAccountId: null,
      toAccountName: null,
      date: input.invoiceDate,
      note,
      imageUrl: null,
      sourceType: 'E_INVOICE',
      externalId: input.invoiceNo,
      status: 'staging',
    })

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          data: {
            invoiceId,
            transactionId,
          },
          message: '發票建立成功，已自動建立記帳交易（待分類）',
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
