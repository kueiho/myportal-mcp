import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type {
  BankSetting,
  Bill,
  CreateBankSettingInput,
  UpdateBankSettingInput,
  CreateBillInput,
  UpdateBillInput,
} from '../types/Bill.js'

const db = () => getFirestore()

const bankSettingsCol = (userId: string) =>
  db().collection('users').doc(userId).collection('bankSettings')

const billsCol = (userId: string) =>
  db().collection('users').doc(userId).collection('bills')

// ─── BankSetting CRUD ─────────────────────────────────────────────────────

/** 取得所有銀行設定 */
export const getBankSettings = async (userId: string): Promise<BankSetting[]> => {
  const snapshot = await bankSettingsCol(userId).orderBy('createdAt', 'asc').get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data['createdAt']?.toDate?.()?.toISOString() ?? '',
      updatedAt: data['updatedAt']?.toDate?.()?.toISOString() ?? '',
    } as BankSetting
  })
}

/** 新增銀行設定 */
export const createBankSetting = async (userId: string, input: CreateBankSettingInput): Promise<string> => {
  const docRef = await bankSettingsCol(userId).add({
    userId,
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

/** 更新銀行設定 */
export const updateBankSetting = async (userId: string, id: string, input: UpdateBankSettingInput): Promise<void> => {
  await bankSettingsCol(userId).doc(id).update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

/** 刪除銀行設定 */
export const deleteBankSetting = async (userId: string, id: string): Promise<void> => {
  await bankSettingsCol(userId).doc(id).delete()
}

// ─── Bill CRUD ────────────────────────────────────────────────────────────

/** 取得帳單（可依 isPaid 篩選） */
export const getBills = async (
  userId: string,
  filter?: { isPaid?: boolean }
): Promise<Bill[]> => {
  let q: FirebaseFirestore.Query = billsCol(userId)

  if (filter?.isPaid !== undefined) {
    q = q.where('isPaid', '==', filter.isPaid)
  }

  q = q.orderBy('dueDate', filter?.isPaid ? 'desc' : 'asc')

  const snapshot = await q.get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data['createdAt']?.toDate?.()?.toISOString() ?? '',
      updatedAt: data['updatedAt']?.toDate?.()?.toISOString() ?? '',
    } as Bill
  })
}

/** 新增帳單 */
export const createBill = async (userId: string, input: CreateBillInput): Promise<string> => {
  const docRef = await billsCol(userId).add({
    userId,
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

/** 更新帳單 */
export const updateBill = async (userId: string, id: string, input: UpdateBillInput): Promise<void> => {
  await billsCol(userId).doc(id).update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

/** 刪除帳單 */
export const deleteBill = async (userId: string, id: string): Promise<void> => {
  await billsCol(userId).doc(id).delete()
}
