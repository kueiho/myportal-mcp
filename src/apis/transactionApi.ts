import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { CreateTransactionInput, Transaction } from '../types/Transaction.js'

const db = () => getFirestore()

const balanceDelta = (
  type: CreateTransactionInput['type'],
  amount: number
): number | null => {
  if (type === 'expense') return -amount
  if (type === 'income') return amount
  return null
}

export const createTransaction = async (
  userId: string,
  input: CreateTransactionInput
): Promise<string> => {
  const firestore = db()
  const txCollection = firestore
    .collection('users')
    .doc(userId)
    .collection('transactions')
  const txRef = txCollection.doc()

  const delta =
    input.status === 'confirmed' ? balanceDelta(input.type, input.amount) : null

  await firestore.runTransaction(async (t) => {
    let accountExists = false
    if (delta !== null && input.accountId) {
      const accountRef = firestore
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc(input.accountId)
      const accountSnap = await t.get(accountRef)
      accountExists = accountSnap.exists
      if (accountExists) {
        t.update(accountRef, {
          balance: FieldValue.increment(delta),
          updatedAt: FieldValue.serverTimestamp(),
        })
      } else {
        console.error(
          `[WARN] account ${input.accountId} not found for user ${userId}, skipping balance update`
        )
      }
    }

    t.set(txRef, {
      ...input,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  return txRef.id
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
