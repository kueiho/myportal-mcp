// 環境變數集中管理
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

// 嘗試讀取 my-portal-private/mcp.config.yaml
let privateConfig: Record<string, unknown> = {}
try {
  const privateConfigPath = path.join(process.cwd(), '../my-portal-private/mcp.config.yaml')
  if (fs.existsSync(privateConfigPath)) {
    privateConfig = yaml.load(fs.readFileSync(privateConfigPath, 'utf8')) as Record<string, unknown>
  }
} catch {
  // 忽略錯誤（可能檔案不存在）
}

const llmConfig = (privateConfig.llm as Record<string, string>) ?? {}

export default {
  // Firebase
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  PORTAL_USER_ID: process.env.PORTAL_USER_ID,

  // MiniMax LLM
  LLM_BASE_URL: llmConfig.base_url ?? '',
  LLM_API_KEY: llmConfig.api_key ?? '',
}
