/** 帳單來源 */
export type BillSource = 'manual' | 'auto'

/** 銀行設定 */
export interface BankSetting {
  id: string
  userId: string
  bankName: string
  pdfPassword: string
  statementDate: number // 1–31
  isAutoDeducted: boolean
  createdAt: string
  updatedAt: string
}

/** 帳單紀錄 */
export interface Bill {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  totalAmount: number
  dueDate: string // YYYY-MM-DD
  isPaid: boolean
  source: BillSource
  note: string
  createdAt: string
  updatedAt: string
}

export type CreateBankSettingInput = Omit<BankSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateBankSettingInput = Partial<CreateBankSettingInput>

export type CreateBillInput = Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateBillInput = Partial<Omit<Bill, 'id' | 'userId' | 'createdAt'>>
