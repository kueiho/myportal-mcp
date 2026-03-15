/** 文件分類 */
export type DocCategory = '需求' | '規格' | '計畫' | '筆記' | '其他'

/** Markdown 文件 */
export interface MDDocument {
  id: string
  userId: string
  title: string
  content: string
  tags: DocCategory[]
  isPinned: boolean
  isFavorite: boolean
  isPublic: boolean
  createdAt: number // ms timestamp
  updatedAt: number // ms timestamp
}

/** 新增/編輯表單資料 */
export type MDDocumentFormData = Omit<MDDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
