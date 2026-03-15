import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { CreateTransactionInput, Transaction } from '../types/Transaction.js'

const db = () => getFirestore()

export const createTransaction = async (
  userId: string,
  input: CreateTransactionInput
): Promise<string> => {
  const docRef = await db()
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .add({
      ...input,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

  return docRef.id
}

export const getTransactionByExternalId = async (
  userId: string,
  externalId: string
): Promise<Transaction | null> => {
  const snapshot = await db()
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .where('externalId', '==', externalId)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data['createdAt']?.toDate?.()?.toISOString() ?? '',
    updatedAt: data['updatedAt']?.toDate?.()?.toISOString() ?? '',
  } as Transaction
}
