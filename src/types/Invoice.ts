export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  itemAmount: number
}

export interface Invoice {
  id: string
  userId: string
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

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'userId' | 'createdAt'>
