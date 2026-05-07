export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  itemAmount: number
}

/** 電子發票（存於 users/{userId}/invoices 子集合，userId 由路徑承載） */
export interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  amount: number
  invoiceStatus: string
  allowance: string
  sellerTaxId: string
  sellerName: string
  sellerAddress: string
  carrierName: string
  buyerTaxId: string
  items: InvoiceItem[]
  createdAt: string
}

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'createdAt'>
