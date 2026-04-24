/**
 * LLM 包裝 — MiniMax Anthropic-compatible endpoint
 * 設定集中於 my-portal-private/mcp.config.yaml 的 llm 區塊：
 *   base_url   → https://api.minimax.io/anthropic
 *   api_key    → MiniMax API Key
 */

import Anthropic from '@anthropic-ai/sdk'
import config from '../config.js'

// ─── Schema 定義 ────────────────────────────────────────────

export interface TransactionCategorySchema {
  categoryId: string
  categoryName: string
  subCategoryId: string
  subCategoryName: string
}

type LlmResult<T> = { success: true; data: T } | { success: false; error: string }

// ─── Prompt Template ──────────────────────────────────────────

const CLASSIFY_TRANSACTION_PROMPT = `你是一個記帳分類助理。請根據以下消費備註，從提供的分類清單中選擇最合適的大分類與小分類。

消費備註：{note}

分類清單：
{categories}

輸出格式（嚴格 JSON，無任何解釋文字）：
{
  "categoryId": "選擇的大分類 ID",
  "categoryName": "選擇的大分類名稱",
  "subCategoryId": "選擇的小分類 ID",
  "subCategoryName": "選擇的小分類名稱"
}`

// ─── LLM 工廠函式 ────────────────────────────────────────────

function createClient(): Anthropic {
  const baseURL = config.LLM_BASE_URL
  const apiKey = config.LLM_API_KEY

  if (!apiKey) {
    throw new Error('LLM_API_KEY 未設定（請確認 mcp.config.yaml 中 llm.api_key 已填寫）')
  }

  return new Anthropic({
    baseURL: baseURL || undefined,
    apiKey,
  })
}

// ─── 通用 prompt 解析 ────────────────────────────────────────

async function promptForText<T>(
  prompt: string,
  system: string,
  _schemaExample: string
): Promise<LlmResult<T>> {
  const client = createClient()

  const message = await client.messages.create({
    model: 'MiniMax-M2.7',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: `${prompt}\n\n以下是文件內容：\n${system}` },
    ],
  })

  const raw = message.content.find((b) => b.type === 'text')
  const text = raw?.type === 'text' ? raw.text.trim() : ''

  if (!text) {
    return { success: false, error: 'LLM 回覆為空' }
  }

  // 夾帶 markdown code block 的情况：取出第一個 {...} 區塊
  const jsonText = extractJson(text)
  if (!jsonText) {
    return { success: false, error: `無法解析 JSON：${text.slice(0, 100)}` }
  }

  try {
    const data = JSON.parse(jsonText) as T
    return { success: true, data }
  } catch {
    return { success: false, error: `JSON 解析失敗：${jsonText.slice(0, 100)}` }
  }
}

/**
 * 從文字中取出第一個 JSON 物件（{...}）
 */
function extractJson(text: string): string | null {
  const idx = text.indexOf('{')
  if (idx === -1) return null

  let depth = 0
  for (let i = idx; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(idx, i + 1)
    }
  }
  return null
}

// ─── 對外 API ────────────────────────────────────────────────

/**
 * 從 categories.yaml 內容讓 LLM 為消費備註分類
 */
export async function classifyTransaction(
  note: string,
  categoriesYaml: string
): Promise<LlmResult<TransactionCategorySchema>> {
  const prompt = CLASSIFY_TRANSACTION_PROMPT
    .replace('{note}', note)
    .replace('{categories}', categoriesYaml)

  return promptForText<TransactionCategorySchema>(prompt, '', 'TransactionCategorySchema')
}
