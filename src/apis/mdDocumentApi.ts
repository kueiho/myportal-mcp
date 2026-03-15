import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { MDDocument, MDDocumentFormData } from '../types/MDDocument.js'

const db = () => getFirestore()
const COLLECTION = 'mdDocuments'

/** 取得使用者所有文件 */
export const getDocuments = async (userId: string): Promise<MDDocument[]> => {
  const snapshot = await db()
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data['createdAt']?.toMillis?.() ?? data['createdAt'] ?? 0,
      updatedAt: data['updatedAt']?.toMillis?.() ?? data['updatedAt'] ?? 0,
    } as MDDocument
  })
}

/** 取得單筆文件 */
export const getDocumentById = async (userId: string, id: string): Promise<MDDocument | null> => {
  const docSnap = await db().collection(COLLECTION).doc(id).get()
  if (!docSnap.exists) return null

  const data = docSnap.data()!
  if (data['userId'] !== userId) return null

  return {
    id: docSnap.id,
    ...data,
    createdAt: data['createdAt']?.toMillis?.() ?? data['createdAt'] ?? 0,
    updatedAt: data['updatedAt']?.toMillis?.() ?? data['updatedAt'] ?? 0,
  } as MDDocument
}

/** 新增文件，回傳 id */
export const createDocument = async (userId: string, input: MDDocumentFormData): Promise<string> => {
  const docRef = await db().collection(COLLECTION).add({
    ...input,
    userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

/** 更新文件 */
export const updateDocument = async (id: string, updates: Partial<MDDocumentFormData>): Promise<void> => {
  await db().collection(COLLECTION).doc(id).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

/** 刪除單筆文件 */
export const deleteDocument = async (id: string): Promise<void> => {
  await db().collection(COLLECTION).doc(id).delete()
}

/** 批次刪除多筆文件 */
export const deleteDocuments = async (ids: string[]): Promise<void> => {
  const batch = db().batch()
  for (const id of ids) {
    batch.delete(db().collection(COLLECTION).doc(id))
  }
  await batch.commit()
}
