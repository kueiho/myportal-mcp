export interface TransactionItem {
  name: string
  quantity: number
  unitPrice: number
  itemAmount: number
}

export interface Transaction {
  id: string
  userId: string
  type: 'expense' | 'income' | 'transfer'
  amount: number
  currency: string
  categoryId: string
  categoryName: string
  subCategoryId: string
  subCategoryName: string
  accountId: string
  accountName: string
  toAccountId: string | null
  toAccountName: string | null
  date: string
  note: string
  imageUrl: string | null
  sourceType: string
  externalId: string
  status: 'staging' | 'confirmed'
  createdAt: string
  updatedAt: string
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
