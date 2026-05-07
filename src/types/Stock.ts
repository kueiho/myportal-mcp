/** 交易類型 */
export type TransactionType = 'buy' | 'sell'

/** 股票交易紀錄（存於 users/{userId}/stocks 子集合，userId 由路徑承載） */
export interface StockTransaction {
  id: string
  type: TransactionType
  symbol: string    // 股票代碼，例如 2330
  name: string      // 股票名稱，例如 台積電
  price: number     // 成交價
  shares: number    // 股數
  fee: number       // 手續費
  tax?: number      // 證交稅（賣出時）
  date: string      // YYYY-MM-DD
  notes?: string    // 備註
  createdAt: number // ms timestamp
}

export type CreateStockTransactionInput = Omit<StockTransaction, 'id' | 'createdAt'>
