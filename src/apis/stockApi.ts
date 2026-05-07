import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { StockTransaction, CreateStockTransactionInput } from '../types/Stock.js'

const db = () => getFirestore()

const stocksCol = (userId: string) =>
  db().collection('users').doc(userId).collection('stocks')

/** 取得使用者所有交易紀錄 */
export const getTransactions = async (userId: string): Promise<StockTransaction[]> => {
  const snapshot = await stocksCol(userId).orderBy('date', 'desc').get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data['date']?.toDate ? data['date'].toDate().toISOString().slice(0, 10) : data['date'],
      createdAt: data['createdAt']?.toMillis?.() ?? data['createdAt'] ?? 0,
    } as StockTransaction
  })
}

/** 新增交易紀錄 */
export const createTransaction = async (
  userId: string,
  input: CreateStockTransactionInput
): Promise<string> => {
  const docRef = await stocksCol(userId).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

/** 刪除交易紀錄 */
export const deleteTransaction = async (userId: string, id: string): Promise<void> => {
  await stocksCol(userId).doc(id).delete()
}
