import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { CreateInvoiceInput, Invoice } from '../types/Invoice.js'

const db = () => getFirestore()

export const getInvoiceByNo = async (
  userId: string,
  invoiceNo: string
): Promise<Invoice | null> => {
  const snapshot = await db()
    .collection('invoices')
    .where('userId', '==', userId)
    .where('invoiceNo', '==', invoiceNo)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data['createdAt']?.toDate?.()?.toISOString() ?? '',
  } as Invoice
}

export const createInvoice = async (
  userId: string,
  input: CreateInvoiceInput
): Promise<string> => {
  const docRef = await db()
    .collection('invoices')
    .add({
      ...input,
      userId,
      createdAt: FieldValue.serverTimestamp(),
    })

  return docRef.id
}
