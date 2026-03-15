import { z } from 'zod'
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  deleteDocuments,
} from '../apis/mdDocumentApi.js'

// ─── Zod Schemas ──────────────────────────────────────────────────────────

const docCategorySchema = z.enum(['需求', '規格', '計畫', '筆記', '其他'])

const listDocumentsSchema = z.object({}).optional()

const getDocumentSchema = z.object({
  id: z.string().min(1, '文件 ID 不可為空'),
})

const createDocumentSchema = z.object({
  title: z.string().min(1, '標題不可為空'),
  content: z.string().default(''),
  tags: z.array(docCategorySchema).default([]),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),
})

const updateDocumentSchema = z.object({
  id: z.string().min(1, '文件 ID 不可為空'),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  tags: z.array(docCategorySchema).optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

const deleteDocumentSchema = z.object({
  id: z.string().min(1, '文件 ID 不可為空'),
})

const deleteDocumentsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, '至少需提供一個文件 ID'),
})

// ─── Tool 定義 ────────────────────────────────────────────────────────────

export const LIST_DOCUMENTS_TOOL = {
  name: 'list_documents',
  description: '取得所有 Markdown 文件清單，依更新時間降序排列。',
  schema: listDocumentsSchema ?? z.object({}),
}

export const GET_DOCUMENT_TOOL = {
  name: 'get_document',
  description: '依 ID 取得單筆 Markdown 文件內容。',
  schema: getDocumentSchema,
}

export const CREATE_DOCUMENT_TOOL = {
  name: 'create_document',
  description: '新增一筆 Markdown 文件。自動帶入 userId 與時間戳。',
  schema: createDocumentSchema,
}

export const UPDATE_DOCUMENT_TOOL = {
  name: 'update_document',
  description: '更新指定 Markdown 文件的欄位（標題、內容、標籤、置頂、收藏、公開）。',
  schema: updateDocumentSchema,
}

export const DELETE_DOCUMENT_TOOL = {
  name: 'delete_document',
  description: '刪除單筆 Markdown 文件。',
  schema: deleteDocumentSchema,
}

export const DELETE_DOCUMENTS_TOOL = {
  name: 'delete_documents',
  description: '批次刪除多筆 Markdown 文件。',
  schema: deleteDocumentsSchema,
}

// ─── Helper ───────────────────────────────────────────────────────────────

const ok = (data: unknown, message: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ success: true, data, message }) }],
})

const fail = (error: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error }) }],
})

const getUserId = () => {
  const userId = process.env['PORTAL_USER_ID']
  if (!userId) throw new Error('缺少環境變數 PORTAL_USER_ID')
  return userId
}

// ─── Handlers ─────────────────────────────────────────────────────────────

export const handleListDocuments = async () => {
  try {
    const userId = getUserId()
    const docs = await getDocuments(userId)
    return ok(docs, `共 ${docs.length} 筆文件`)
  } catch (err) {
    console.error('[ERROR] list_documents failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleGetDocument = async (args: unknown) => {
  const parsed = getDocumentSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const doc = await getDocumentById(userId, parsed.data.id)
    if (!doc) return fail(`文件 ${parsed.data.id} 不存在或無權限`)
    return ok(doc, '取得文件成功')
  } catch (err) {
    console.error('[ERROR] get_document failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleCreateDocument = async (args: unknown) => {
  const parsed = createDocumentSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    const userId = getUserId()
    const id = await createDocument(userId, parsed.data)
    return ok({ id }, '文件建立成功')
  } catch (err) {
    console.error('[ERROR] create_document failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleUpdateDocument = async (args: unknown) => {
  const parsed = updateDocumentSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  const { id, ...updates } = parsed.data
  if (Object.keys(updates).length === 0) return fail('至少需提供一個要更新的欄位')

  try {
    getUserId()
    await updateDocument(id, updates)
    return ok({ id }, '文件更新成功')
  } catch (err) {
    console.error('[ERROR] update_document failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleDeleteDocument = async (args: unknown) => {
  const parsed = deleteDocumentSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    getUserId()
    await deleteDocument(parsed.data.id)
    return ok({ id: parsed.data.id }, '文件刪除成功')
  } catch (err) {
    console.error('[ERROR] delete_document failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}

export const handleDeleteDocuments = async (args: unknown) => {
  const parsed = deleteDocumentsSchema.safeParse(args)
  if (!parsed.success) return fail(parsed.error.issues.map(i => i.message).join('; '))

  try {
    getUserId()
    await deleteDocuments(parsed.data.ids)
    return ok({ ids: parsed.data.ids }, `已刪除 ${parsed.data.ids.length} 筆文件`)
  } catch (err) {
    console.error('[ERROR] delete_documents failed:', err)
    return fail(err instanceof Error ? err.message : '未知錯誤')
  }
}
